import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useStore } from '../store';
import { AppMode, GestureType } from '../types';
import { detectGesture } from '../utils/gestureRecognition';

const HandController: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const setGesture = useStore((state) => state.setGesture);
  const setMode = useStore((state) => state.setMode);
  const setHandPosition = useStore((state) => state.setHandPosition);
  const mode = useStore((state) => state.mode);
  const debug = useStore((state) => state.debug);

  const lastGestureRef = useRef<GestureType>(GestureType.NONE);
  const gestureFramesRef = useRef(0);
  const GESTURE_CONFIDENCE_THRESHOLD = 5;

  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;
    let stream: MediaStream | null = null;

    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        startWebcam(handLandmarker);
      } catch (err) {
        console.error("Error initializing MediaPipe:", err);
      }
    };

    const startWebcam = async (landmarker: HandLandmarker) => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn("MediaDevices API not supported.");
        setCameraError(true);
        return;
      }

      if (videoRef.current) {
        try {
          // Preferred constraints
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "user",
              width: { ideal: 640 },
              height: { ideal: 480 }
            }
          });
          applyStream(stream, landmarker);
        } catch (err) {
          console.warn("Preferred webcam failed, retrying with defaults...", err);
          try {
             // Fallback
             stream = await navigator.mediaDevices.getUserMedia({ video: true });
             applyStream(stream, landmarker);
          } catch (fallbackErr) {
             console.error("Webcam access denied completely:", fallbackErr);
             setCameraError(true);
             // Do not alert, just let it fail to UI indication
          }
        }
      }
    };

    const applyStream = (s: MediaStream, landmarker: HandLandmarker) => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = s;
        videoRef.current.addEventListener("loadeddata", () => {
          setLoaded(true);
          predictWebcam(landmarker);
        });
    };

    const predictWebcam = (landmarker: HandLandmarker) => {
      if (!videoRef.current) return;
      
      const startTimeMs = performance.now();
      if (videoRef.current.currentTime > 0 && videoRef.current.readyState >= 2) {
        const results = landmarker.detectForVideo(videoRef.current, startTimeMs);
        
        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          const detected = detectGesture(landmarks);

          // Update Hand Position
          const handX = 1 - landmarks[9].x; 
          const handY = landmarks[9].y;
          setHandPosition({ x: handX, y: handY });

          // Gesture Debouncing
          if (detected === lastGestureRef.current) {
            gestureFramesRef.current++;
          } else {
            gestureFramesRef.current = 0;
            lastGestureRef.current = detected;
          }

          if (gestureFramesRef.current > GESTURE_CONFIDENCE_THRESHOLD) {
            setGesture(detected);

            if (detected === GestureType.FIST) {
               setMode(AppMode.TREE);
            } else if (detected === GestureType.OPEN_PALM) {
               if (mode === AppMode.TREE || mode === AppMode.FOCUS) {
                 setMode(AppMode.SCATTER);
               }
            }
          }
        } else {
          setGesture(GestureType.NONE);
        }
      }
      animationFrameId = requestAnimationFrame(() => predictWebcam(landmarker));
    };

    setupMediaPipe();

    return () => {
      if (handLandmarker) handLandmarker.close();
      cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [setGesture, setMode, mode, setHandPosition]);

  if (cameraError) {
    return debug ? (
      <div className="fixed bottom-4 right-4 bg-red-900/50 text-white p-2 text-xs rounded border border-red-500">
        Camera unavailable. Use Mouse.
      </div>
    ) : null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 overflow-hidden rounded-xl border-2 border-[#D4AF37] transition-opacity duration-500 ${debug ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-48 h-36 object-cover transform scale-x-[-1]" 
      />
      {!loaded && <div className="absolute inset-0 flex items-center justify-center bg-black text-xs text-[#D4AF37]">Init Vision...</div>}
    </div>
  );
};

export default HandController;