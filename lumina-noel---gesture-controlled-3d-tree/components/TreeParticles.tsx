import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, Vector3, Color, Shape, ExtrudeGeometry } from 'three';
import { CONFIG, COLORS } from '../constants';
import { useStore } from '../store';
import { AppMode } from '../types';

// Helper to generate 5-point star shape
const createStarGeometry = (radius: number, depth: number) => {
  const shape = new Shape();
  const points = 5;
  const innerRadius = radius * 0.4;
  
  for (let i = 0; i < points * 2; i++) {
    const r = (i % 2 === 0) ? radius : innerRadius;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2; // Rotate to point up
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  return new ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 1 });
};

// Helper to generate data for specific ornament type
const generateOrnamentData = (count: number, radiusModifier: number, yOffset: number) => {
  const temp = [];
  for (let i = 0; i < count; i++) {
    const yNorm = Math.random(); 
    // Add bias to distribute more ornaments towards bottom? Uniform for now.
    const y = yNorm * CONFIG.TREE_HEIGHT - (CONFIG.TREE_HEIGHT / 2) + yOffset;
    
    // Radius with some depth variance (inside/outside foliage)
    const rBase = CONFIG.TREE_RADIUS * (1 - yNorm);
    const r = rBase * radiusModifier + (Math.random() * 0.5 - 0.25); 
    
    const theta = Math.random() * Math.PI * 2;
    const treePos = new Vector3(r * Math.cos(theta), y, r * Math.sin(theta));

    // Chaos Position
    const scatterPos = new Vector3(
      (Math.random() - 0.5) * CONFIG.SCATTER_BOUNDS * 1.5,
      (Math.random() - 0.5) * CONFIG.SCATTER_BOUNDS * 1.5,
      (Math.random() - 0.5) * CONFIG.SCATTER_BOUNDS * 1.5
    );

    temp.push({
      treePos,
      scatterPos,
      currentPos: scatterPos.clone(), 
      rotationAxis: new Vector3(Math.random(), Math.random(), Math.random()).normalize(),
      rotationSpeed: Math.random() * 0.02,
      scale: Math.random() * 0.5 + 0.5,
      phase: Math.random() * Math.PI * 2
    });
  }
  return temp;
};

