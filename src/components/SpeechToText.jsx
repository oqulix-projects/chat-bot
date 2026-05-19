import React, { useRef, useState, useEffect, useCallback } from "react";

// --- CONSTANTS ---
const SILENCE_THRESHOLD = 150;
const SILENCE_DURATION_MS = 2000;
const LOGGING_INTERVAL_MS = 250;
// --- END CONSTANTS ---

const SpeechToText = ({
  handleAsk,
  language,
  talking,
  isListening,
  setIsListening,
}) => {

  const [recording, setRecording] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const volumeLoggerRef = useRef(null);
  const trackRef = useRef(null);
  const silenceStartTimeRef = useRef(null);
  const isStoppingRef = useRef(false); // Guard against double-stops

  // ── Cleanup all audio resources ──
  const cleanupAudio = useCallback(() => {
    if (volumeLoggerRef.current) {
      clearTimeout(volumeLoggerRef.current);
      volumeLoggerRef.current = null;
    }
    analyserRef.current = null; // Null this first so VAD loop exits
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (trackRef.current) {
      trackRef.current.stop();
      trackRef.current = null;
    }
  }, []);

  // ── Stop recording (safe to call multiple times) ──
  const stopRecording = useCallback(() => {
    if (isStoppingRef.current) return; // Already stopping
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      isStoppingRef.current = true;
      console.log("⏹ Stopping recording...");
      mediaRecorderRef.current.stop(); // triggers onstop
    }
  }, []);

  // ── Start recording ──
  const startRecording = useCallback(async () => {
    if (recording || isStoppingRef.current) return; // Already active

    try {
      audioChunksRef.current = [];
      isStoppingRef.current = false;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioTrack = stream.getAudioTracks()[0];
      trackRef.current = audioTrack;

      // ── VAD Setup ──
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      source.connect(analyserRef.current);

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      silenceStartTimeRef.current = performance.now();

      const checkVolumeAndStop = () => {
        // Exit if analyser was nulled (means cleanup happened)
        if (!analyserRef.current) return;
        if (mediaRecorderRef.current?.state !== "recording") return;

        analyserRef.current.getByteFrequencyData(dataArray);

        let maxVolume = 0;
        for (let i = 0; i < bufferLength; i++) {
          if (dataArray[i] > maxVolume) maxVolume = dataArray[i];
        }

        console.log(`🔊 Vol: ${maxVolume}`);

        if (maxVolume < SILENCE_THRESHOLD) {
          if (performance.now() - silenceStartTimeRef.current > SILENCE_DURATION_MS) {
            console.log(`🔇 Silence for ${SILENCE_DURATION_MS / 1000}s — auto stopping.`);
            stopRecording();
            return;
          }
        } else {
          silenceStartTimeRef.current = performance.now(); // Reset on sound
        }

        volumeLoggerRef.current = setTimeout(checkVolumeAndStop, LOGGING_INTERVAL_MS);
      };

      volumeLoggerRef.current = setTimeout(checkVolumeAndStop, LOGGING_INTERVAL_MS);

      // ── MediaRecorder Setup ──
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "audio/webm" });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        cleanupAudio();
        setRecording(false);
        setIsListening(false);
        isStoppingRef.current = false;

        if (audioChunksRef.current.length === 0) {
          console.log("No audio captured.");
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioChunksRef.current = [];

        const formData = new FormData();
        formData.append("audio", audioBlob, "speech.webm");
        formData.append("language", language);

        try {
          const response = await fetch("https://oqulix-chat-server.onrender.com/stt", {
            method: "POST",
            body: formData,
          });
          const data = await response.json();
          if (data.text) {
            console.log("✅ STT:", data.text);
            handleAsk(data.text);
          } else {
            console.error("No transcript:", data);
          }
        } catch (err) {
          console.error("STT fetch error:", err);
        }
      };

      mediaRecorderRef.current.start();
      setRecording(true);

    } catch (err) {
      console.error("Mic access denied:", err);
      setIsListening(false);
      isStoppingRef.current = false;
    }
  }, [recording, language, handleAsk, setIsListening, stopRecording, cleanupAudio]);

  // ── Button click: toggle start/stop ──
  // NOT disabled when listening — user can always stop
  const handleButtonClick = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // ── Auto-start when parent sets isListening = true ──
  useEffect(() => {
    if (isListening && !recording && !isStoppingRef.current) {
      console.log("🎙 Auto-start from parent.");
      startRecording();
    }
  }, [isListening]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── T key push-to-talk ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === "t" && !recording) startRecording();
    };
    const handleKeyUp = (e) => {
      if (e.key.toLowerCase() === "t" && recording) stopRecording();
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [recording, startRecording, stopRecording]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      cleanupAudio();
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, [cleanupAudio]);

  // ── Determine button state ──
  // Only disabled when the bot is talking — never when listening/recording
  const isDisabled = talking;

  return (
    <div className="flex justify-center items-center">
      <button
        onClick={handleButtonClick}
        disabled={isDisabled}
        className={`
          relative w-11 h-11 rounded-full
          flex items-center justify-center
          text-white
          transition-all duration-200
          active:scale-95
          shadow-md
          ${recording
            ? "bg-gradient-to-br from-red-500 to-red-600 animate-pulse border border-red-400/40"
            : "bg-orange-500 hover:bg-orange-600 hover:scale-105 border border-orange-400/20"}
          ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        {recording ? (
          <>
            <i className="fa-solid fa-stop text-base"></i>
            <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-50"></span>
          </>
        ) : (
          <i className="fa-solid fa-microphone text-lg"></i>
        )}
      </button>
    </div>
  );
};

export default SpeechToText;