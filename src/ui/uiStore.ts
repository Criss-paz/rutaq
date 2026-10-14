import { create } from 'zustand';

export interface UiStore {
  isMobileExpanded: boolean;
  setIsMobileExpanded: (val: boolean | ((prev: boolean) => boolean)) => void;
  toggleMobileExpanded: () => void;
  isDesktopCollapsed: boolean;
  setIsDesktopCollapsed: (val: boolean | ((prev: boolean) => boolean)) => void;
  toggleDesktopCollapsed: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  isMobileExpanded: false,
  setIsMobileExpanded: (val) =>
    set((state) => ({
      isMobileExpanded: typeof val === 'function' ? val(state.isMobileExpanded) : val,
    })),
  toggleMobileExpanded: () => set((state) => ({ isMobileExpanded: !state.isMobileExpanded })),
  isDesktopCollapsed: false,
  setIsDesktopCollapsed: (val) =>
    set((state) => ({
      isDesktopCollapsed: typeof val === 'function' ? val(state.isDesktopCollapsed) : val,
    })),
  toggleDesktopCollapsed: () => set((state) => ({ isDesktopCollapsed: !state.isDesktopCollapsed })),
}));
