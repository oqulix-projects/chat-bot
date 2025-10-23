import React, { useRef, useEffect } from "react";
import * as mpHands from "@mediapipe/hands";
import * as mpCameraUtils from "@mediapipe/camera_utils";

export default function WaveDetector({ onWaveDetected }) {
  const videoRef = useRef(null);
  const cameraRef = useRef(null);
  const handsRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) return;

    // ======= Config =======
    const threshold = 0.05; // min x movement to count
    const requiredFlips = 1; // direction changes = wave
    const windowMs = 500;    // time window for flips
    const cooldownMs = 3000; // 3 seconds cooldown after a wave

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

      // Don't detect again during cooldown
      if (now - lastTrigger < cooldownMs) return;

      if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
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
            flipTimestamps = flipTimestamps.filter(t => now - t <= windowMs);
            flips = flipTimestamps.length;

            if (flips >= requiredFlips) {
              lastTrigger = now; // set cooldown
              flips = 0;
              flipTimestamps = [];
              onWaveDetected(); // trigger wave action
            }
          }
          lastDir = dir;
        }
      }

      lastX = x;
    });

    // ======= Initialize webcam =======
    const camera = new mpCameraUtils.Camera(videoRef.current, {
      onFrame: async () => await hands.send({ image: videoRef.current }),
      width: 640,
      height: 480,
    });
    cameraRef.current = camera;

    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        const videoEl = videoRef.current;
        if (!videoEl) return;

        videoEl.srcObject = stream;
        videoEl.onloadedmetadata = () => {
          videoEl.play().catch(err => {
            if (err.name !== "AbortError") console.error("Video play error:", err);
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
  }, [onWaveDetected]);

  return (
    <div>
      <video
        ref={videoRef}
        style={{ display: "none" }} // hidden video
        playsInline
        muted
        autoPlay
      />
      <p style={{ color: "white" }}>Wave Detector Active: Look at the camera!</p>
    </div>
  );
}
