from functools import lru_cache

from ultralytics import YOLO

SUPPORTED_MODELS = {
    "yolov8n": "yolov8n.pt",
    "yolov8s": "yolov8s.pt",
    "yolov8m": "yolov8m.pt",
    "yolov8l": "yolov8l.pt",
    "yolov8x": "yolov8x.pt",
    "yolov8n-seg": "yolov8n-seg.pt",
    "rtdetr-l": "rtdetr-l.pt",
    "rtdetr-x": "rtdetr-x.pt",
}


@lru_cache(maxsize=4)
def get_model(name: str) -> YOLO:
    if name not in SUPPORTED_MODELS:
        raise ValueError(f"Unknown model '{name}'. Choose from: {list(SUPPORTED_MODELS)}")
    return YOLO(SUPPORTED_MODELS[name])
