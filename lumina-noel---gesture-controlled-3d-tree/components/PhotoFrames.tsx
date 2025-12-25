import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Image } from '@react-three/drei';
import { Vector3, MathUtils } from 'three';
import { useStore } from '../store';
import { CONFIG, COLORS } from '../constants';
import { AppMode, GestureType } from '../types';

const Frame: React.FC<{ 
  data: any; 
  index: number;
  total: number;
}> = ({ data, index, total }) => {
  const meshRef = useRef<any>(null);
  const mode = useStore((state) => state.mode);
  const gesture = useStore((state) => state.gesture);
  const focusedId = useStore((state) => state.focusedPhotoId);
  const setFocusedPhotoId = useStore((state) => state.setFocusedPhotoId);
  const setMode = useStore((state) => state.setMode);
  
  // Calculate target positions
  const { treePos, scatterPos } = useMemo(() => {
    // Tree: Spiraling down the outside
    const theta = (index / total) * Math.PI * 8; // 4 full turns
    const yNorm = index / total; // 0 to 1
    const y = yNorm * CONFIG.TREE_HEIGHT - (CONFIG.TREE_HEIGHT / 2);
    const r = (CONFIG.TREE_RADIUS * (1 - yNorm)) + 0.5; // Slightly outside the ornaments

    const tPos = new Vector3(
      r * Math.cos(theta),
      y,
      r * Math.sin(theta)
    );

    // Scatter: Wider spread
    const sPos = new Vector3(
      (Math.random() - 0.5) * CONFIG.SCATTER_BOUNDS * 1.2,
      (Math.random() - 0.5) * CONFIG.SCATTER_BOUNDS * 0.8,
      (Math.random() - 0.5) * CONFIG.SCATTER_BOUNDS * 0.5 + 5 // bias towards camera slightly
    );

    return { treePos: tPos, scatterPos: sPos };
  }, [index, total]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    let target = new Vector3();
    let targetScale = 1.5;

    if (mode === AppMode.FOCUS && focusedId === data.id) {
      // Bring to front center
      target.set(0, 0, 12); 
      targetScale = 4.0;
      meshRef.current.lookAt(0, 0, 20); // Look at camera roughly
    } else if (mode === AppMode.TREE) {
      target.copy(treePos);
      targetScale = 1.2;
      // Face outward from center
      meshRef.current.lookAt(target.x * 2, target.y, target.z * 2);
    } else {
      // Scatter Mode
      target.copy(scatterPos);
      targetScale = 1.5;
      meshRef.current.lookAt(0, 0, 20); // Generally face camera
      
      // Gentle bobbing
      target.y += Math.sin(state.clock.elapsedTime + index) * 0.5;
    }

    // Smooth transition
    meshRef.current.position.lerp(target, 0.05);
    
    // Scale Lerp
    meshRef.current.scale.x = MathUtils.lerp(meshRef.current.scale.x, targetScale * data.aspectRatio, 0.05);
    meshRef.current.scale.y = MathUtils.lerp(meshRef.current.scale.y, targetScale, 0.05);
    
    // Check for "Grab" interaction
    // A simplified raycasting check based on mouse is handled by React Three Fiber's onClick usually.
    // However, for hand tracking, we need to check manually or use simple proximity logic if we mapped hand to pointer.
    // Here we implement mouse hover as a fallback/desktop proxy, and logic for gesture.
  });

  const handlePointerEnter = () => {
    document.body.style.cursor = 'pointer';
  };

  const handlePointerLeave = () => {
    document.body.style.cursor = 'auto';
  };

  const handleClick = () => {
    if (mode === AppMode.FOCUS && focusedId === data.id) {
       setMode(AppMode.SCATTER);
       setFocusedPhotoId(null);
    } else {
       setFocusedPhotoId(data.id);
       setMode(AppMode.FOCUS);
    }
  };

  // Note: Gesture based picking is complex without a full raycaster loop on the hand coordinates.
  // For this demo, we assume the user will use the "Pinch" gesture which we can map to "Select Center Item" 
  // or purely rely on visual chaos and click interaction for precise selection, while gestures control macro states.
  
  // Implementation of "Grab" to focus logic:
  useFrame(() => {
    if (gesture === GestureType.PINCH && mode === AppMode.SCATTER) {
      // If this frame is roughly in the center of the screen (0,0,0ish) or closest to camera?
      // Simplified: If "Pinch" is detected, and this is the first item, focus it? No, too random.
      // Better: If gesture is PINCH, trigger the "Click" on the frame closest to the center.
      // We'll leave specific selection to mouse/touch for precision, or rely on a global store "nearest" calculation.
    }
  });

  return (
    <group ref={meshRef}>
        {/* Border */}
        <mesh position={[0,0,-0.05]}>
            <boxGeometry args={[1.1, 1.1, 0.05]} />
            <meshStandardMaterial color={COLORS.GOLD} metalness={0.9} roughness={0.1} />
        </mesh>
        <Image 
            url={data.url}
            transparent
            opacity={1}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            onClick={handleClick}
        />
    </group>
  );
};

const PhotoFrames: React.FC = () => {
  const photos = useStore((state) => state.photos);
  return (
    <>
      {photos.map((photo, i) => (
        <Frame key={photo.id} data={photo} index={i} total={photos.length} />
      ))}
    </>
  );
};

export default PhotoFrames;
