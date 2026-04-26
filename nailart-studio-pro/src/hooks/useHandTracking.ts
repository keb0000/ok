import { useEffect, useRef, useState, useCallback } from 'react';
import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

export function useHandTracking() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [results, setResults] = useState<Results | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
      selfieMode: true,
    });

    hands.onResults((results) => {
      setResults(results);
      if (!isLoaded) setIsLoaded(true);
    });

    if (videoRef.current) {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) {
            await hands.send({ image: videoRef.current });
          }
        },
        width: 1280,
        height: 720,
      });
      camera.start().catch(err => {
        console.error("Camera error:", err);
        setError(err.name === 'NotAllowedError' ? 'Camera permission denied. Please allow camera access in your browser settings.' : 'Failed to start camera.');
      });
    }

    return () => {
      hands.close();
    };
  }, []);

  return { videoRef, results, isLoaded, error };
}
