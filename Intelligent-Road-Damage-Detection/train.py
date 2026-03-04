from ultralytics import YOLO

def main():
    model = YOLO("yolov8n.pt")

    model.train(
        data="data.yaml",
        epochs=40,
        imgsz=640,
        batch=4,
        device="cpu",
        amp=False,      # disable mixed precision
        lr0=0.001       # lower learning rate
    )

if __name__ == "__main__":
    main()