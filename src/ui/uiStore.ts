import { create } from 'zustand';

export type MobileSheetPosition = 'collapsed' | 'mid' | 'expanded' | 'maximized';
export type DesktopPanelState = 'normal' | 'minimized' | 'maximized';
export type EdgeWeightsMode = 'auto' | 'all' | 'hidden';

function getInitialWidth(): number {
  if (typeof window === 'undefined') return 460;
  try {
    const saved = localStorage.getItem('rutaq_panel_width');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 320) return parsed;
    }
  } catch {
    // ignorar si localStorage no está disponible
  }
  return 460;
}

function getInitialState(): DesktopPanelState {
  if (typeof window === 'undefined') return 'normal';
  try {
    const saved = localStorage.getItem('rutaq_panel_state');
    if (saved === 'minimized' || saved === 'maximized' || saved === 'normal') return saved;
  } catch {
    // ignorar si localStorage no está disponible
  }
  return 'normal';
}

export interface UiStore {
  mobileSheetPos: MobileSheetPosition;
  setMobileSheetPos: (pos: MobileSheetPosition | ((prev: MobileSheetPosition) => MobileSheetPosition)) => void;
  isMobileExpanded: boolean;
  setIsMobileExpanded: (val: boolean | ((prev: boolean) => boolean)) => void;
  toggleMobileExpanded: () => void;
  isDesktopCollapsed: boolean;
  setIsDesktopCollapsed: (val: boolean | ((prev: boolean) => boolean)) => void;
  toggleDesktopCollapsed: () => void;

  panelWidth: number;
  setPanelWidth: (width: number | ((prev: number) => number)) => void;
  panelState: DesktopPanelState;
  setPanelState: (state: DesktopPanelState | ((prev: DesktopPanelState) => DesktopPanelState)) => void;

  edgeWeightsMode: EdgeWeightsMode;
  setEdgeWeightsMode: (mode: EdgeWeightsMode) => void;

  // Proyecto II — Estados UI Guatemala
  guatemalaTab: 'ruta' | 'mst' | 'tabla' | 'grafica' | 'rutas' | 'floyd';
  setGuatemalaTab: (tab: 'ruta' | 'mst' | 'tabla' | 'grafica' | 'rutas' | 'floyd') => void;
  isAssistantOpen: boolean;
  setIsAssistantOpen: (open: boolean) => void;
  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  isAboutOpen: boolean;
  setIsAboutOpen: (open: boolean) => void;
  isPresentationMode: boolean;
  setIsPresentationMode: (open: boolean) => void;
}

const initialPanelState = getInitialState();

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
  isDesktopCollapsed: initialPanelState === 'minimized',
  setIsDesktopCollapsed: (val) =>
    set((state) => {
      const nextCollapsed = typeof val === 'function' ? val(state.isDesktopCollapsed) : val;
      const nextState: DesktopPanelState = nextCollapsed ? 'minimized' : 'normal';
      try {
        localStorage.setItem('rutaq_panel_state', nextState);
      } catch {
        // ignorar si localStorage no está disponible
      }
      return {
        isDesktopCollapsed: nextCollapsed,
        panelState: nextState,
      };
    }),
  toggleDesktopCollapsed: () =>
    set((state) => {
      const nextCollapsed = !state.isDesktopCollapsed;
      const nextState: DesktopPanelState = nextCollapsed ? 'minimized' : 'normal';
      try {
        localStorage.setItem('rutaq_panel_state', nextState);
      } catch {
        // ignorar si localStorage no está disponible
      }
      return {
        isDesktopCollapsed: nextCollapsed,
        panelState: nextState,
      };
    }),

  panelWidth: getInitialWidth(),
  setPanelWidth: (width) =>
    set((state) => {
      const nextWidth = typeof width === 'function' ? width(state.panelWidth) : width;
      const maxW = typeof window !== 'undefined' ? Math.round(window.innerWidth * 0.75) : 1200;
      const clamped = Math.max(320, Math.min(maxW, nextWidth));
      try {
        localStorage.setItem('rutaq_panel_width', String(clamped));
      } catch {
        // ignorar si localStorage no está disponible
      }
      return { panelWidth: clamped };
    }),

  panelState: initialPanelState,
  setPanelState: (panelStateOrFn) =>
    set((state) => {
      const nextState = typeof panelStateOrFn === 'function' ? panelStateOrFn(state.panelState) : panelStateOrFn;
      try {
        localStorage.setItem('rutaq_panel_state', nextState);
      } catch {
        // ignorar si localStorage no está disponible
      }
      return {
        panelState: nextState,
        isDesktopCollapsed: nextState === 'minimized',
      };
    }),

  edgeWeightsMode: 'auto',
  setEdgeWeightsMode: (mode) => set({ edgeWeightsMode: mode }),

  guatemalaTab: 'mst',
  setGuatemalaTab: (tab) => set({ guatemalaTab: tab }),
  isAssistantOpen: false,
  setIsAssistantOpen: (open) => set({ isAssistantOpen: open }),
  isAdminOpen: false,
  setIsAdminOpen: (open) => set({ isAdminOpen: open }),
  isAboutOpen: false,
  setIsAboutOpen: (open) => set({ isAboutOpen: open }),
  isPresentationMode: false,
  setIsPresentationMode: (open) => set({ isPresentationMode: open }),
}));
