import React, { Suspense } from 'react';
import Scene from './components/Scene';
import UI from './components/UI';
import HandController from './components/HandController';

const App: React.FC = () => {
  return (
    <div className="relative w-full h-screen bg-[#050505] overflow-hidden">
      
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<div className="flex items-center justify-center h-full text-[#D4AF37] font-serif">Loading Magic...</div>}>
          <Scene />
        </Suspense>
      </div>

      {/* Hand Tracking (Invisible/Overlay) */}
      <HandController />

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10">
        <UI />
      </div>
      
    </div>
  );
};

export default App;
