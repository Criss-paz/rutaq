import type { AppState } from '../store/types';
import { useAppStore } from '../store/useAppStore';

/**
 * Hook principal para acceder al estado de la aplicación (store real de Zustand desde la Fase F2).
 * El store simulado sigue disponible en ./mock/mockStore para desarrollo aislado de la UI.
 */
export function useApp(): AppState;
export function useApp<T>(selector: (state: AppState) => T): T;
export function useApp<T>(selector?: (state: AppState) => T) {
  return useAppStore(selector!);
}

useApp.getState = useAppStore.getState;
useApp.setState = useAppStore.setState;
useApp.subscribe = useAppStore.subscribe;
