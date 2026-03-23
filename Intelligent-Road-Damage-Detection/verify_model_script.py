from ultralytics import YOLO
import os

def test_detection(model_path, image_path):
    print(f"\n--- Testing Model: {model_path} ---")
    if not os.path.exists(model_path):
        print(f"Error: {model_path} not found.")
        return
    
    if not os.path.exists(image_path):
        print(f"Error: {image_path} not found.")
        return

    model = YOLO(model_path)
    results = model(image_path, conf=0.25) # Lower confidence for verification
    
    boxes = results[0].boxes
    print(f"Found {len(boxes)} detections.")
    
    for i, box in enumerate(boxes):
        conf = float(box.conf[0])
        cls = int(box.cls[0])
        name = model.names[cls]
        print(f"  Detection {i+1}: {name} (Confidence: {conf:.2f})")
    
    output_name = f"verify_{os.path.basename(model_path)}_{os.path.basename(image_path)}"
    results[0].save(output_name)
    print(f"Result saved to: {output_name}")

if __name__ == "__main__":
    # Test with best.pt if it exists, otherwise yolov8n.pt
    model_to_test = "best.pt" if os.path.exists("best.pt") else "yolov8n.pt"
    test_detection(model_to_test, "test.jpg")
