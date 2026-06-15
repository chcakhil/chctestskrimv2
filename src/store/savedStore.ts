import { create } from 'zustand';

interface SavedState {
  savedPosts: string[];
  repostedPosts: string[];
  toggleSave: (id: string) => boolean;
  toggleRepost: (id: string) => boolean;
  isSaved: (id: string) => boolean;
  isReposted: (id: string) => boolean;
  hydrate: () => void;
}

export const useSavedStore = create<SavedState>((set, get) => ({
  savedPosts: [],
  repostedPosts: [],
  
  hydrate: () => {
    try {
      const saved = JSON.parse(localStorage.getItem('skrimchat_saved_posts') || '[]');
      const reposted = JSON.parse(localStorage.getItem('skrimchat_reposted_posts') || '[]');
      set({ 
        savedPosts: Array.isArray(saved) ? saved : [],
        repostedPosts: Array.isArray(reposted) ? reposted : [],
      });
    } catch {
      set({ savedPosts: [], repostedPosts: [] });
    }
  },

  toggleSave: (id: string) => {
    const { savedPosts } = get();
    let updated;
    let currentlySaved = false;
    
    if (savedPosts.includes(id)) {
      updated = savedPosts.filter(p => p !== id);
      currentlySaved = false;
    } else {
      updated = [...savedPosts, id];
      currentlySaved = true;
    }
    
    localStorage.setItem('skrimchat_saved_posts', JSON.stringify(updated));
    set({ savedPosts: updated });
    // Keep exact exact custom event for any other components that use it directly
    window.dispatchEvent(new Event('skrimchat_saved_updated'));
    return currentlySaved;
  },

  toggleRepost: (id: string) => {
    const { repostedPosts } = get();
    let updated;
    let currentlyReposted = false;
    
    if (repostedPosts.includes(id)) {
      updated = repostedPosts.filter(p => p !== id);
      currentlyReposted = false;
    } else {
      updated = [...repostedPosts, id];
      currentlyReposted = true;
    }
    
    localStorage.setItem('skrimchat_reposted_posts', JSON.stringify(updated));
    set({ repostedPosts: updated });
    window.dispatchEvent(new Event('skrimchat_reposted_updated'));
    return currentlyReposted;
  },

  isSaved: (id: string) => get().savedPosts.includes(id),
  isReposted: (id: string) => get().repostedPosts.includes(id),
}));
