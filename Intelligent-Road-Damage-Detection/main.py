import os # reCAPTCHA reload
import io
import uuid
import json
import sqlite3
import smtplib
from email.message import EmailMessage
from typing import List, Optional
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from ultralytics import YOLO
from PIL import Image
import httpx
import hashlib
import secrets
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Load .env credentials safely
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ─── Email Config ─────────────────────────────────────────────────────
EMAIL_USER = os.getenv("EMAIL_USER", "")
EMAIL_PASS = os.getenv("EMAIL_PASS", "")
RECAPTCHA_SECRET_KEY = os.getenv("RECAPTCHA_SECRET_KEY", "")

# ─── Fix 1: Orphan Image Cleanup ──────────────────────────────────────
def cleanup_orphan_images():
    """
    Deletes uploads/tmp_* files older than 1 hour.
    These are images saved during /analyze that were never confirmed via /submit.
    Called once at server startup.
    """
    uploads_dir = "uploads"
    if not os.path.exists(uploads_dir):
        return
    cutoff = datetime.now() - timedelta(hours=1)
    count = 0
    for fname in os.listdir(uploads_dir):
        if fname.startswith("tmp_"):
            fpath = os.path.join(uploads_dir, fname)
            try:
                mtime = datetime.fromtimestamp(os.path.getmtime(fpath))
                if mtime < cutoff:
                    os.remove(fpath)
                    count += 1
            except Exception as e:
                print(f"[Cleanup] Could not remove {fpath}: {e}")
    print(f"[Cleanup] ✅ Removed {count} orphan tmp_ file(s) older than 1 hour")

# ─── Lifespan: startup tasks ──────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs("uploads", exist_ok=True)
    init_db()
    cleanup_orphan_images()   # Fix 1: clean up leftover tmp_ files on boot
    yield

# ─── App Setup ────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="IRDDP API", version="3.2.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ─── WebSocket Manager ────────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        # dictionary: { report_id: [websocket1, websocket2, ...] }
        self.active_connections: dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, report_id: str):
        await websocket.accept()
        if report_id not in self.active_connections:
            self.active_connections[report_id] = []
        self.active_connections[report_id].append(websocket)
        print(f"[WS] Connected tracker for {report_id}. Total: {len(self.active_connections[report_id])}")

    def disconnect(self, websocket: WebSocket, report_id: str):
        if report_id in self.active_connections:
            self.active_connections[report_id].remove(websocket)
            if not self.active_connections[report_id]:
                del self.active_connections[report_id]
        print(f"[WS] Disconnected tracker for {report_id}")

    async def broadcast_status(self, report_id: str, message: dict):
        if report_id in self.active_connections:
            # Create a copy of the list to avoid "size changed during iteration" errors
            for connection in list(self.active_connections[report_id]):
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"[WS] Send error to tracker: {e}")
                    self.disconnect(connection, report_id)

manager = ConnectionManager()

# ─── Database ─────────────────────────────────────────────────────────
DB_FILE = "reports.db"

def init_db():
    # Fix 5: use context manager for DB safety
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS reports (
                id                    INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id             TEXT UNIQUE,
                citizen_name          TEXT,
                citizen_email         TEXT,
                citizen_phone         TEXT,
                location              TEXT,
                total_potholes        INTEGER DEFAULT 0,
                worst_severity        TEXT,
                overall_priority      TEXT,
                max_confidence        REAL,
                image_count           INTEGER DEFAULT 1,
                image_paths           TEXT,
                processed_image_paths TEXT,
                status                TEXT DEFAULT 'Pending',
                admin_note            TEXT DEFAULT '',
                latitude              REAL,
                longitude             REAL,
                address               TEXT,
                title                 TEXT,
                description           TEXT,
                created_at            TEXT,
                updated_at            TEXT
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS admins (
                id       INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT, -- In production, use hashed passwords
                name     TEXT
            )
        ''')
        # Seed default admin if none exists (for dev convenience)
        cursor.execute("SELECT count(*) FROM admins")
        if cursor.fetchone()[0] == 0:
            cursor.execute("INSERT INTO admins (username, password, name) VALUES (?, ?, ?)", 
                           ("admin", "admin123", "Road Authority Admin"))

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS otp_verifications (
                email      TEXT PRIMARY KEY,
                otp_hash   TEXT,
                otp_code   TEXT,
                expires_at TEXT,
                verified   INTEGER DEFAULT 0,
                updated_at TEXT
            )
        ''')
        migrations = [
            "ALTER TABLE reports ADD COLUMN total_potholes INTEGER DEFAULT 0",
            "ALTER TABLE reports ADD COLUMN worst_severity TEXT",
            "ALTER TABLE reports ADD COLUMN overall_priority TEXT",
            "ALTER TABLE reports ADD COLUMN max_confidence REAL",
            "ALTER TABLE reports ADD COLUMN image_count INTEGER DEFAULT 1",
            "ALTER TABLE reports ADD COLUMN image_paths TEXT",
            "ALTER TABLE reports ADD COLUMN processed_image_paths TEXT",
            "ALTER TABLE reports ADD COLUMN admin_note TEXT DEFAULT ''",
            "ALTER TABLE reports ADD COLUMN updated_at TEXT",
            "ALTER TABLE reports ADD COLUMN latitude REAL",
            "ALTER TABLE reports ADD COLUMN longitude REAL",
            "ALTER TABLE reports ADD COLUMN address TEXT",
            "ALTER TABLE reports ADD COLUMN title TEXT",
            "ALTER TABLE reports ADD COLUMN description TEXT",
        ]
        for sql in migrations:
            try:
                cursor.execute(sql)
            except sqlite3.OperationalError:
                pass
        # Update status to Pending if it was OPEN (compat with previous versions)
        cursor.execute("UPDATE reports SET status = 'Pending' WHERE status = 'OPEN'")

