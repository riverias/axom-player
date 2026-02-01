import { useEffect, useRef, useState } from 'react';

interface AudioAnalyzerData {
  bassLevel: number;
  midLevel: number;
  trebleLevel: number;
  overallLevel: number;
  frequencyData: Uint8Array;
}

export const useAudioAnalyzer = (audioElement: HTMLAudioElement | null, isPlaying: boolean) => {
  const [analyzerData, setAnalyzerData] = useState<AudioAnalyzerData>({
    bassLevel: 0,
    midLevel: 0,
    trebleLevel: 0,
    overallLevel: 0,
    frequencyData: new Uint8Array(0)
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!audioElement || !isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      setAnalyzerData({
        bassLevel: 0,
        midLevel: 0,
        trebleLevel: 0,
        overallLevel: 0,
        frequencyData: new Uint8Array(0)
      });
      
      return;
    }

    const initializeAnalyzer = async () => {
      try {
        if (isInitializedRef.current) {
          startAnalysis();
          return;
        }

        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const audioContext = audioContextRef.current;

        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        if (!analyzerRef.current) {
          analyzerRef.current = audioContext.createAnalyser();
          analyzerRef.current.fftSize = 256; 
          analyzerRef.current.smoothingTimeConstant = 0.8;
        }
        if (!sourceRef.current) {
          try {
            sourceRef.current = audioContext.createMediaElementSource(audioElement);
            sourceRef.current.connect(analyzerRef.current);
            analyzerRef.current.connect(audioContext.destination);
            isInitializedRef.current = true;
          } catch (error) {
            console.warn('MediaElementSource уже создан для этого элемента:', error);
            return;
          }
        }

        startAnalysis();
      } catch (error) {
        console.warn('Не удалось инициализировать аудио анализатор:', error);
      }
    };

    const startAnalysis = () => {
      if (!analyzerRef.current) return;

      const analyzer = analyzerRef.current;
      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const analyze = () => {
        if (!isPlaying || !analyzer) {
          animationFrameRef.current = null;
          return;
        }

        analyzer.getByteFrequencyData(dataArray);

        const bassEnd = Math.floor(bufferLength * 0.1);
        const midEnd = Math.floor(bufferLength * 0.4);  
        const trebleEnd = bufferLength;                  

        let bassSum = 0, midSum = 0, trebleSum = 0, overallSum = 0;

        for (let i = 0; i < bassEnd; i++) {
          bassSum += dataArray[i];
        }
        for (let i = bassEnd; i < midEnd; i++) {
          midSum += dataArray[i];
        }
        for (let i = midEnd; i < trebleEnd; i++) {
          trebleSum += dataArray[i];
        }
        for (let i = 0; i < bufferLength; i++) {
          overallSum += dataArray[i];
        }

        const bassLevel = (bassSum / bassEnd) / 255;
        const midLevel = (midSum / (midEnd - bassEnd)) / 255;
        const trebleLevel = (trebleSum / (trebleEnd - midEnd)) / 255;
        const overallLevel = (overallSum / bufferLength) / 255;

        setAnalyzerData({
          bassLevel,
          midLevel,
          trebleLevel,
          overallLevel,
          frequencyData: new Uint8Array(dataArray)
        });

        animationFrameRef.current = requestAnimationFrame(analyze);
      };

      analyze();
    };

    initializeAnalyzer();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [audioElement, isPlaying]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      isInitializedRef.current = false;
    };
  }, []);

  return analyzerData;
};