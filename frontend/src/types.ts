export interface Magnet {
  id: string;
  filename: string;
  size: number;
  status: string; // "Ready", "Processing", "Downloading", "Error"
  downloaded?: number;
  processingPerc?: number;
  links?: { link: string; filename: string }[];
}

export interface DownloadTask {
  filename: string;
  progress: number;
  speed: string;
  status: string;
  size: number;
  downloaded: number;
  error?: string;
}

export interface ApiResponse<T> {
  status: "success" | "error";
  data?: T;
  error?: string;
}
