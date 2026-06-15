import { create } from 'zustand';

export interface OfflineVibe {
  id: string;
  caption: string;
  creator: any;
  thumbnail: string;
  videoUrl: string;
  savedAt: number;
  expiresAt: number;
}

interface OfflineState {
  offlineVibes: OfflineVibe[];
  downloadStates: Record<string, 'idle' | 'downloading' | 'saved' | 'error'>;
  loadVibes: () => void;
  cleanExpiredVibes: () => void;
  downloadVibe: (vibe: any) => Promise<void>;
  deleteVibe: (id: string) => void;
  getDownloadState: (id: string) => 'idle' | 'downloading' | 'saved' | 'error';
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  offlineVibes: [],
  downloadStates: {},
  loadVibes: () => {
    get().cleanExpiredVibes();
    const saved = JSON.parse(localStorage.getItem("skrimchat_offline_vibes") || "[]");
    set({ offlineVibes: saved });
  },
  cleanExpiredVibes: () => {
    const saved = JSON.parse(localStorage.getItem("skrimchat_offline_vibes") || "[]");
    const now = Date.now();
    const valid = saved.filter((v: any) => v.expiresAt > now);
    if (valid.length !== saved.length) {
      localStorage.setItem("skrimchat_offline_vibes", JSON.stringify(valid));
    }
    set({ offlineVibes: valid });
  },
  downloadVibe: async (vibe: any) => {
    const { offlineVibes, downloadStates } = get();
    
    if (offlineVibes.length >= 20) {
      alert("You've reached the 20 vibe offline limit.\nDelete some to save more.");
      return;
    }

    set({ downloadStates: { ...downloadStates, [vibe.id]: 'downloading' } });

    const videoUrl = "https://www.w3schools.com/html/mov_bbb.mp4"; // Using the mock specific URL

    try {
      const cache = await caches.open("skrimchat-offline");
      const response = await fetch(videoUrl, { mode: 'no-cors' });
      await cache.put(videoUrl, response);

      const saved = JSON.parse(localStorage.getItem("skrimchat_offline_vibes") || "[]");
      const newVibe: OfflineVibe = {
        id: vibe.id,
        caption: vibe.caption || '',
        creator: vibe.creator || { username: vibe.handle || vibe.user || '@someone', avatar: vibe.avatar },
        thumbnail: vibe.videoImageHover || vibe.avatar || '',
        videoUrl: videoUrl,
        savedAt: Date.now(),
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000)
      };

      const updatedSaved = [...saved.filter((v: any) => v.id !== vibe.id), newVibe];
      localStorage.setItem("skrimchat_offline_vibes", JSON.stringify(updatedSaved));

      set({ 
        offlineVibes: updatedSaved, 
        downloadStates: { ...get().downloadStates, [vibe.id]: 'saved' } 
      });
    } catch (err) {
      console.error("Failed to download", err);
      set({ downloadStates: { ...get().downloadStates, [vibe.id]: 'error' } });
      setTimeout(() => {
        set({ downloadStates: { ...get().downloadStates, [vibe.id]: 'idle' } });
      }, 3000);
    }
  },
  deleteVibe: (id: string) => {
    const saved = JSON.parse(localStorage.getItem("skrimchat_offline_vibes") || "[]");
    const valid = saved.filter((v: any) => v.id !== id);
    localStorage.setItem("skrimchat_offline_vibes", JSON.stringify(valid));
    
    const states = { ...get().downloadStates };
    delete states[id];
    
    set({ offlineVibes: valid, downloadStates: states });
  },
  getDownloadState: (id: string) => {
    const { downloadStates, offlineVibes } = get();
    if (downloadStates[id]) return downloadStates[id];
    if (offlineVibes.find(v => v.id === id)) return 'saved';
    return 'idle';
  }
}));
