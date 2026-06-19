import base64
import io
import json

import cv2
import numpy as np
from fastapi import APIRouter, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from PIL import Image

from ..models import get_model

router = APIRouter(prefix="/track")


@router.post("/video")
async def track_video(
    file: UploadFile = File(...),
    model_name: str = "yolov8n",
    confidence: float = 0.25,
):
    """Process an uploaded video file and return per-frame tracking results as JSON."""
    contents = await file.read()
    tmp_path = f"/tmp/{file.filename}"
    with open(tmp_path, "wb") as f:
        f.write(contents)

    model = get_model(model_name)
    cap = cv2.VideoCapture(tmp_path)

    frames_results = []
    frame_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        results = model.track(frame, conf=confidence, persist=True, verbose=False)[0]
        tracks = []
        for box in results.boxes:
            track_id = int(box.id[0]) if box.id is not None else -1
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            tracks.append(
                {
                    "track_id": track_id,
                    "bbox": [x1, y1, x2, y2],
                    "confidence": float(box.conf[0]),
                    "class_id": int(box.cls[0]),
                    "class_name": results.names[int(box.cls[0])],
                }
            )
        frames_results.append({"frame": frame_idx, "tracks": tracks})
        frame_idx += 1

    cap.release()
    return JSONResponse({"model": model_name, "total_frames": frame_idx, "frames": frames_results})


@router.websocket("/ws")
async def track_stream(websocket: WebSocket):
    """WebSocket endpoint for real-time frame-by-frame tracking.

    Client sends: JSON { model_name, confidence, frame_b64 }
    Server sends: JSON { tracks, annotated_image }
    """
    await websocket.accept()
    current_model_name = None
    model = None

    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)

            model_name = payload.get("model_name", "yolov8n")
            confidence = float(payload.get("confidence", 0.25))
            frame_b64 = payload["frame_b64"]

            if model_name != current_model_name:
                model = get_model(model_name)
                current_model_name = model_name

            img_bytes = base64.b64decode(frame_b64)
            img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            frame = np.array(img)

            results = model.track(frame, conf=confidence, persist=True, verbose=False)[0]

            tracks = []
            for box in results.boxes:
                track_id = int(box.id[0]) if box.id is not None else -1
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                tracks.append(
                    {
                        "track_id": track_id,
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
            pil_img.save(buf, format="JPEG", quality=75)
            encoded = base64.b64encode(buf.getvalue()).decode()

            await websocket.send_text(
                json.dumps(
                    {
                        "tracks": tracks,
                        "annotated_image": f"data:image/jpeg;base64,{encoded}",
                    }
                )
            )
    except WebSocketDisconnect:
        pass
