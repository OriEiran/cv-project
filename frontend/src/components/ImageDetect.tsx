import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { DetectResult } from "../types";
import { DetectionPanel } from "./DetectionPanel";
import { ModelSelector } from "./ModelSelector";

interface Props {
  models: string[];
}

export function ImageDetect({ models }: Props) {
  const [model, setModel] = useState(models[0] ?? "yolov8n");
  const [confidence, setConfidence] = useState(0.25);
  const [result, setResult] = useState<DetectResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    form.append("model_name", model);
    form.append("confidence", String(confidence));

    try {
      const res = await fetch("/api/detect", { method: "POST", body: form });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setResult(await res.json());
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
          transition: "border-color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
      >
        <Upload size={32} style={{ marginBottom: 8, color: "var(--accent)" }} />
        <div>Drop an image here or click to browse</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>JPG, PNG, WEBP</div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {loading && (
        <div style={{ color: "var(--text-muted)", textAlign: "center" }}>Running detection…</div>
      )}
      {error && <div style={{ color: "var(--red)" }}>{error}</div>}

      {result && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
          <img
            src={result.annotated_image}
            alt="annotated"
            style={{ width: "100%", borderRadius: 8, border: "1px solid var(--border)" }}
          />
          <div style={{ overflow: "auto" }}>
            <div style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 8 }}>
              {result.detections.length} detection{result.detections.length !== 1 ? "s" : ""} — {result.model}
            </div>
            <DetectionPanel items={result.detections} />
          </div>
        </div>
      )}
    </div>
  );
}
