import { useState, useEffect } from "react";
import { Cpu, Image, Video, Camera } from "lucide-react";
import { ImageDetect } from "./components/ImageDetect";
import { WebcamTrack } from "./components/WebcamTrack";
import { VideoTrack } from "./components/VideoTrack";

type Tab = "image-detect" | "video-track" | "webcam-track";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "image-detect", label: "Image Detection", icon: <Image size={16} /> },
  { id: "video-track", label: "Video Tracking", icon: <Video size={16} /> },
  { id: "webcam-track", label: "Live Webcam", icon: <Camera size={16} /> },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("image-detect");
  const [models, setModels] = useState<string[]>([]);
  const [backendReady, setBackendReady] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(() => {
        setBackendReady(true);
        return fetch("/api/models");
      })
      .then((r) => r.json())
      .then((d) => setModels(d.models))
      .catch(() => setBackendReady(false));
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Cpu size={22} color="var(--accent)" />
        <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.5px" }}>CV Lab</span>
        <span style={{ color: "var(--text-muted)", fontSize: 13, marginLeft: 4 }}>
          Computer Vision Playground
        </span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background:
                backendReady === null
                  ? "var(--yellow)"
                  : backendReady
                  ? "var(--green)"
                  : "var(--red)",
            }}
          />
          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
            {backendReady === null ? "connecting…" : backendReady ? "backend ready" : "backend offline"}
          </span>
        </div>
      </header>

      {/* Tabs */}
      <div
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          padding: "0 24px",
          display: "flex",
          gap: 4,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: "none",
              border: "none",
              borderBottom: tab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
              color: tab === t.id ? "var(--text)" : "var(--text-muted)",
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: tab === t.id ? 600 : 400,
              transition: "color 0.15s",
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main style={{ flex: 1, padding: 24, maxWidth: 1200, width: "100%", margin: "0 auto" }}>
        {backendReady === false && (
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--red)",
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
              color: "var(--red)",
            }}
          >
            Backend is not reachable. Start it with:{" "}
            <code style={{ fontFamily: "monospace", background: "var(--surface2)", padding: "2px 6px", borderRadius: 4 }}>
              cd backend && uvicorn main:app --reload
            </code>
          </div>
        )}

        {tab === "image-detect" && <ImageDetect models={models.length ? models : ["yolov8n"]} />}
        {tab === "video-track" && <VideoTrack models={models.length ? models : ["yolov8n"]} />}
        {tab === "webcam-track" && <WebcamTrack models={models.length ? models : ["yolov8n"]} />}
      </main>
    </div>
  );
}
