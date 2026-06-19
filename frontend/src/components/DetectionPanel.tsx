import { Detection, Track } from "../types";

interface Props {
  items: (Detection | Track)[];
}

const COLORS = [
  "#6c63ff", "#f87171", "#4ade80", "#fbbf24", "#60a5fa",
  "#f472b6", "#34d399", "#a78bfa", "#fb923c", "#22d3ee",
];

function colorForClass(classId: number) {
  return COLORS[classId % COLORS.length];
}

export function DetectionPanel({ items }: Props) {
  if (items.length === 0) {
    return (
      <div style={{ color: "var(--text-muted)", textAlign: "center", padding: 24 }}>
        No detections
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((item, i) => {
        const trackId = "track_id" in item ? item.track_id : undefined;
        return (
          <div
            key={i}
            style={{
              background: "var(--surface2)",
              border: `1px solid var(--border)`,
              borderLeft: `3px solid ${colorForClass(item.class_id)}`,
              borderRadius: 6,
              padding: "8px 10px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <span style={{ fontWeight: 600 }}>{item.class_name}</span>
              {trackId !== undefined && (
                <span style={{ color: "var(--text-muted)", marginLeft: 8, fontSize: 12 }}>
                  #{trackId}
                </span>
              )}
            </div>
            <span
              style={{
                background: "var(--surface)",
                padding: "2px 8px",
                borderRadius: 12,
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              {(item.confidence * 100).toFixed(1)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
