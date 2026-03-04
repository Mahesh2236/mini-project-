import os
import io
import base64
import random
import json
import sqlite3
import smtplib
from email.message import EmailMessage
from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from ultralytics import YOLO
from PIL import Image
import numpy as np

app = FastAPI()

# Enable CORS for React development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# --- Persistence Logic ---
DB_FILE = "reports.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_id TEXT,
            citizen_name TEXT,
            citizen_email TEXT,
            citizen_phone TEXT,
            location TEXT,
            pothole_count INTEGER,
            severity TEXT,
            priority TEXT,
            confidence REAL,
            image_path TEXT,
            processed_image_path TEXT,
            status TEXT DEFAULT 'OPEN',
            created_at TEXT
        )
    ''')
    
    # Try adding missing column if migrating from old DB schema
    try:
        cursor.execute('ALTER TABLE reports ADD COLUMN processed_image_path TEXT')
    except sqlite3.OperationalError:
        pass # Column might already exist
    
    conn.commit()
    conn.close()

init_db()

def save_report_to_db(report_data):
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO reports (
                report_id, citizen_name, citizen_email, location,
                pothole_count, severity, priority, confidence, image_path, processed_image_path, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            report_data.get('report_id'),
            report_data.get('citizen_name'),
            report_data.get('citizen_email'),
            report_data.get('location'),
            report_data.get('pothole_count'),
            report_data.get('severity'),
            report_data.get('priority'),
            report_data.get('confidence'),
            report_data.get('image_path'),
            report_data.get('processed_image_path'),
            report_data.get('status', 'OPEN'),
            report_data.get('created_at')
        ))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"DB Save Error: {e}")

# --- Email Automation Logic ---
def send_confirmation_email_task(user_name: str, user_email: str, report_id: str, pothole_count: int, severity: str, priority: str):
    if not user_email or "@" not in user_email:
        print(f"Skipping email to {user_name} - Invalid address: {user_email}")
        return
        
    msg = EmailMessage()
    msg['Subject'] = f"Road Damage Complaint Registered – {report_id}"
    msg['From'] = "notify@nationalroadinfrastructure.gov.in" # Dummy sender
    msg['To'] = user_email
    
    body = f"""Hello {user_name or 'Citizen'},

Your road damage complaint has been successfully registered.

Report Details:
Report ID: {report_id}
Detected Potholes: {pothole_count}
Highest Severity: {severity}
Priority Level: {priority}

Thank you for helping improve road infrastructure.

Regards  
National Road Infrastructure Assessment System
"""
    msg.set_content(body)
    
    try:
        # Connect to Gmail's SMTP server
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls() # Secure the connection
        # Login with your real email and an App Password (NOT your normal password)
        # TODO: Replace with your actual Gmail and Google App Password
        server.login("YOUR_EMAIL@gmail.com", "YOUR_APP_PASSWORD") 
        server.send_message(msg)
        server.quit()
        print(f"Successfully sent REAL confirmation to {user_email} for {report_id}")
    except Exception as e:
        print(f"Failed to send automated email: {e}")

# --- Model Loading Logic ---
def find_best_model():
    search_dir = "runs/detect"
    if os.path.exists(search_dir):
        try:
            train_dirs = sorted([d for d in os.listdir(search_dir) if d.startswith("train")], reverse=True)
            for d in train_dirs:
                p = os.path.join(search_dir, d, "weights", "best.pt")
                if os.path.exists(p):
                    return p
        except Exception:
            pass
    return "yolov8n.pt"

# Robustly initialize model into app state
model_path = find_best_model()
print(f"Loading model into app state from: {model_path}")
app.state.model = YOLO(model_path)

@app.post("/detect")
async def detect_damage(
    request: Request,
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    citizen_name: Optional[str] = Form(""),
    citizen_email: Optional[str] = Form(""),
    location: Optional[str] = Form("")
):
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 images allowed")

    try:
        results_list = []
        for file in files:
            # Save original file to disk
            timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            safe_filename = file.filename.replace(" ", "_").replace("/", "_").replace("\\", "_")
            file_path = os.path.join("uploads", f"{timestamp_str}_{safe_filename}")
            
            contents = await file.read()
            with open(file_path, "wb") as f:
                f.write(contents)
            
            # Read image for processing
            image = Image.open(io.BytesIO(contents)).convert("RGB")
            width, height = image.size
            full_area = width * height
            
            # Run detection using state-stored model
            results = request.app.state.model(image)
            
            # Process results
            boxes = results[0].boxes
            detections = []
            severity_weights = []
            max_conf = 0.0
            
            if boxes is not None:
                for box in boxes:
                    confidence = float(box.conf[0])
                    if confidence < 0.6: continue
                    
                    if confidence > max_conf: max_conf = confidence
                    
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    bbox_area = (x2 - x1) * (y2 - y1)
                    
                    area_ratio = (bbox_area / full_area) * 100
                    weight = 1 if area_ratio < 4 else 2 if area_ratio <= 10 else 3
                    
                    severity_weights.append(weight)
                    detections.append({
                        "confidence": confidence,
                        "weight": weight,
                        "bbox": [x1, y1, x2, y2]
                    })
            
            report = None
            if detections:
                pothole_count = len(detections)
                density_weight = 1 if pothole_count == 1 else 2 if pothole_count <= 3 else 3
                conf_multiplier = 1.0 if max_conf <= 0.85 else 1.2
                
                avg_severity = sum(severity_weights) / len(severity_weights)
                base_score = (avg_severity * 0.6) + (density_weight * 0.4)
                final_score = base_score * conf_multiplier
                
                if final_score < 1.5:
                    priority, action = "LOW", "Monitor"
                elif final_score <= 2.5:
                    priority, action = "MEDIUM", "Schedule Repair"
                elif final_score <= 3.2:
                    priority, action = "HIGH", "Immediate Maintenance"
                else:
                    priority, action = "CRITICAL", "Emergency Response Required"
                
                max_weight = max(severity_weights)
                severity_label = "Minor" if max_weight == 1 else "Moderate" if max_weight == 2 else "Severe"
                
                report_id = f"RD-{datetime.now().year}-{random.randint(10000, 99999)}"
                report = {
                    "report_id": report_id,
                    "detected_potholes": pothole_count,
                    "highest_severity": severity_label,
                    "priority_level": priority,
                    "recommended_action": action,
                    "confidence_level": f"{max_conf:.4f}",
                    "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }
                
                # Result image logic
                result_img = results[0].plot()
                res_pil = Image.fromarray(result_img[:, :, ::-1])
                processed_filename = f"proc_{timestamp_str}_{safe_filename}"
                processed_file_path = os.path.join("uploads", processed_filename)
                
                # Use RGB mode for saving to avoid JPEG error
                res_pil = res_pil.convert("RGB")
                res_pil.save(processed_file_path, format="JPEG")

                # Save report to DB
                save_report_to_db({
                    "report_id": report_id,
                    "citizen_name": citizen_name,
                    "citizen_email": citizen_email,
                    "location": location,
                    "pothole_count": pothole_count,
                    "severity": severity_label,
                    "priority": priority,
                    "confidence": float(max_conf),
                    "image_path": file_path,
                    "processed_image_path": processed_file_path,
                    "status": "OPEN",
                    "created_at": datetime.now().isoformat()
                })
                
                # Automatically enqueue the confirmation email
                if citizen_email:
                    background_tasks.add_task(
                        send_confirmation_email_task,
                        citizen_name,
                        citizen_email,
                        report_id,
                        pothole_count,
                        severity_label,
                        priority
                    )
            else:
                processed_file_path = file_path # If no detections, original is processed
            
            results_list.append({
                "filename": file.filename,
                "detections": detections,
                "image_url": f"/{file_path}",
                "processed_image_url": f"/{processed_file_path}",
                "report": report
            })
            
        return {"results": results_list}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/report/{report_id}")
def get_report(report_id: str):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM reports WHERE report_id = ?
    ''', (report_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Report not found")
        
    data = dict(row)
    return {
        "report_id": data["report_id"],
        "citizen_name": data["citizen_name"],
        "citizen_email": data["citizen_email"],
        "location": data["location"],
        "detected_potholes": data["pothole_count"],
        "highest_severity": data["severity"],
        "priority_level": data["priority"],
        "confidence_level": f"{data['confidence']:.4f}",
        "recommended_action": "Monitor" if data["priority"] == "LOW" else "Schedule Repair" if data["priority"] == "MEDIUM" else "Immediate Maintenance" if data["priority"] == "HIGH" else "Emergency Response Required",
        "generated_at": data["created_at"],
        "processed_image_url": f"/{data['processed_image_path']}",
        "original_image_url": f"/{data['image_path']}"
    }

@app.post("/send-email/{report_id}")
def send_email(report_id: str):
    # Retrieve report to ensure exists
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM reports WHERE report_id = ?
    ''', (report_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Report not found")
        
    data = dict(row)
    try:
        msg = EmailMessage()
        msg['Subject'] = f"Road Damage Complaint Registered – {data['report_id']}"
        msg['From'] = "YOUR_EMAIL@gmail.com"
        msg['To'] = data['citizen_email']
        
        body = f"""Hello {data['citizen_name'] or 'Citizen'},

Your road damage complaint has been successfully registered.

Report Details:
Report ID: {data['report_id']}
Detected Potholes: {data['pothole_count']}
Highest Severity: {data['severity']}
Priority Level: {data['priority']}

Thank you for helping improve road infrastructure.

Regards  
National Road Infrastructure Assessment System
"""
        msg.set_content(body)

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls() 
        # TODO: Replace with your actual Gmail and Google App Password
        server.login("maheshcscl2236@gmail.com", "czcrfhzfgisddild") 
        server.send_message(msg)
        server.quit()
        print(f"Successfully sent REAL confirmation to {data['citizen_email']} for {data['report_id']}")
    except Exception as e:
        print(f"Failed to send automated email via endpoint: {e}")
        raise HTTPException(status_code=500, detail="Failed to send email")
    
    return {"status": "success", "message": "Email sent successfully!"}

@app.get("/health")
def health_check():
    return {"status": "ok", "model": model_path}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