def save_report_to_db(data: dict):
    try:
        # Fix 5: context manager — auto-commits on success, auto-rolls back on exception
        with sqlite3.connect(DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO reports (
                    report_id, citizen_name, citizen_email, citizen_phone, location,
                    total_potholes, worst_severity, overall_priority, max_confidence,
                    image_count, image_paths, processed_image_paths, status,
                    latitude, longitude, address, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                data.get("report_id"),
                data.get("citizen_name", ""),
                data.get("citizen_email", ""),
                data.get("citizen_phone", ""),
                data.get("location", ""),
                data.get("total_potholes", 0),
                data.get("worst_severity", ""),
                data.get("overall_priority", ""),
                data.get("max_confidence", 0.0),
                data.get("image_count", 1),
                json.dumps(data.get("image_paths", [])),
                json.dumps(data.get("processed_image_paths", [])),
                data.get("status", "Pending"),
                data.get("latitude"),
                data.get("longitude"),
                data.get("address", ""),
                data.get("created_at", datetime.now().isoformat()),
            ))
        print(f"[DB] ✅ Saved report {data.get('report_id')}")
    except Exception as e:
        print(f"[DB] ❌ Save Error: {e}")

# ─── Fix 3 & 4: File Type + Size Validation ───────────────────────────
MAX_FILE_SIZE_BYTES  = 10 * 1024 * 1024   # 10 MB per image
MAX_BATCH_SIZE_BYTES = 50 * 1024 * 1024   # 50 MB total

MAGIC_BYTES = {
    "jpeg": (b"\xFF\xD8\xFF",),
    "png":  (b"\x89\x50\x4E\x47",),
    # WEBP: starts with RIFF at 0 and WEBP at byte 8
}

def validate_image_file(filename: str, contents: bytes) -> None:
    """
    Raises HTTPException(400) if:
    - file size exceeds 10 MB
    - magic bytes don't match JPEG, PNG, or WEBP
    """
    # Size check
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail={
                "filename": filename,
                "reason": f"File too large ({len(contents) // (1024*1024)}MB). Max allowed is 10MB per image."
            }
        )
    # Magic bytes check
    header = contents[:12]
    is_jpeg = header[:3] == b"\xFF\xD8\xFF"
    is_png  = header[:4] == b"\x89\x50\x4E\x47"
    is_webp = header[:4] == b"\x52\x49\x46\x46" and header[8:12] == b"\x57\x45\x42\x50"

    if not (is_jpeg or is_png or is_webp):
        raise HTTPException(
            status_code=400,
            detail={
                "filename": filename,
                "reason": "Invalid file type. Only JPEG, PNG, and WEBP images are accepted."
            }
        )

# ─── Email ────────────────────────────────────────────────────────────
def send_email_task(
    citizen_name: str,
    citizen_email: str,
    report_id: str,
    total_potholes: int,
    worst_severity: str,
    overall_priority: str,
    image_count: int,
    location: str,
):
    if not citizen_email or "@" not in citizen_email:
        print(f"[Email] Skipping — invalid address: {citizen_email}")
        return

    action_map = {
        "LOW":      "Regular monitoring has been scheduled.",
        "MEDIUM":   "A repair has been scheduled.",
        "HIGH":     "Immediate maintenance has been flagged.",
        "CRITICAL": "Emergency response team has been notified.",
        "CLEAR":    "No action needed — road is in good condition.",
    }
    action_note = action_map.get(overall_priority, "Under review.")

    msg = EmailMessage()
    msg["Subject"] = f"Road Damage Report Confirmed — {report_id}"
    msg["From"]    = EMAIL_USER
    msg["To"]      = citizen_email

    body = f"""Hello {citizen_name or 'Citizen'},

Your road damage report has been officially submitted and recorded.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REPORT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Report ID       : {report_id}
Location        : {location or 'Not specified'}
Images Analyzed : {image_count}
Total Potholes  : {total_potholes}
Worst Severity  : {worst_severity}
Priority Level  : {overall_priority}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next Step: {action_note}

Track your report anytime using Report ID: {report_id}

Thank you for helping improve road infrastructure.

Regards,
Intelligent Road Damage Detection and Prioritization System
VI Semester Capstone Project — CSE
"""
    msg.set_content(body)

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(EMAIL_USER, EMAIL_PASS)
        server.send_message(msg)
        server.quit()
        print(f"[Email] ✅ Sent to {citizen_email} for {report_id}")
    except smtplib.SMTPAuthenticationError as e:
        print(f"[Email] ❌ Auth failed — SMTP code: {e.smtp_code}, message: {e.smtp_error}")
        print(f"[Email]    EMAIL_USER={EMAIL_USER}")
        print(f"[Email]    EMAIL_PASS length={len(EMAIL_PASS)} chars (should be 16)")
    except Exception as e:
        print(f"[Email] ❌ Failed ({type(e).__name__}): {e}")

