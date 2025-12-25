import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import TreeParticles from './TreeParticles';
import FoliageSystem from './FoliageSystem';
import PhotoFrames from './PhotoFrames';
import { useStore } from '../store';
import { AppMode, GestureType } from '../types';
import { CONFIG, COLORS } from '../constants';

const CameraController: React.FC = () => {
  const mode = useStore((state) => state.mode);
  const handPos = useStore((state) => state.handPosition);
  const gesture = useStore((state) => state.gesture);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  
  useFrame((state) => {
    if (!cameraRef.current) return;
    
    // Base Target Position
    let targetZ = CONFIG.CAMERA_Z_TREE;
    if (mode === AppMode.SCATTER) targetZ = CONFIG.CAMERA_Z_SCATTER;
    if (mode === AppMode.FOCUS) targetZ = 16;

    // Hand-based rotation (Parallax effect)
    const xOffset = (handPos.x - 0.5) * 15;
    const yOffset = (handPos.y - 0.5) * 10;

    let targetX = 0;
    let targetY = 0;

    // Allow rotation only in Scatter mode when hand is open
    if (mode === AppMode.SCATTER && gesture === GestureType.OPEN_PALM) {
       targetX = xOffset;
       targetY = yOffset;
    }

    // Smooth camera movement
    cameraRef.current.position.x = THREE.MathUtils.lerp(cameraRef.current.position.x, targetX, 0.03);
    cameraRef.current.position.y = THREE.MathUtils.lerp(cameraRef.current.position.y, targetY, 0.03);
    cameraRef.current.position.z = THREE.MathUtils.lerp(cameraRef.current.position.z, targetZ, 0.03);
    
    cameraRef.current.lookAt(0, 0, 0);
  });

  return <PerspectiveCamera makeDefault ref={cameraRef} position={[0, 0, CONFIG.CAMERA_Z_TREE]} fov={50} />;
};

const Scene: React.FC = () => {
  return (
    <Canvas 
        shadows 
        dpr={[1, 1.5]} // Performance optimization for many particles
        gl={{ 
            antialias: false, 
            toneMapping: THREE.ReinhardToneMapping, 
            toneMappingExposure: 1.5,
            powerPreference: "high-performance"
        }}
    >
      <CameraController />
      
      {/* Background */}
      <color attach="background" args={['#010502']} /> 
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={1} fade speed={0.5} />

      {/* Cinematic Grand Lighting */}
      <ambientLight intensity={0.5} color={COLORS.EMERALD} />
      
      {/* Key Light - Gold */}
      <pointLight position={[15, 10, 15]} intensity={3} color={COLORS.GOLD} castShadow shadow-mapSize={[1024, 1024]} />
      
      {/* Fill Light - Warm */}
      <pointLight position={[-15, 5, -10]} intensity={2} color="#ff7700" />
      
      {/* Rim Light - Cool Emerald */}
      <spotLight position={[0, 30, -10]} intensity={5} angle={0.5} penumbra={0.5} color={COLORS.EMERALD} castShadow />

      <Environment preset="city" />

      <group>
        <FoliageSystem />
        <TreeParticles />
        <PhotoFrames />
      </group>

      <EffectComposer disableNormalPass>
        {/* Requested Bloom Settings: Threshold 0.8, Intensity 1.2 */}
        <Bloom 
            luminanceThreshold={0.8} 
            mipmapBlur 
            intensity={1.2} 
            radius={0.6} 
        />
        <Vignette eskil={false} offset={0.1} darkness={0.6} />
        <Noise opacity={0.015} />
      </EffectComposer>
      
      <OrbitControls enableZoom={false} enablePan={false} dampingFactor={0.05} />
    </Canvas>
  );
};

export default Scene;