const OrnamentLayer: React.FC<{
  count: number;
  geometryType: 'box' | 'sphere' | 'light' | 'star';
  colorPalette: Color[];
  lerpSpeed: number;
  radiusMod: number;
  scaleBase: number;
}> = ({ count, geometryType, colorPalette, lerpSpeed, radiusMod, scaleBase }) => {
  const meshRef = useRef<InstancedMesh>(null);
  const mode = useStore((state) => state.mode);
  const dummy = useMemo(() => new Object3D(), []);
  
  // Memoize geometry for star to avoid recreation
  const starGeo = useMemo(() => geometryType === 'star' ? createStarGeometry(1, 0.2) : null, [geometryType]);

  const particles = useMemo(() => {
    return generateOrnamentData(count, radiusMod, 0);
  }, [count, radiusMod]);

  useEffect(() => {
    if (meshRef.current) {
      particles.forEach((p, i) => {
        const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        meshRef.current!.setColorAt(i, col);
      });
      meshRef.current.instanceColor!.needsUpdate = true;
    }
  }, [particles, colorPalette]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const isTree = mode === AppMode.TREE;
    
    particles.forEach((p, i) => {
      const target = isTree ? p.treePos : p.scatterPos;
      
      p.currentPos.lerp(target, lerpSpeed);

      const hover = Math.sin(state.clock.elapsedTime * 2 + p.phase) * 0.05;
      dummy.position.copy(p.currentPos);
      if (!isTree) dummy.position.y += hover; 

      dummy.scale.setScalar(p.scale * scaleBase);
      
      // Rotate
      if (geometryType !== 'light') {
         dummy.rotateOnAxis(p.rotationAxis, p.rotationSpeed);
         // Stars spin slower and elegantly
         if (geometryType === 'star') dummy.rotation.y += 0.01; 
      }
      
      // Orient boxes to look out from center
      if (isTree && (geometryType === 'box' || geometryType === 'star')) {
          const lookAtPos = dummy.position.clone().multiplyScalar(2);
          lookAtPos.y = dummy.position.y; // Keep level
          dummy.lookAt(lookAtPos);
      }

      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[undefined, undefined, count]} 
      castShadow 
      receiveShadow={geometryType !== 'light'}
      geometry={geometryType === 'star' ? starGeo! : undefined}
    >
      {geometryType === 'box' && <boxGeometry args={[1, 1, 1]} />}
      {geometryType === 'sphere' && <sphereGeometry args={[1, 32, 32]} />}
      {geometryType === 'light' && <sphereGeometry args={[0.5, 16, 16]} />}
      {/* Star geometry passed via prop */}
      
      {geometryType === 'light' ? (
        <meshStandardMaterial 
          emissive={COLORS.GOLD} 
          emissiveIntensity={4} 
          toneMapped={false} 
          color={COLORS.GOLD}
        />
      ) : (
        <meshStandardMaterial 
          metalness={1.0} 
          roughness={0.1} 
          envMapIntensity={2.5}
        />
      )}
    </instancedMesh>
  );
};

const TreeTopper: React.FC = () => {
    const mode = useStore((state) => state.mode);
    const ref = useRef<any>();
    const starGeo = useMemo(() => createStarGeometry(1.5, 0.4), []);
    
    useFrame((state) => {
        if(!ref.current) return;
        const isTree = mode === AppMode.TREE;
        const targetY = (CONFIG.TREE_HEIGHT / 2) + 0.5;
        const targetPos = isTree ? new Vector3(0, targetY, 0) : new Vector3(0, targetY + 10, 0); // Float high in chaos
        
        ref.current.position.lerp(targetPos, 0.02);
        ref.current.rotation.y += 0.01;
        ref.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.1;
        
        // Pulse scale
        const s = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
        ref.current.scale.set(s,s,s);
    });

    return (
        <mesh ref={ref} geometry={starGeo} position={[0, CONFIG.TREE_HEIGHT/2, 0]}>
             <meshStandardMaterial 
                color={COLORS.GOLD}
                emissive={COLORS.GOLD}
                emissiveIntensity={1}
                metalness={1}
                roughness={0}
             />
             <pointLight intensity={3} color="white" distance={10} />
        </mesh>
    );
};

const TreeParticles: React.FC = () => {
  return (
    <group>
      <TreeTopper />
      
      {/* 1. Heavy Gift Boxes */}
      <OrnamentLayer 
        count={CONFIG.ORNAMENT_COUNT_BOXES} 
        geometryType="box" 
        colorPalette={[COLORS.BURGUNDY, COLORS.GOLD, COLORS.EMERALD]}
        lerpSpeed={CONFIG.SPEED_HEAVY}
        radiusMod={0.9} 
        scaleBase={0.6}
      />

      {/* 2. Shiny Baubles */}
      <OrnamentLayer 
        count={CONFIG.ORNAMENT_COUNT_BALLS} 
        geometryType="sphere" 
        colorPalette={[COLORS.GOLD, COLORS.METALLIC_GOLD, COLORS.BURGUNDY, COLORS.PURE_WHITE]}
        lerpSpeed={CONFIG.SPEED_MEDIUM}
        radiusMod={1.0} 
        scaleBase={0.4}
      />

      {/* 3. Golden Stars (New Layer) */}
      <OrnamentLayer 
        count={CONFIG.ORNAMENT_COUNT_STARS} 
        geometryType="star" 
        colorPalette={[COLORS.GOLD, COLORS.PURE_WHITE]}
        lerpSpeed={CONFIG.SPEED_STAR}
        radiusMod={1.1} // Stick out a bit
        scaleBase={0.25}
      />

      {/* 4. Lights */}
      <OrnamentLayer 
        count={CONFIG.ORNAMENT_COUNT_LIGHTS} 
        geometryType="light" 
        colorPalette={[COLORS.GOLD]} 
        lerpSpeed={CONFIG.SPEED_LIGHT}
        radiusMod={1.05} 
        scaleBase={0.15}
      />
    </group>
  );
};

export default TreeParticles;