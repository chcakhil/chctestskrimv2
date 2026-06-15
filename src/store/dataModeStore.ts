import { create } from 'zustand';

export const DATA_MODES = [
  { id: "auto", label: "Auto", description: "Adjusts to your connection speed", icon: "⚡", resolution: "auto" },
  { id: "high", label: "High Quality", description: "Best quality, uses more data", icon: "📶", resolution: "1080p" },
  { id: "medium", label: "Normal", description: "Balanced quality and data", icon: "📱", resolution: "480p" },
  { id: "low", label: "Low Data", description: "Saves data, lower quality", icon: "🌐", resolution: "240p" },
  { id: "ultra_low", label: "Ultra Low", description: "Minimum data use. Audio + thumbnail", icon: "💾", resolution: "thumbnail" }
];

export const detectConnection = () => {
  const nav = navigator as any;
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
  if (!conn) return "auto";
  const type = conn.effectiveType;
  const map: Record<string, string> = { "4g": "high", "3g": "medium", "2g": "low", "slow-2g": "ultra_low" };
  return map[type] || "auto";
};

interface DataModeState {
  dataMode: string;
  setDataMode: (mode: string) => void;
  getEffectiveMode: () => string;
}

export const useDataModeStore = create<DataModeState>((set, get) => ({
  dataMode: localStorage.getItem('skrimchat_data_mode') || 'auto',
  setDataMode: (mode) => {
    localStorage.setItem('skrimchat_data_mode', mode);
    set({ dataMode: mode });
  },
  getEffectiveMode: () => {
    const mode = get().dataMode;
    if (mode === 'auto') {
      return detectConnection();
    }
    return mode;
  }
}));
