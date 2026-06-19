interface Props {
  models: string[];
  selected: string;
  confidence: number;
  onChange: (model: string) => void;
  onConfidenceChange: (v: number) => void;
}

export function ModelSelector({ models, selected, confidence, onChange, onConfidenceChange }: Props) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>Model</span>
        <select
          value={selected}
          onChange={(e) => onChange(e.target.value)}
          style={{
            background: "var(--surface2)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "6px 10px",
            minWidth: 140,
          }}
        >
          {models.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
          Confidence: {confidence.toFixed(2)}
        </span>
        <input
          type="range"
          min={0.05}
          max={0.95}
          step={0.05}
          value={confidence}
          onChange={(e) => onConfidenceChange(parseFloat(e.target.value))}
          style={{ width: 120, accentColor: "var(--accent)" }}
        />
      </label>
    </div>
  );
}
