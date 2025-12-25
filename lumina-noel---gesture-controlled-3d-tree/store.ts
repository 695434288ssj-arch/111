import { create } from 'zustand';
import { AppMode, GestureType, PhotoData } from './types';

interface AppState {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  
  gesture: GestureType;
  setGesture: (gesture: GestureType) => void;

  handPosition: { x: number; y: number }; // Normalized 0-1
  setHandPosition: (pos: { x: number; y: number }) => void;

  photos: PhotoData[];
  addPhoto: (photo: PhotoData) => void;
  removePhoto: (id: string) => void;

  focusedPhotoId: string | null;
  setFocusedPhotoId: (id: string | null) => void;

  debug: boolean;
  toggleDebug: () => void;
}

export const useStore = create<AppState>((set) => ({
  mode: AppMode.TREE,
  setMode: (mode) => set({ mode }),

  gesture: GestureType.NONE,
  setGesture: (gesture) => set({ gesture }),

  handPosition: { x: 0.5, y: 0.5 },
  setHandPosition: (pos) => set({ handPosition: pos }),

  photos: [],
  addPhoto: (photo) => set((state) => ({ photos: [...state.photos, photo] })),
  removePhoto: (id) => set((state) => ({ photos: state.photos.filter((p) => p.id !== id) })),

  focusedPhotoId: null,
  setFocusedPhotoId: (id) => set({ focusedPhotoId: id }),

  debug: false,
  toggleDebug: () => set((state) => ({ debug: !state.debug })),
}));