# ─── OTP Helpers ──────────────────────────────────────────────────────
def send_otp_email(email: str, otp: str):
    msg = EmailMessage()
    msg["Subject"] = f"Verification Code — {otp}"
    msg["From"]    = EMAIL_USER
    msg["To"]      = email

    body = f"""Your verification code is: {otp}

This code will expire in 5 minutes.
If you did not request this code, please ignore this email.

Regards,
IRDDP Security Team
"""
    msg.set_content(body)

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(EMAIL_USER, EMAIL_PASS)
        server.send_message(msg)
        server.quit()
        print(f"[OTP] ✅ Sent to {email}")
        return True
    except Exception as e:
        print(f"[OTP] ❌ Failed to send to {email}: {e}")
        return False

async def verify_recaptcha(token: str):
    if RECAPTCHA_SECRET_KEY == "YOUR_RECAPTCHA_SECRET_HERE":
        print("[reCAPTCHA] ⚠️ Secret Key not configured. Skipping verification (DEV MODE).")
        return 1.0

    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(
                "https://www.google.com/recaptcha/api/siteverify",
                data={
                    "secret": RECAPTCHA_SECRET_KEY,
                    "response": token
                },
                timeout=10.0
            )
            data = res.json()
            if not data.get("success"):
                print(f"[reCAPTCHA] ❌ Verification failed: {data.get('error-codes')}")
                return 0.0
            # For v2, 'score' is not present. Default to 1.0 if success is True.
            return data.get("score", 1.0)
        except Exception as e:
            print(f"[reCAPTCHA] ❌ API Error: {e}")
            return 0.0

# --- Priority Helpers ---
PRIORITY_ORDER = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

def score_to_priority(score: float) -> tuple:
    if score < 1.5:  return "LOW",      "Monitor"
    if score <= 2.5: return "MEDIUM",   "Schedule Repair"
    if score <= 3.2: return "HIGH",     "Immediate Maintenance"
    return            "CRITICAL",  "Emergency Response Required"

def pick_worst_priority(p1: str, p2: str) -> str:
    i1 = PRIORITY_ORDER.index(p1) if p1 in PRIORITY_ORDER else 0
    i2 = PRIORITY_ORDER.index(p2) if p2 in PRIORITY_ORDER else 0
    return PRIORITY_ORDER[max(i1, i2)]

def pick_worst_severity(s1: str, s2: str) -> str:
    order = ["Minor", "Moderate", "Severe"]
    i1 = order.index(s1) if s1 in order else 0
    i2 = order.index(s2) if s2 in order else 0
    return order[max(i1, i2)]

def calculate_severity(x1: float, y1: float, x2: float, y2: float,
                       image_width: int, image_height: int) -> tuple:
    """
    Improved severity calculation with 3 factors:

    1. AREA RATIO     — how much of the road is damaged (existing logic)
    2. POSITION FACTOR — center-of-lane potholes are more dangerous than edge ones
    3. SHAPE FACTOR   — square/round potholes are deeper than long thin cracks

    Returns: (adjusted_weight: float, severity_label: str, base_weight: int)
    """
    full_area  = image_width * image_height

    # --- Factor 1: Area ratio ---
    bbox_area  = (x2 - x1) * (y2 - y1)
    area_ratio = (bbox_area / full_area) * 100

    if area_ratio < 4:
        base_weight = 1
        label       = "Minor"
    elif area_ratio <= 10:
        base_weight = 2
        label       = "Moderate"
    else:
        base_weight = 3
        label       = "Severe"

    # --- Factor 2: Position factor ---
    # Horizontal center of pothole vs center of image
    # 0.0 = dead center (most dangerous), 1.0 = at the edge
    bbox_cx      = (x1 + x2) / 2
    img_cx       = image_width / 2
    center_dist  = abs(bbox_cx - img_cx) / (image_width / 2)
    # Center potholes get up to +20% boost, edge potholes get -0% (neutral)
    position_factor = 1.2 - (0.2 * center_dist)   # range: 1.0 to 1.2

    # --- Factor 3: Shape factor ---
    # Aspect ratio: 1.0 = perfect square (deep pothole), 0.0 = very elongated (surface crack)
    w       = max(x2 - x1, 1)
    h       = max(y2 - y1, 1)
    aspect  = min(w, h) / max(w, h)                # range: 0.0 to 1.0
    # Square potholes (aspect ~1.0) get +10% boost, cracks (aspect ~0.1) are neutral
    shape_factor = 0.9 + (0.2 * aspect)            # range: 0.9 to 1.1

    # --- Final adjusted weight ---
    adjusted_weight = base_weight * position_factor * shape_factor

    return adjusted_weight, label, base_weight

