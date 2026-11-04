import { useCallback, useEffect, useRef, useState } from "react";
import { MotionDetector } from "../lib/motion";

/**
 * "Medidor de energia" unificado: com câmara mede o movimento real; sem câmara
 * a criança bate no botão do ritmo e cada toque enche a barra (que vai descendo).
 */
export function useMeter() {
  const [value, setValue] = useState(0);
  const [camera, setCamera] = useState<"off" | "on" | "denied">("off");
  const det = useRef<MotionDetector | null>(null);
  const tapLevel = useRef(0);
  const samples = useRef<number[]>([]);
  const recording = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => {
      let v: number;
      if (det.current?.active) v = det.current.energy;
      else {
        tapLevel.current *= 0.86;
        v = tapLevel.current;
      }
      if (recording.current) samples.current.push(v);
      setValue(v);
    }, 100);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => () => det.current?.stop(), []);

  const tap = useCallback(() => {
    tapLevel.current = Math.min(1, tapLevel.current + 0.3);
  }, []);

  const toggleCamera = useCallback(async () => {
    if (det.current?.active) {
      det.current.stop();
      setCamera("off");
      return;
    }
    if (!videoRef.current) return;
    det.current ??= new MotionDetector();
    const ok = await det.current.start(videoRef.current);
    setCamera(ok ? "on" : "denied");
  }, []);

  const startRecording = useCallback(() => {
    samples.current = [];
    recording.current = true;
  }, []);
  const stopRecording = useCallback((): number => {
    recording.current = false;
    const s = samples.current;
    if (!s.length) return 0;
    return s.reduce((a, b) => a + b, 0) / s.length;
  }, []);

  return { value, camera, cameraSupported: MotionDetector.supported(), videoRef, tap, toggleCamera, startRecording, stopRecording };
}
