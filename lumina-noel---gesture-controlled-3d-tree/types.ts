export enum AppMode {
  TREE = 'TREE',       // Converged cone shape
  SCATTER = 'SCATTER', // Floating chaos
  FOCUS = 'FOCUS',     // Focusing on a specific photo
}

export enum GestureType {
  NONE = 'NONE',
  FIST = 'FIST',
  OPEN_PALM = 'OPEN_PALM',
  PINCH = 'PINCH',
}

export interface PhotoData {
  id: string;
  url: string;
  aspectRatio: number;
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandResults {
  landmarks: HandLandmark[][];
}

// Minimal definition for MediaPipe task results
export interface VisionTaskResult {
  landmarks: HandLandmark[][];
  handedness: any[];
}
