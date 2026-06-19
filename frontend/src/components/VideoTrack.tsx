import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { TrackVideoResult, Track } from "../types";
import { DetectionPanel } from "./DetectionPanel";
import { ModelSelector } from "./ModelSelector";

interface Props {
  models: string[];
}

export function VideoTrack({ models }: Props) {
  const [model, setModel] = useState(models[0] ?? "yolov8n");
  const [confidence, setConfidence] = useState(0.25);
  const [result, setResult] = useState<TrackVideoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frameIdx, setFrameIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    setResult(null);
    const form = new FormData();
    form.append("file", file);
    form.append("model_name", model);
    form.append("confidence", String(confidence));

    try {
      const res = await fetch("/api/track/video", { method: "POST", body: form });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data: TrackVideoResult = await res.json();
      setResult(data);
      setFrameIdx(0);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const currentTracks: Track[] = result?.frames[frameIdx]?.tracks ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <ModelSelector
        models={models}
        selected={model}
        confidence={confidence}
        onChange={setModel}
        onConfidenceChange={setConfidence}
      />

      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        style={{
          border: "2px dashed var(--border)",
          borderRadius: 10,
          padding: 40,
          textAlign: "center",
          cursor: "pointer",
          color: "var(--text-muted)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
      >
        <Upload size={32} style={{ marginBottom: 8, color: "var(--accent)" }} />
        <div>Drop a video here or click to browse</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>MP4, AVI, MOV, WEBM</div>
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          style={{ display: "none" }}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {loading && (
        <div style={{ color: "var(--text-muted)", textAlign: "center" }}>
          Processing video… this may take a moment
        </div>
      )}
      {error && <div style={{ color: "var(--red)" }}>{error}</div>}

      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
              Frame {frameIdx + 1} / {result.total_frames} — {result.model}
            </span>
            <input
              type="range"
              min={0}
              max={result.total_frames - 1}
              value={frameIdx}
              onChange={(e) => setFrameIdx(parseInt(e.target.value))}
              style={{ flex: 1, accentColor: "var(--accent)" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
            <div
              style={{
                background: "var(--surface2)",
                borderRadius: 8,
                border: "1px solid var(--border)",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                {currentTracks.length} object{currentTracks.length !== 1 ? "s" : ""} tracked
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                (Annotated video frames coming in Phase 4 — scrub the slider to inspect per-frame track data)
              </div>
            </div>
            <div style={{ overflow: "auto" }}>
              <DetectionPanel items={currentTracks} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
