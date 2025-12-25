import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG, COLORS } from '../constants';
import { useStore } from '../store';
import { AppMode } from '../types';

const FoliageShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uProgress: { value: 0 }, // 0 = Chaos, 1 = Tree
    uColorA: { value: new THREE.Color('#023020') }, // Emerald
    uColorB: { value: new THREE.Color('#0B6623') }, // Forest Green
    uColorGold: { value: new THREE.Color('#FFD700') }, 
  },
  vertexShader: `
    uniform float uTime;
    uniform float uProgress;
    attribute vec3 aChaosPos;
    attribute vec3 aTargetPos;
    attribute float aRandom;
    
    varying vec2 vUv;
    varying float vBlink;
    varying vec3 vPos;

    void main() {
      vUv = uv;
      
      // Interpolate Position
      // Add some noise to the transition based on random index
      float localProgress = smoothstep(0.0, 1.0, uProgress);
      vec3 pos = mix(aChaosPos, aTargetPos, localProgress);
      
      // Gentle wind/breathing effect
      float wind = sin(uTime * 0.5 + pos.y * 0.5) * 0.1;
      pos.x += wind * (1.0 - localProgress); // More wind in chaos mode

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size attenuation
      gl_PointSize = (3.0 * aRandom + 2.0) * (30.0 / -mvPosition.z);
      
      vBlink = sin(uTime * 2.0 + aRandom * 10.0);
      vPos = pos;
    }
  `,
  fragmentShader: `
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform vec3 uColorGold;
    varying float vBlink;
    varying float vRandom;
    varying vec3 vPos;

    void main() {
      // Circular particle
      if (length(gl_PointCoord - vec2(0.5)) > 0.5) discard;
      
      // Gradient based on height for tree mode
      float heightFactor = smoothstep(-10.0, 10.0, vPos.y);
      vec3 baseColor = mix(uColorA, uColorB, heightFactor);
      
      // Add subtle gold sparkles
      if (vBlink > 0.8) {
        baseColor = mix(baseColor, uColorGold, 0.5);
      }

      gl_FragColor = vec4(baseColor, 1.0);
    }
  `
};

const FoliageSystem: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const mode = useStore((state) => state.mode);
  
  const { positions, chaosPositions, randoms } = useMemo(() => {
    const count = CONFIG.FOLIAGE_COUNT;
    const pos = new Float32Array(count * 3);
    const chaos = new Float32Array(count * 3);
    const rnd = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // 1. Target Position (Cone)
      // Volume distribution for needles
      const yNorm = Math.random();
      const y = yNorm * CONFIG.TREE_HEIGHT - (CONFIG.TREE_HEIGHT / 2);
      
      // Cone radius at this height
      const maxR = CONFIG.TREE_RADIUS * (1 - yNorm);
      // Volume distribution: r = maxR * sqrt(random)
      const r = maxR * Math.sqrt(Math.random()); 
      const theta = Math.random() * Math.PI * 2;

      pos[i * 3] = r * Math.cos(theta);
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = r * Math.sin(theta);

      // 2. Chaos Position (Sphere)
      const u = Math.random();
      const v = Math.random();
      const theta2 = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r2 = Math.cbrt(Math.random()) * CONFIG.SCATTER_BOUNDS; // Uniform sphere volume
      
      chaos[i * 3] = r2 * Math.sin(phi) * Math.cos(theta2);
      chaos[i * 3 + 1] = r2 * Math.sin(phi) * Math.sin(theta2);
      chaos[i * 3 + 2] = r2 * Math.cos(phi);

      // 3. Randoms
      rnd[i] = Math.random();
    }
    
    return { positions: pos, chaosPositions: chaos, randoms: rnd };
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uColorA: { value: COLORS.EMERALD },
    uColorB: { value: new THREE.Color('#0f4d33') },
    uColorGold: { value: COLORS.GOLD },
  }), []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    
    // Update Time
    const material = pointsRef.current.material as THREE.ShaderMaterial;
    material.uniforms.uTime.value = state.clock.elapsedTime;

    // Update Progress logic
    const targetProgress = mode === AppMode.TREE ? 1.0 : 0.0;
    // Foliage moves lighter/faster
    material.uniforms.uProgress.value = THREE.MathUtils.lerp(
      material.uniforms.uProgress.value,
      targetProgress,
      CONFIG.SPEED_FOLIAGE
    );
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position" // Use this as TargetPos effectively in shader if we mapped it, but let's be explicit
          count={positions.length / 3}
          array={positions} // Initial state is technically target, but shader handles mix
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTargetPos"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aChaosPos"
          count={chaosPositions.length / 3}
          array={chaosPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={randoms.length}
          array={randoms}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        args={[FoliageShaderMaterial]}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
      />
    </points>
  );
};

export default FoliageSystem;
