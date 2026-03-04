from ultralytics import YOLO
import streamlit as st
from PIL import Image

st.title("Intelligent Road Damage Detection")

import os

def find_best_model():
    # Try the specific path first
    default_path = "runs/detect/train5/weights/best.pt"
    if os.path.exists(default_path):
        return default_path
    
    # Search for latest training run
    search_dir = "runs/detect"
    if os.path.exists(search_dir):
        train_dirs = sorted([d for d in os.listdir(search_dir) if d.startswith("train")], reverse=True)
        for d in train_dirs:
            p = os.path.join(search_dir, d, "weights", "best.pt")
            if os.path.exists(p):
                return p
    
    # Default to base model if nothing found
    return "yolov8n.pt"

model_path = find_best_model()
model = YOLO(model_path)


uploaded_file = st.file_uploader("Upload Road Image", type=["jpg", "png", "jpeg"])

if uploaded_file is not None:
    image = Image.open(uploaded_file)
    st.image(image, caption="Uploaded Image", use_container_width=True)

    results = model(image)

    boxes = results[0].boxes

    if boxes is not None and len(boxes) > 0:
        detected = False

        for box in boxes:
            confidence = float(box.conf[0])

            # Ignore weak detections
            if confidence < 0.6:
                continue

            detected = True

            x1, y1, x2, y2 = box.xyxy[0]
            area = (x2 - x1) * (y2 - y1)

            if area > 20000:
                priority = "HIGH"
            elif area > 8000:
                priority = "MEDIUM"
            else:
                priority = "LOW"

            st.write(f"Confidence: {confidence:.2f}")
            st.write(f"Priority: {priority}")

        if not detected:
            st.warning("No pothole detected with high confidence.")
    else:
        st.warning("No pothole detected.")

    st.image(results[0].plot(), caption="Detection Result", use_container_width=True)