import type { ApiResponse, Magnet, DownloadTask } from "./types";

const API_BASE = import.meta.env.PROD ? "" : "http://localhost:8085";

export const api = {
  getMagnets: async (): Promise<ApiResponse<{ magnets: Magnet[] }>> => {
    const res = await fetch(`${API_BASE}/api/magnets`);
    return res.json();
  },

  uploadFile: async (file: File): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/api/upload`, {
      method: "POST",
      body: formData,
    });
    return res.json();
  },

  uploadMagnet: async (magnet: string): Promise<ApiResponse<any>> => {
    const res = await fetch(`${API_BASE}/api/upload?magnet=${encodeURIComponent(magnet)}`, {
      method: "POST",
    });
    return res.json();
  },

  download: async (link: string, filename: string, category: "movies" | "series"): Promise<ApiResponse<{ task_id: string }>> => {
    const res = await fetch(`${API_BASE}/api/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ link, filename, category }),
    });
    return res.json();
  },

  getTasks: async (): Promise<Record<string, DownloadTask>> => {
    const res = await fetch(`${API_BASE}/api/tasks`);
    return res.json();
  }
};
