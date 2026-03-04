import os
import json
import xml.etree.ElementTree as ET
import shutil

# Paths
base_path = os.getcwd()
images_path = os.path.join(base_path, "annotated-images")
splits_path = os.path.join(base_path, "splits.json")

output_images_train = os.path.join(base_path, "dataset/images/train")
output_images_val = os.path.join(base_path, "dataset/images/val")
output_labels_train = os.path.join(base_path, "dataset/labels/train")
output_labels_val = os.path.join(base_path, "dataset/labels/val")

# Create output directories
os.makedirs(output_images_train, exist_ok=True)
os.makedirs(output_images_val, exist_ok=True)
os.makedirs(output_labels_train, exist_ok=True)
os.makedirs(output_labels_val, exist_ok=True)

# Load split info
with open(splits_path, "r") as f:
    splits = json.load(f)

def convert(xml_file, output_label_path):
    tree = ET.parse(xml_file)
    root = tree.getroot()

    size = root.find("size")
    width = int(size.find("width").text)
    height = int(size.find("height").text)

    yolo_lines = []

    for obj in root.findall("object"):
        class_id = 0  # only pothole class
        bndbox = obj.find("bndbox")

        xmin = int(bndbox.find("xmin").text)
        ymin = int(bndbox.find("ymin").text)
        xmax = int(bndbox.find("xmax").text)
        ymax = int(bndbox.find("ymax").text)

        # Convert to YOLO format
        x_center = ((xmin + xmax) / 2) / width
        y_center = ((ymin + ymax) / 2) / height
        box_width = (xmax - xmin) / width
        box_height = (ymax - ymin) / height

        yolo_lines.append(f"{class_id} {x_center} {y_center} {box_width} {box_height}")

    with open(output_label_path, "w") as f:
        f.write("\n".join(yolo_lines))

# Process train set
for xml_name in splits["train"]:
    xml_path = os.path.join(images_path, xml_name)
    tree = ET.parse(xml_path)
    root = tree.getroot()
    image_name = root.find("filename").text

    image_src = os.path.join(images_path, image_name)
    image_dst = os.path.join(output_images_train, image_name)
    label_dst = os.path.join(output_labels_train, image_name.replace(".jpg", ".txt"))

    shutil.copy(image_src, image_dst)
    convert(xml_path, label_dst)

# Process test set → we use as val
for xml_name in splits["test"]:
    xml_path = os.path.join(images_path, xml_name)
    tree = ET.parse(xml_path)
    root = tree.getroot()
    image_name = root.find("filename").text

    image_src = os.path.join(images_path, image_name)
    image_dst = os.path.join(output_images_val, image_name)
    label_dst = os.path.join(output_labels_val, image_name.replace(".jpg", ".txt"))

    shutil.copy(image_src, image_dst)
    convert(xml_path, label_dst)

print("Conversion completed successfully!")