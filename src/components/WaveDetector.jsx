import React, { useRef, useEffect } from "react";
import * as mpHands from "@mediapipe/hands";
import * as mpCameraUtils from "@mediapipe/camera_utils";

// IMPORTANT: Ensure 'onWaveDetected' passed from the parent is wrapped in React.useCallback().

export default function WaveDetector({ onWaveDetected, talking, isListening }) {
  const videoRef = useRef(null);
  const cameraRef = useRef(null);
  const handsRef = useRef(null);

  // ✅ Mutable refs for props that change — avoids stale closures WITHOUT re-running the effect
  const talkingRef = useRef(talking);
  const isListeningRef = useRef(isListening);
  const onWaveDetectedRef = useRef(onWaveDetected);

  // Keep refs in sync with latest props on every render (no effect needed)
  talkingRef.current = talking;
  isListeningRef.current = isListening;
  onWaveDetectedRef.current = onWaveDetected;

  useEffect(() => {
    if (!videoRef.current) return;

    // ======= Config =======
    const threshold = 0.05;   // min x movement to count
    const requiredFlips = 2;  // direction changes = wave
    const windowMs = 800;     // time window for flips
    const cooldownMs = 6000;  // 6 seconds cooldown after a wave

    let lastX = null;
    let lastDir = 0;
    let flips = 0;
    let flipTimestamps = [];
    let lastTrigger = 0;

    // ======= Initialize MediaPipe Hands =======
    const hands = new mpHands.Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    handsRef.current = hands;

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results) => {
      const now = performance.now();

      // ✅ Read from refs instead of closed-over props — always current, no re-init needed
      if (talkingRef.current || isListeningRef.current) {
        lastX = null;
        lastDir = 0;
        flips = 0;
        flipTimestamps = [];
        return;
      }

      if (now - lastTrigger < cooldownMs) return;

      if (
        !results.multiHandLandmarks ||
        results.multiHandLandmarks.length === 0
      ) {
        lastX = null;
        lastDir = 0;
        flips = 0;
        flipTimestamps = [];
        return;
      }

      const lm = results.multiHandLandmarks[0][8]; // index fingertip
      const x = lm.x;

      if (lastX !== null) {
        const dx = x - lastX;

        if (Math.abs(dx) >= threshold) {
          const dir = dx > 0 ? 1 : -1;

          if (lastDir !== 0 && dir !== lastDir) {
            flips += 1;
            flipTimestamps.push(now);
            flipTimestamps = flipTimestamps.filter((t) => now - t <= windowMs);
            flips = flipTimestamps.length;

            if (flips >= requiredFlips) {
              onWaveDetectedRef.current(); // ✅ Always calls the latest callback
              lastTrigger = now;
              flips = 0;
              flipTimestamps = [];
              lastDir = 0;
              return;
            }

            lastDir = dir;
          }

          if (lastDir === 0) {
            lastDir = dir;
          }
        }
      }

      lastX = x;
    });

    // ======= Initialize webcam =======
    const camera = new mpCameraUtils.Camera(videoRef.current, {
      onFrame: async () => await hands.send({ image: videoRef.current }),
      width: 320,
      height: 240,
    });

    cameraRef.current = camera;

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        const videoEl = videoRef.current;
        if (!videoEl) return;

        videoEl.srcObject = stream;
        videoEl.onloadedmetadata = () => {
          videoEl.play().catch((err) => {
            if (err.name !== "AbortError")
              console.error("Video play error:", err);
          });
          camera.start();
        };
      })
      .catch((err) => console.error("Camera error:", err));

    // ======= Cleanup =======
    return () => {
      cameraRef.current?.stop();
      handsRef.current?.close();
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, []); // ✅ Empty deps — runs ONCE. Props are accessed via refs above.

  return (
    <div>
      <video
        ref={videoRef}
        style={{ display: "none" }}
        playsInline
        muted
        autoPlay
      />
    </div>
  );
}