# ─── Model ────────────────────────────────────────────────────────────
def find_best_model():
    search_dir = "runs/detect"
    if os.path.exists(search_dir):
        try:
            train_dirs = sorted(
                [d for d in os.listdir(search_dir) if d.startswith("train")],
                reverse=True
            )
            for d in train_dirs:
                p = os.path.join(search_dir, d, "weights", "best.pt")
                if os.path.exists(p):
                    return p
        except Exception:
            pass
    # Finally check root directory
    if os.path.exists("best.pt"):
        return "best.pt"
    return "yolov8n.pt"

model_path = find_best_model()
print(f"[Model] Loading from: {model_path}")
app.state.model = YOLO(model_path)

# ─── /analyze — AI only, NO side effects ─────────────────────────────
@app.post("/analyze")
async def analyze_images(
    request: Request,
    files: List[UploadFile] = File(...),
):
    """
    Phase 1: Run AI detection only.
    Fix 1: Images saved with tmp_ prefix. Renamed to permanent on /submit.
    Fix 3&4: Validates file type (magic bytes) and size before processing.
    Does NOT generate Report ID, does NOT save to DB, does NOT send email.
    """
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 images allowed")

    # Fix 3&4: Read all files first and validate total batch size
    file_contents = []
    total_bytes = 0
    for file in files:
        contents = await file.read()
        total_bytes += len(contents)
        if total_bytes > MAX_BATCH_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail={
                    "filename": file.filename,
                    "reason": "Total batch size exceeds 50MB limit. Please reduce the number or size of images."
                }
            )
        # Fix 3&4: Validate individual file
        validate_image_file(file.filename, contents)
        file_contents.append((file.filename, contents))

    timestamp_base = datetime.now().strftime("%Y%m%d_%H%M%S")
    batch_total_potholes   = 0
    batch_overall_priority = "LOW"
    batch_worst_severity   = "Minor"
    batch_max_confidence   = 0.0
    batch_image_paths      = []
    batch_processed_paths  = []
    batch_has_detection    = False
    results_list           = []

    try:
        for idx, (filename, contents) in enumerate(file_contents):
            timestamp_str = f"{timestamp_base}_{idx:02d}"
            safe_filename = (
                filename
                .replace(" ", "_").replace("/", "_").replace("\\", "_")
            )

            # Fix 1: Save with tmp_ prefix — will be renamed on /submit
            file_path = os.path.join("uploads", f"tmp_{timestamp_str}_{safe_filename}")

            with open(file_path, "wb") as f:
                f.write(contents)

            image        = Image.open(io.BytesIO(contents)).convert("RGB")
            width, height = image.size
            full_area    = width * height

            yolo_results = request.app.state.model(image)
            boxes        = yolo_results[0].boxes

            detections       = []
            severity_weights = []
            max_conf         = 0.0

            if boxes is not None:
                for box in boxes:
                    confidence = float(box.conf[0])
                    if confidence < 0.4:
                        continue
                    if confidence > max_conf:
                        max_conf = confidence

                    x1, y1, x2, y2 = box.xyxy[0].tolist()

                    # Improved severity — position + shape aware
                    adj_weight, sev_label, base_weight = calculate_severity(
                        x1, y1, x2, y2, width, height
                    )

                    severity_weights.append(adj_weight)
                    detections.append({
                        "confidence":   confidence,
                        "weight":       adj_weight,
                        "base_weight":  base_weight,
                        "severity":     sev_label,
                        "bbox":         [x1, y1, x2, y2],
                    })

            processed_file_path = file_path  # default if no detection
            image_report        = None

            if detections:
                batch_has_detection = True
                pothole_count   = len(detections)
                density_weight  = 1 if pothole_count == 1 else 2 if pothole_count <= 3 else 3
                conf_multiplier = 1.0 if max_conf <= 0.85 else 1.2

                # Improved score: max severity drives 70%, avg gives context 30%
                # One critical pothole = critical road, not averaged away
                max_severity    = max(severity_weights)
                avg_severity    = sum(severity_weights) / len(severity_weights)
                combined_sev    = (max_severity * 0.7) + (avg_severity * 0.3)

                base_score      = (combined_sev * 0.6) + (density_weight * 0.4)
                final_score     = base_score * conf_multiplier

                priority, action = score_to_priority(final_score)

                # Severity label based on worst base_weight (not adjusted) for clean display
                worst_base = max(d["base_weight"] for d in detections)
                severity_label = "Minor" if worst_base == 1 else "Moderate" if worst_base == 2 else "Severe"

                batch_total_potholes   += pothole_count
                batch_max_confidence    = max(batch_max_confidence, max_conf)
                batch_overall_priority  = pick_worst_priority(batch_overall_priority, priority)
                batch_worst_severity    = pick_worst_severity(batch_worst_severity, severity_label)

                result_img  = yolo_results[0].plot()
                res_pil     = Image.fromarray(result_img[:, :, ::-1]).convert("RGB")
                # Fix 1: processed image also gets tmp_ prefix
                proc_fname  = f"tmp_proc_{timestamp_str}_{safe_filename}"
                processed_file_path = os.path.join("uploads", proc_fname)
                res_pil.save(processed_file_path, format="JPEG")

                image_report = {
                    "image_index":        idx + 1,
                    "detected_potholes":  pothole_count,
                    "highest_severity":   severity_label,
                    "priority_level":     priority,
                    "recommended_action": action,
                    "confidence_level":   f"{max_conf:.4f}",
                }

            batch_image_paths.append(file_path)
            batch_processed_paths.append(processed_file_path)

            results_list.append({
                "filename":            filename,
                "image_index":         idx + 1,
                "image_url":           f"/{file_path}",
                "processed_image_url": f"/{processed_file_path}",
                "image_report":        image_report,
            })

        action_map = {
            "LOW":      "Monitor",
            "MEDIUM":   "Schedule Repair",
            "HIGH":     "Immediate Maintenance",
            "CRITICAL": "Emergency Response Required",
        }
        batch_summary = {
            "total_images":       len(file_contents),
            "total_potholes":     batch_total_potholes,
            "worst_severity":     batch_worst_severity if batch_has_detection else "None",
            "overall_priority":   batch_overall_priority if batch_has_detection else "CLEAR",
            "recommended_action": action_map.get(batch_overall_priority, "Monitor") if batch_has_detection else "No action needed",
            "max_confidence":     f"{batch_max_confidence:.4f}",
            "has_detection":      batch_has_detection,
        }

        return {
            "batch_summary":    batch_summary,
            "results":          results_list,
            "_image_paths":     batch_image_paths,
            "_processed_paths": batch_processed_paths,
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ─── /submit — Official confirmation: DB + Email + Report ID ──────────
class LocationDetail(BaseModel):
    latitude:  float
    longitude: float
    address:   Optional[str] = ""

class SubmitRequest(BaseModel):
    citizen_name:     str
    citizen_email:    str
    citizen_phone:    Optional[str] = ""
    location_text:    Optional[str] = "" # renaming from 'location' string to avoid conflict
    image_paths:      List[str]
    processed_paths:  List[str]
    total_potholes:   int
    worst_severity:   str
    overall_priority: str
    max_confidence:   str
    has_detection:    bool
    total_images:     int
    captcha_token:    str
    location:         LocationDetail

@app.post("/submit")
@limiter.limit("10/hour")
async def submit_report(request: Request, payload: SubmitRequest, background_tasks: BackgroundTasks):
    """
    Phase 2: Citizen has reviewed and confirmed.
    Fix 1: Renames tmp_ images to permanent names.
    Fix 2: Uses uuid4 for collision-proof Report IDs.
    Fix 5: DB operations use context manager.
    """
    # ── Security Checks ─────────────────────────────────────────────
    # 1. Verify OTP
    if not payload.citizen_email or "@" not in payload.citizen_email:
        raise HTTPException(status_code=400, detail="A valid email is required for verification.")

    with sqlite3.connect(DB_FILE) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        # Ensure we check the LATEST verification status for this email
        cursor.execute("SELECT verified FROM otp_verifications WHERE email = ? ORDER BY updated_at DESC LIMIT 1", (payload.citizen_email,))
        row = cursor.fetchone()
        if not row or not row["verified"]:
            raise HTTPException(status_code=403, detail="Email not verified. Please verify your email first via OTP.")

    # 2. Verify reCAPTCHA
    score = await verify_recaptcha(payload.captcha_token)
    if score < 0.5:
        raise HTTPException(
            status_code=400,
            detail=f"reCAPTCHA verification failed (Score: {score:.1f}). Lower score indicates potential bot."
        )

    # ── Process Submission ──────────────────────────────────────────
    # Fix 2: UUID-based report ID — no collision risk, no silent overwrites
    uid       = uuid.uuid4().hex[:8].upper()
    report_id = f"RD-{datetime.now().year}-{uid}"
    created_at = datetime.now().isoformat()

    # Fix 1: Rename tmp_ files to permanent names
    permanent_image_paths     = []
    permanent_processed_paths = []

    for path in payload.image_paths:
        fname = os.path.basename(path)
        if fname.startswith("tmp_"):
            new_fname = fname[4:]  # strip "tmp_"
            new_path  = os.path.join("uploads", new_fname)
            if os.path.exists(path):
                try:
                    os.rename(path, new_path)
                    permanent_image_paths.append(new_path)
                    print(f"[Submit] Renamed {path} → {new_path}")
                except Exception as e:
                    print(f"[Submit] Could not rename {path}: {e}")
                    permanent_image_paths.append(path)
            elif os.path.exists(new_path):
                # Already renamed in a previous attempt
                permanent_image_paths.append(new_path)
            else:
                # No detections — original tmp_ was never created as processed
                # Keep tmp_ path; file still exists from /analyze upload
                permanent_image_paths.append(path)
        else:
            permanent_image_paths.append(path)

    for i, path in enumerate(payload.processed_paths):
        # No-detection case: processed_path == image_path (same file, already renamed above)
        if path == payload.image_paths[i]:
            permanent_processed_paths.append(permanent_image_paths[i])
            continue

        fname = os.path.basename(path)
        if fname.startswith("tmp_"):
            new_fname = fname[4:]
            new_path  = os.path.join("uploads", new_fname)
            if os.path.exists(path):
                try:
                    os.rename(path, new_path)
                    permanent_processed_paths.append(new_path)
                    print(f"[Submit] Renamed {path} → {new_path}")
                except Exception as e:
                    print(f"[Submit] Could not rename {path}: {e}")
                    permanent_processed_paths.append(path)
            elif os.path.exists(new_path):
                permanent_processed_paths.append(new_path)
            else:
                # Fallback - use the permanent image path
                permanent_processed_paths.append(permanent_image_paths[i])
        else:
            permanent_processed_paths.append(path)

    save_report_to_db({
        "report_id":             report_id,
        "citizen_name":          payload.citizen_name,
        "citizen_email":         payload.citizen_email,
        "citizen_phone":         payload.citizen_phone,
        "location":              payload.location.address,
        "latitude":              payload.location.latitude,
        "longitude":             payload.location.longitude,
        "address":               payload.location.address,
        "total_potholes":        payload.total_potholes,
        "worst_severity":        payload.worst_severity,
        "overall_priority":      payload.overall_priority,
        "max_confidence":        float(payload.max_confidence),
        "image_count":           payload.total_images,
        "image_paths":           permanent_image_paths,
        "processed_image_paths": permanent_processed_paths,
        "status":                "Pending",
        "created_at":            created_at,
    })

    if payload.citizen_email and "@" in payload.citizen_email:
        background_tasks.add_task(
            send_email_task,
            payload.citizen_name,
            payload.citizen_email,
            report_id,
            payload.total_potholes,
            payload.worst_severity,
            payload.overall_priority,
            payload.total_images,
            payload.location.address,
        )

    return {
        "report_id":               report_id,
        "created_at":              created_at,
        "status":                  "Pending",
        "email_sent":              bool(payload.citizen_email and "@" in payload.citizen_email),
        # Return permanent paths so frontend can update image URLs (fixes 404 after rename)
        "permanent_image_paths":     permanent_image_paths,
        "permanent_processed_paths": permanent_processed_paths,
        "location": {
            "latitude":  payload.location.latitude,
            "longitude": payload.location.longitude,
            "address":   payload.location.address,
        }
    }


# ─── /report/{report_id} ──────────────────────────────────────────────
@app.get("/report/{report_id}")
def get_report(report_id: str):
    # Fix 5: context manager
    with sqlite3.connect(DB_FILE) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM reports WHERE report_id = ?", (report_id,))
        row = cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Report not found")

    data = dict(row)

    try:
        image_paths = json.loads(data.get("image_paths") or "[]")
    except Exception:
        image_paths = [data.get("image_paths", "")]
    try:
        processed_paths = json.loads(data.get("processed_image_paths") or "[]")
    except Exception:
        processed_paths = [data.get("processed_image_paths", "")]

    priority = data.get("overall_priority") or data.get("priority", "LOW")
    action_map = {
        "LOW":      "Monitor",
        "MEDIUM":   "Schedule Repair",
        "HIGH":     "Immediate Maintenance",
        "CRITICAL": "Emergency Response Required",
        "CLEAR":    "No action needed",
    }

    return {
        "report_id":           data["report_id"],
        "citizen_name":        data.get("citizen_name", ""),
        "citizen_email":       data.get("citizen_email", ""),
        "citizen_phone":       data.get("citizen_phone", ""),
        "location": {
            "latitude":        data.get("latitude"),
            "longitude":       data.get("longitude"),
            "address":         data.get("address") or data.get("location", ""),
        },
        "detected_potholes":   data.get("total_potholes") or data.get("pothole_count", 0),
        "highest_severity":    data.get("worst_severity") or data.get("severity", ""),
        "priority_level":      priority,
        "confidence_level":    f"{float(data.get('max_confidence') or data.get('confidence') or 0):.4f}",
        "recommended_action":  action_map.get(priority, "Monitor"),
        "image_count":         data.get("image_count", 1),
        "generated_at":        data.get("created_at", ""),
        "status":              data.get("status", "OPEN"),
        "processed_image_url": f"/{processed_paths[0]}" if processed_paths else "",
        "original_image_url":  f"/{image_paths[0]}"     if image_paths     else "",
        "all_image_urls":      [f"/{p}" for p in image_paths],
        "all_processed_urls":  [f"/{p}" for p in processed_paths],
    }


# ─── /send-email/{report_id} ──────────────────────────────────────────
@app.post("/send-email/{report_id}")
def resend_email(report_id: str):
    # Fix 5: context manager
    with sqlite3.connect(DB_FILE) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM reports WHERE report_id = ?", (report_id,))
        row = cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Report not found")

    data = dict(row)
    if not data.get("citizen_email"):
        raise HTTPException(status_code=400, detail="No email address on record for this report")

    priority = data.get("overall_priority") or data.get("priority", "LOW")

    send_email_task(
        citizen_name     = data.get("citizen_name", ""),
        citizen_email    = data["citizen_email"],
        report_id        = data["report_id"],
        total_potholes   = data.get("total_potholes") or data.get("pothole_count", 0),
        worst_severity   = data.get("worst_severity") or data.get("severity", ""),
        overall_priority = priority,
        image_count      = data.get("image_count", 1),
        location         = data.get("location", ""),
    )

    return {"status": "success", "message": f"Email sent to {data['citizen_email']}"}


# ─── OTP Endpoints ────────────────────────────────────────────────────
class OtpRequest(BaseModel):
    email: str

@app.post("/send-otp")
@limiter.limit("5/minute")
async def send_otp(request: Request, payload: OtpRequest):
    email = payload.email
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address")

    otp = "".join([str(secrets.randbelow(10)) for _ in range(6)])
    otp_hash = hashlib.sha256(otp.encode()).hexdigest()
    expires_at = (datetime.now() + timedelta(minutes=5)).isoformat()

    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO otp_verifications (email, otp_hash, otp_code, expires_at, verified, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (email, otp_hash, otp, expires_at, 0, datetime.now().isoformat()))

    success = send_otp_email(email, otp)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send OTP. Please check backend logs.")

    return {"status": "success", "message": "OTP sent successfully"}

class VerifyRequest(BaseModel):
    email: str
    otp: str

@app.post("/verify-otp")
@limiter.limit("10/minute")
async def verify_otp(request: Request, payload: VerifyRequest):
    email = payload.email
    otp = payload.otp

    if not email or not otp:
        raise HTTPException(status_code=400, detail="Email and OTP are required")

    otp_hash = hashlib.sha256(otp.encode()).hexdigest()
    now = datetime.now().isoformat()

    with sqlite3.connect(DB_FILE) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM otp_verifications WHERE email = ? AND otp_hash = ? AND expires_at > ?
        ''', (email, otp_hash, now))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")

        cursor.execute('''
            UPDATE otp_verifications SET verified = 1, updated_at = ? WHERE email = ?
        ''', (now, email))

    return {"status": "success", "message": "Email verified successfully"}



# --- /test-email ---
@app.get("/test-email")
def test_email():
    """Quick test: open http://localhost:8000/test-email in browser to diagnose email."""
    result = {}
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587, timeout=10)
        server.ehlo()
        server.starttls()
        server.ehlo()
        result["smtp_connect"] = "ok"
        server.login(EMAIL_USER, EMAIL_PASS)
        result["smtp_login"] = "ok"
        msg = EmailMessage()
        msg["Subject"] = "IRDDP Email Test"
        msg["From"]    = EMAIL_USER
        msg["To"]      = EMAIL_USER
        msg.set_content("Test email from IRDDP backend. Email is working!")
        server.send_message(msg)
        server.quit()
        result["status"] = "Email sent successfully to " + EMAIL_USER
    except smtplib.SMTPAuthenticationError as e:
        result["smtp_connect"] = "ok"
        result["smtp_login"]   = f"Auth failed - code {e.smtp_code}: {str(e.smtp_error)}"
        result["fix"] = "Regenerate App Password at myaccount.google.com -> Security -> App Passwords"
    except Exception as e:
        result["error"] = f"{type(e).__name__}: {e}"
    result["email_user"]        = EMAIL_USER
    result["email_pass_length"] = len(EMAIL_PASS)
    result["email_configured"]  = EMAIL_PASS != "YOUR_APP_PASSWORD_HERE"
    return result


# ─── Admin Dashboard Endpoints ─────────────────────────────────────────

class AdminLoginRequest(BaseModel):
    username: str
    password: str

@app.post("/admin/login")
async def admin_login(payload: AdminLoginRequest):
    # Simple hardcoded/DB-based check for authority login
    with sqlite3.connect(DB_FILE) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM admins WHERE username = ? AND password = ?", (payload.username, payload.password))
        admin = cursor.fetchone()
        if not admin:
            raise HTTPException(status_code=401, detail="Invalid admin credentials")
        return {"status": "success", "token": "mock-admin-token", "name": admin["name"]}

@app.get("/admin/stats")
async def get_admin_stats():
    with sqlite3.connect(DB_FILE) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT count(*) as total FROM reports")
        total = cursor.fetchone()["total"]
        cursor.execute("SELECT count(*) as pending FROM reports WHERE status = 'Pending'")
        pending = cursor.fetchone()["pending"]
        cursor.execute("SELECT count(*) as review FROM reports WHERE status = 'Under Review'")
        review = cursor.fetchone()["review"]
        cursor.execute("SELECT count(*) as resolved FROM reports WHERE status = 'Resolved'")
        resolved = cursor.fetchone()["resolved"]
        cursor.execute("SELECT count(*) as rejected FROM reports WHERE status = 'Rejected'")
        rejected = cursor.fetchone()["rejected"]
        
        return {
            "total": total,
            "pending": pending,
            "under_review": review,
            "resolved": resolved,
            "rejected": rejected
        }

@app.get("/admin/reports")
async def get_admin_reports():
    with sqlite3.connect(DB_FILE) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM reports ORDER BY created_at DESC")
        reports = [dict(row) for row in cursor.fetchall()]
        # Convert JSON strings back to lists
        for r in reports:
            try:
                r["image_paths"] = json.loads(r["image_paths"])
                r["processed_image_paths"] = json.loads(r["processed_image_paths"])
            except:
                r["image_paths"] = []
                r["processed_image_paths"] = []
            
            # Nest location for consistency
            r["location"] = {
                "latitude":  r.get("latitude"),
                "longitude": r.get("longitude"),
                "address":   r.get("address") or r.get("location", ""),
            }
        return reports

class AdminUpdateRequest(BaseModel):
    status: str
    admin_note: Optional[str] = ""

@app.patch("/admin/reports/{report_id}")
async def update_report_status(report_id: str, payload: AdminUpdateRequest):
    now = datetime.now().isoformat()
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE reports 
            SET status = ?, admin_note = ?, updated_at = ?
            WHERE report_id = ?
        ''', (payload.status, payload.admin_note, now, report_id))
        if conn.total_changes == 0:
            raise HTTPException(status_code=404, detail="Report not found")
        
    # Real-time Broadcast via WebSocket
    await manager.broadcast_status(report_id, {
        "status": payload.status,
        "admin_note": payload.admin_note,
        "updated_at": now
    })
    
    return {"status": "success", "updated_at": now}

