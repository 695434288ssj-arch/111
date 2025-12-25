import { Color } from 'three';

export const COLORS = {
  EMERALD: new Color('#023020'),    // Deep Emerald Green
  GOLD: new Color('#FFD700'),       // High-Gloss Gold
  METALLIC_GOLD: new Color('#D4AF37'), // Darker Metallic Gold
  BURGUNDY: new Color('#800020'),   // Deep Red
  WARM_WHITE: new Color('#FFFDD0'), // Cream/Warm White
  PURE_WHITE: new Color('#FFFFFF'), // Diamond
};

export const CONFIG = {
  FOLIAGE_COUNT: 18000,
  ORNAMENT_COUNT_BOXES: 200,
  ORNAMENT_COUNT_BALLS: 400,
  ORNAMENT_COUNT_LIGHTS: 600,
  ORNAMENT_COUNT_STARS: 150,
  
  TREE_HEIGHT: 18,
  TREE_RADIUS: 8,
  SCATTER_BOUNDS: 40,
  
  CAMERA_Z_TREE: 26,
  CAMERA_Z_SCATTER: 16,
  
  // Lerp speeds (Physical weights)
  SPEED_HEAVY: 0.015, // Gift boxes
  SPEED_MEDIUM: 0.03, // Balls
  SPEED_LIGHT: 0.05,  // Lights
  SPEED_STAR: 0.04,   // Stars
  SPEED_FOLIAGE: 0.02,
};