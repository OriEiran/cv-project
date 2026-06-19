import base64
import io
from typing import Annotated

import cv2
import numpy as np
from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image

from ..models import get_model

router = APIRouter(prefix="/detect")


@router.post("")
async def detect_image(
    file: Annotated[UploadFile, File()],
    model_name: Annotated[str, Form()] = "yolov8n",
    confidence: Annotated[float, Form()] = 0.25,
):
    contents = await file.read()
    img = Image.open(io.BytesIO(contents)).convert("RGB")
    frame = np.array(img)

    model = get_model(model_name)
    results = model(frame, conf=confidence, verbose=False)[0]

    detections = []
    for box in results.boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        detections.append(
            {
                "bbox": [x1, y1, x2, y2],
                "confidence": float(box.conf[0]),
                "class_id": int(box.cls[0]),
                "class_name": results.names[int(box.cls[0])],
            }
        )

    annotated = results.plot()
    annotated_rgb = cv2.cvtColor(annotated, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(annotated_rgb)
    buf = io.BytesIO()
    pil_img.save(buf, format="JPEG", quality=85)
    encoded = base64.b64encode(buf.getvalue()).decode()

    return JSONResponse(
        {
            "detections": detections,
            "annotated_image": f"data:image/jpeg;base64,{encoded}",
            "model": model_name,
        }
    )
