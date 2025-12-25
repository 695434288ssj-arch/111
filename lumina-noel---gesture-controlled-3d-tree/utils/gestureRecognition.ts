import { GestureType, HandLandmark } from '../types';

// Finger indices in MediaPipe Hand Landmarks
// 0: Wrist
// 4: Thumb Tip
// 8: Index Tip
// 12: Middle Tip
// 16: Ring Tip
// 20: Pinky Tip

const TIP_IDS = [4, 8, 12, 16, 20];
const PIP_IDS = [2, 6, 10, 14, 18]; // Proximal Interphalangeal joints (knuckles roughly)

const distance = (p1: HandLandmark, p2: HandLandmark) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

export const detectGesture = (landmarks: HandLandmark[]): GestureType => {
  if (!landmarks || landmarks.length === 0) return GestureType.NONE;

  // 1. Check if fingers are open (Tip is higher/further than PIP). 
  // Note: Y coordinates are inverted in some vision frameworks, usually 0 is top.
  // In MediaPipe JS: 0 is top, 1 is bottom. So Tip Y < PIP Y means finger is UP.
  
  let fingersUp = 0;
  
  // Thumb is tricky, check x distance relative to wrist or IP joint. 
  // Simplified: Check if thumb tip is far from index base.
  // For now, let's treat thumb based on X offset or simple distance from pinky base
  // But reliable "open palm" usually checks 4 fingers + thumb extension.
  
  // Check Index, Middle, Ring, Pinky
  for (let i = 1; i < 5; i++) {
    if (landmarks[TIP_IDS[i]].y < landmarks[PIP_IDS[i]].y) {
      fingersUp++;
    }
  }

  // Thumb check (check if tip is to the side of the knuckle)
  // Assuming right hand for simplicity, or just distance from index finger MCP (5)
  if (distance(landmarks[4], landmarks[17]) > 0.15) { // 17 is Pinky MCP
     fingersUp++;
  }

  // Detect PINCH (Thumb tip close to Index tip)
  const pinchDist = distance(landmarks[4], landmarks[8]);
  const isPinch = pinchDist < 0.05;

  if (isPinch) {
    return GestureType.PINCH;
  }

  if (fingersUp >= 4) {
    return GestureType.OPEN_PALM;
  }

  if (fingersUp <= 1) {
    return GestureType.FIST;
  }

  return GestureType.NONE;
};
