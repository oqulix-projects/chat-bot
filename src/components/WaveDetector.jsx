import React, { useRef, useEffect } from "react";
import * as mpHands from "@mediapipe/hands";
import * as mpCameraUtils from "@mediapipe/camera_utils";

// IMPORTANT: Ensure 'onWaveDetected' passed from the parent is wrapped in React.useCallback().

export default function WaveDetector({ onWaveDetected, talking, isListening }) {
  const videoRef = useRef(null);

  const cameraRef = useRef(null);

  const handsRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) return;

    // ======= Config =======

    const threshold = 0.05; // min x movement to count

    const requiredFlips = 2; // direction changes = wave

    const windowMs = 800;
    // time window for flips

    const cooldownMs = 6000; // 6 seconds cooldown after a wave

    let lastX = null;

    let lastDir = 0;

    let flips = 0;

    let flipTimestamps = [];

    let lastTrigger = 0; // Tracks the last time we successfully called onWaveDetected

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

      // 🛑 FIX 1: Prevent detection if the bot is currently busy (talking or listening)
      if (talking || isListening) {
        // Optionally reset internal wave state while busy to prevent immediate trigger when status changes
        lastX = null;
        lastDir = 0;
        flips = 0;
        flipTimestamps = [];
        return;
      }

      // 🛑 FIX 2: IMMEDIATELY RETURN if within the cooldown window (6 seconds)

      if (now - lastTrigger < cooldownMs) return;

      if (
        !results.multiHandLandmarks ||
        results.multiHandLandmarks.length === 0
      ) {
        // Reset state when hand is not visible

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
              // Trigger wave (no need for an inner if/else now, since we checked at the top)

              onWaveDetected();

              lastTrigger = now; // Set cooldown timestamp

              flips = 0;

              flipTimestamps = [];

              lastDir = 0; // Reset last direction

              // 🛑 CRITICAL: We stop processing this frame immediately after a trigger

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

    // ======= Initialize webcam (unchanged) =======

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

    // ======= Cleanup (unchanged) =======

    return () => {
      cameraRef.current?.stop();

      handsRef.current?.close();

      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, [onWaveDetected, talking, isListening]); // Added talking and isListening to dependencies

  return (
    <div>
      <video
        ref={videoRef}
        // style={{ display: "none" }}
        playsInline
        muted
        autoPlay
      />

      <p style={{ color: "white" }}></p>
    </div>
  );
}
