# CV Lab

A computer vision playground for learning object detection and tracking through hands-on experimentation.

## Features

- **Image Detection** — upload an image and run detection with configurable model and confidence
- **Video Tracking** — upload a video, get per-frame track data with scrubable results
- **Live Webcam** — real-time tracking via WebSocket at ~20 fps

## Models

| Name | Type | Notes |
|------|------|-------|
| yolov8n | Detection | Fastest, lowest accuracy |
| yolov8s | Detection | Good balance |
| yolov8m | Detection | More accurate |
| yolov8l | Detection | High accuracy |
| yolov8x | Detection | Highest accuracy |
| yolov8n-seg | Segmentation | Instance masks |
| rtdetr-l | Detection | Transformer-based |
| rtdetr-x | Detection | Transformer, highest accuracy |

## Running Locally

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# API available at http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# UI available at http://localhost:5173
```

## Architecture

```
Browser (React + Vite + TypeScript)
  ├── Image Detection tab  →  POST /detect
  ├── Video Tracking tab   →  POST /track/video
  └── Live Webcam tab      →  WS  /track/ws

FastAPI Backend
  ├── /health
  ├── /models
  ├── /detect
  └── /track/{video,ws}
        └── ultralytics (YOLOv8, RT-DETR, ByteTrack)
```

## Roadmap

- [ ] Annotated video export (Phase 4)
- [ ] Side-by-side model comparison (Phase 5)
- [ ] Architecture explainer panel (Phase 6)