@app.delete("/admin/reports/{report_id}")
async def delete_report(report_id: str):
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM reports WHERE report_id = ?", (report_id,))
        if conn.total_changes == 0:
            raise HTTPException(status_code=404, detail="Report not found")
            
    # Also notify via WebSocket so it disappears for anyone watching?
    # Or just return success.
    return {"status": "success", "message": f"Report {report_id} deleted"}

# ─── Citizen Tracking Endpoints ────────────────────────────────────────

@app.get("/track/{report_id}")
async def track_report(report_id: str, email: str):
    with sqlite3.connect(DB_FILE) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM reports WHERE report_id = ? AND citizen_email = ?", (report_id, email))
        report = cursor.fetchone()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found or email mismatch")
        
        report_dict = dict(report)
        try:
            report_dict["image_paths"] = json.loads(report_dict["image_paths"])
            report_dict["processed_image_paths"] = json.loads(report_dict["processed_image_paths"])
        except:
            report_dict["image_paths"] = []
            report_dict["processed_image_paths"] = []
            
        # Nest location for consistency
        report_dict["location"] = {
            "latitude":  report_dict.get("latitude"),
            "longitude": report_dict.get("longitude"),
            "address":   report_dict.get("address") or report_dict.get("location", ""),
        }
            
        return report_dict

