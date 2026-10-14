import type { AppState } from '../store/types';
import { useMockStore } from './mock/mockStore';

/**
 * Hook principal para acceder al estado de la aplicación.
 * Durante la Fase F1 (desarrollo de interfaz) consume el store simulado (mock).
 * En la Fase F2 el orquestador apuntará este hook al store real de Zustand
 * sin necesidad de modificar ningún componente de la UI.
 */
export function useApp(): AppState;
export function useApp<T>(selector: (state: AppState) => T): T;
export function useApp<T>(selector?: (state: AppState) => T) {
  return useMockStore(selector!);
}

useApp.getState = useMockStore.getState;
useApp.setState = useMockStore.setState;
useApp.subscribe = useMockStore.subscribe;
