import { useState, useRef, useEffect, useCallback } from "react";
import { Video, VideoOff } from "lucide-react";
import { WsTrackResult, Track } from "../types";
import { DetectionPanel } from "./DetectionPanel";
import { ModelSelector } from "./ModelSelector";

interface Props {
  models: string[];
}

export function WebcamTrack({ models }: Props) {
  const [model, setModel] = useState(models[0] ?? "yolov8n");
  const [confidence, setConfidence] = useState(0.25);
  const [running, setRunning] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [fps, setFps] = useState(0);
  const [annotatedSrc, setAnnotatedSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<number | null>(null);
  const lastFrameTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const fpsTimer = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (loopRef.current) cancelAnimationFrame(loopRef.current);
    if (fpsTimer.current) clearInterval(fpsTimer.current);
    if (wsRef.current) wsRef.current.close();
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    wsRef.current = null;
    streamRef.current = null;
    loopRef.current = null;
    setRunning(false);
    setAnnotatedSrc(null);
    setTracks([]);
    setFps(0);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const ws = new WebSocket(`${protocol}://${window.location.host}/api/track/ws`);
      wsRef.current = ws;

      ws.onmessage = (e) => {
        const data: WsTrackResult = JSON.parse(e.data);
        setTracks(data.tracks);
        setAnnotatedSrc(data.annotated_image);
        frameCount.current++;
      };

      ws.onerror = () => setError("WebSocket error. Is the backend running?");

      await new Promise<void>((res) => { ws.onopen = () => res(); });

      fpsTimer.current = window.setInterval(() => {
        setFps(frameCount.current);
        frameCount.current = 0;
      }, 1000);

      setRunning(true);

      const sendFrame = () => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video || video.readyState < 2) {
          loopRef.current = requestAnimationFrame(sendFrame);
          return;
        }
        const now = performance.now();
        if (now - lastFrameTime.current < 50) {
          loopRef.current = requestAnimationFrame(sendFrame);
          return;
        }
        lastFrameTime.current = now;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d")!.drawImage(video, 0, 0);
        const frame_b64 = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];

        wsRef.current.send(JSON.stringify({ model_name: model, confidence, frame_b64 }));
        loopRef.current = requestAnimationFrame(sendFrame);
      };

      loopRef.current = requestAnimationFrame(sendFrame);
    } catch (e) {
      setError(String(e));
    }
  }, [model, confidence]);

  useEffect(() => () => stop(), [stop]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
        <ModelSelector
          models={models}
          selected={model}
          confidence={confidence}
          onChange={setModel}
          onConfidenceChange={setConfidence}
        />
        <button
          onClick={running ? stop : start}
          style={{
            background: running ? "var(--red)" : "var(--accent)",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {running ? <VideoOff size={16} /> : <Video size={16} />}
          {running ? "Stop" : "Start Webcam"}
        </button>
        {running && (
          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{fps} fps</span>
        )}
      </div>

      {error && <div style={{ color: "var(--red)" }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
        <div style={{ position: "relative" }}>
          {annotatedSrc ? (
            <img
              src={annotatedSrc}
              alt="tracked"
              style={{ width: "100%", borderRadius: 8, border: "1px solid var(--border)" }}
            />
          ) : (
            <video
              ref={videoRef}
              muted
              style={{
                width: "100%",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "#000",
                display: running ? "block" : "none",
              }}
            />
          )}
          {!running && !annotatedSrc && (
            <div
              style={{
                background: "var(--surface2)",
                borderRadius: 8,
                border: "1px solid var(--border)",
                height: 300,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
              }}
            >
              Camera preview will appear here
            </div>
          )}
        </div>
        <div style={{ overflow: "auto" }}>
          <div style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 8 }}>
            {tracks.length} track{tracks.length !== 1 ? "s" : ""}
          </div>
          <DetectionPanel items={tracks} />
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
