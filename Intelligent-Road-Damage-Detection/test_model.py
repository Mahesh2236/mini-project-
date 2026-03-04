from huggingface_hub import hf_hub_download
from ultralytics import YOLO
import os

# ── Your current model ────────────────────────────
print("Loading your current model (best.pt)...")
your_model = YOLO("best.pt")

# ── cazzz307 — correct filename ──────────────────
print("Downloading cazzz307 pretrained model...")
pretrained_path = hf_hub_download(
    repo_id="cazzz307/Pothole-Finetuned-YoloV8",
    filename="Yolov8-fintuned-on-potholes.pt",   # ← exact filename
    local_dir="pretrained_model"
)
print(f"Downloaded to: {pretrained_path}")
pretrained = YOLO(pretrained_path)

# ── Test image ────────────────────────────────────
TEST_IMAGE = "test.jpg"

# ── Run both ──────────────────────────────────────
print("\n" + "="*50)
print("YOUR MODEL (best.pt)")
print("="*50)
r1 = your_model(TEST_IMAGE, conf=0.6)
print(f"Detections: {len(r1[0].boxes)}")
for b in r1[0].boxes:
    print(f"  Confidence: {float(b.conf[0]):.2%}")
r1[0].save("result_your_model.jpg")
print("Saved → result_your_model.jpg")

print("\n" + "="*50)
print("PRETRAINED MODEL (cazzz307)")
print("="*50)
r2 = pretrained(TEST_IMAGE, conf=0.6)
print(f"Detections: {len(r2[0].boxes)}")
for b in r2[0].boxes:
    print(f"  Confidence: {float(b.conf[0]):.2%}")
r2[0].save("result_pretrained.jpg")
print("Saved → result_pretrained.jpg")

# ── Verdict ───────────────────────────────────────
print("\n" + "="*50)
print("VERDICT")
print("="*50)
yours  = len(r1[0].boxes)
theirs = len(r2[0].boxes)
if theirs > yours:
    print(f"✅ Pretrained found MORE: {theirs} vs your {yours}")
elif theirs < yours:
    print(f"✅ Your model found MORE: {yours} vs pretrained {theirs}")
else:
    print(f"➡️  Both found {yours} — compare confidence scores")