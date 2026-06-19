export type Mode = "detect" | "track";
export type Source = "upload" | "webcam";

export interface Detection {
  bbox: [number, number, number, number];
  confidence: number;
  class_id: number;
  class_name: string;
}

export interface Track extends Detection {
  track_id: number;
}

export interface DetectResult {
  detections: Detection[];
  annotated_image: string;
  model: string;
}

export interface TrackVideoResult {
  model: string;
  total_frames: number;
  frames: Array<{ frame: number; tracks: Track[] }>;
}

export interface WsTrackResult {
  tracks: Track[];
  annotated_image: string;
}
