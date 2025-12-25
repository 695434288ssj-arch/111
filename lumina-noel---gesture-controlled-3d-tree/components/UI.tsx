import React, { useRef } from 'react';
import { Hand, AlertCircle, Sparkles } from 'lucide-react';
import { useStore } from '../store';
import { AppMode, GestureType } from '../types';
import { v4 as uuidv4 } from 'uuid';

const UI: React.FC = () => {
  const mode = useStore((state) => state.mode);
  const gesture = useStore((state) => state.gesture);
  const addPhoto = useStore((state) => state.addPhoto);
  const toggleDebug = useStore((state) => state.toggleDebug);
  const debug = useStore((state) => state.debug);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        addPhoto({ id: uuidv4(), url, aspectRatio: img.width / img.height });
      };
      img.src = url;
    }
  };

  const getGestureIcon = () => {
    switch (gesture) {
      case GestureType.FIST: return '✊';
      case GestureType.OPEN_PALM: return '🖐️';
      case GestureType.PINCH: return '👌';
      default: return '...';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 font-serif">
      
      {/* Header - Scaled Down */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="bg-gradient-to-r from-black/80 to-transparent p-4 rounded-l-none rounded-r-xl border-l-4 border-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.15)]">
            <h1 className="text-2xl text-[#FFD700] tracking-widest drop-shadow-md font-bold font-['Cinzel']">
              TRUMP TOWER
            </h1>
            <h2 className="text-xs text-[#FFFDD0] tracking-widest uppercase mt-0.5 opacity-80">
              Interactive Holiday Experience
            </h2>
        </div>
        
        <button onClick={toggleDebug} className="bg-black/40 text-[#FFD700] p-2 rounded-full hover:bg-black/60 transition border border-[#FFD700]/30 hover:border-[#FFD700] scale-75">
           <AlertCircle size={20} className={debug ? "text-red-500" : ""} />
        </button>
      </div>

      {/* Central State Display - Scaled Down and Opacity Fix */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
         <h2 
            className={`text-5xl text-[#FFD700] font-['Cinzel'] tracking-widest transition-all duration-1000 ${mode !== AppMode.TREE ? 'opacity-20 scale-100 blur-[2px]' : 'opacity-0 scale-90'}`}
         >
            CHAOS
         </h2>
      </div>

      {/* Footer Controls - Compact */}
      <div className="flex justify-between items-end w-full pointer-events-auto">
        
        {/* Gesture Panel - Smaller */}
        <div className="bg-[#023020]/90 backdrop-blur-xl p-4 rounded-tr-2xl border-t border-r border-[#FFD700] text-[#FFFDD0] w-64 shadow-2xl scale-90 origin-bottom-left">
          <h3 className="text-[#FFD700] text-sm font-bold mb-3 flex items-center gap-2 uppercase tracking-widest border-b border-[#FFD700]/50 pb-2">
            <Hand size={16} /> Command Center
          </h3>
          <ul className="space-y-3 font-sans tracking-wide text-xs">
            <li className={`flex items-center gap-3 transition-all duration-300 p-1.5 rounded ${gesture === GestureType.FIST ? 'bg-[#FFD700]/20 text-[#FFD700] font-bold translate-x-1' : ''}`}>
              <span className="text-lg">✊</span> 
              <div>
                <span className="block uppercase text-[10px] opacity-70">Gesture</span>
                <span>ASSEMBLE TREE</span>
              </div>
            </li>
            <li className={`flex items-center gap-3 transition-all duration-300 p-1.5 rounded ${gesture === GestureType.OPEN_PALM ? 'bg-[#FFD700]/20 text-[#FFD700] font-bold translate-x-1' : ''}`}>
              <span className="text-lg">🖐️</span> 
              <div>
                <span className="block uppercase text-[10px] opacity-70">Gesture</span>
                <span>SCATTER CLOUD</span>
              </div>
            </li>
             <li className="pt-2 border-t border-[#FFD700]/20 flex justify-between items-center text-xs text-[#FFD700]">
               <span>SIGNAL:</span>
               <span className="text-xl animate-pulse drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]">{getGestureIcon()}</span>
            </li>
          </ul>
        </div>

        {/* Action Button - Smaller */}
        <div className="flex flex-col items-end gap-2">
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="group relative px-6 py-3 bg-gradient-to-b from-[#800020] to-[#4a0010] text-[#FFD700] font-['Cinzel'] text-sm font-bold tracking-widest rounded-sm overflow-hidden border border-[#FFD700] shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_40px_rgba(212,175,55,0.6)] transition-all transform hover:-translate-y-0.5"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Sparkles size={18} /> ADD ORNAMENT
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700] via-[#F8F8FF] to-[#FFD700] opacity-0 group-hover:opacity-20 transition duration-700 animate-shimmer"></div>
          </button>
        </div>

      </div>
    </div>
  );
};

export default UI;