@app.websocket("/ws/track/{report_id}")
async def websocket_endpoint(websocket: WebSocket, report_id: str):
    await manager.connect(websocket, report_id)
    try:
        while True:
            # We don't expect messages from client, but we must keep it open
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, report_id)
    except Exception as e:
        print(f"[WS] Error: {e}")
        manager.disconnect(websocket, report_id)

# ─── /health ──────────────────────────────────────────────────────────
@app.get("/health")
def health_check():
    # Fix 7: Verify DB is reachable with SELECT 1
    db_status = "ok"
    try:
        with sqlite3.connect(DB_FILE) as conn:
            conn.execute("SELECT 1")
    except Exception as e:
        db_status = f"error: {e}"

    # Fix 7: Count orphan tmp_ files in uploads/
    orphan_count = 0
    try:
        if os.path.exists("uploads"):
            orphan_count = sum(
                1 for f in os.listdir("uploads") if f.startswith("tmp_")
            )
    except Exception:
        pass

    return {
        "status":            "ok",
        "model":             model_path,
        "model_loaded":      app.state.model is not None,
        "email_user":        EMAIL_USER,
        "email_configured":  EMAIL_PASS != "YOUR_APP_PASSWORD_HERE",
        "db_status":         db_status,           # Fix 7
        "orphan_file_count": orphan_count,        # Fix 7
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)