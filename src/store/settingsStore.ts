import { create } from 'zustand';

interface SettingsState {
  regionalBoostEnabled: boolean;
  setRegionalBoost: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  regionalBoostEnabled: localStorage.getItem("skrimchat_regional_boost") !== 'false',
  setRegionalBoost: (enabled) => {
    localStorage.setItem("skrimchat_regional_boost", String(enabled));
    set({ regionalBoostEnabled: enabled });
  }
}));
