import { create } from 'zustand';

export type MobileSheetPosition = 'collapsed' | 'mid' | 'expanded';

export interface UiStore {
  mobileSheetPos: MobileSheetPosition;
  setMobileSheetPos: (pos: MobileSheetPosition | ((prev: MobileSheetPosition) => MobileSheetPosition)) => void;
  isMobileExpanded: boolean;
  setIsMobileExpanded: (val: boolean | ((prev: boolean) => boolean)) => void;
  toggleMobileExpanded: () => void;
  isDesktopCollapsed: boolean;
  setIsDesktopCollapsed: (val: boolean | ((prev: boolean) => boolean)) => void;
  toggleDesktopCollapsed: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  mobileSheetPos: 'collapsed',
  setMobileSheetPos: (pos) =>
    set((state) => {
      const nextPos = typeof pos === 'function' ? pos(state.mobileSheetPos) : pos;
      return {
        mobileSheetPos: nextPos,
        isMobileExpanded: nextPos !== 'collapsed',
      };
    }),
  isMobileExpanded: false,
  setIsMobileExpanded: (val) =>
    set((state) => {
      const nextExpanded = typeof val === 'function' ? val(state.isMobileExpanded) : val;
      return {
        isMobileExpanded: nextExpanded,
        mobileSheetPos: nextExpanded ? 'mid' : 'collapsed',
      };
    }),
  toggleMobileExpanded: () =>
    set((state) => {
      const nextExpanded = !state.isMobileExpanded;
      return {
        isMobileExpanded: nextExpanded,
        mobileSheetPos: nextExpanded ? 'mid' : 'collapsed',
      };
    }),
  isDesktopCollapsed: false,
  setIsDesktopCollapsed: (val) =>
    set((state) => ({
      isDesktopCollapsed: typeof val === 'function' ? val(state.isDesktopCollapsed) : val,
    })),
  toggleDesktopCollapsed: () => set((state) => ({ isDesktopCollapsed: !state.isDesktopCollapsed })),
}));
