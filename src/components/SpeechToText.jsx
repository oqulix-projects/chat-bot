import React, { useRef, useState, useEffect, useCallback } from "react";

// --- CONSTANTS ---
// VAD Threshold: Max volume (0-255) considered 'silence' for stopping.
const SILENCE_THRESHOLD = 150; 
// VAD Duration: Time (ms) of continuous 'silence' (below threshold) before stopping.
const SILENCE_DURATION_MS = 2000; 
// Logging frequency (for debugging)
const LOGGING_INTERVAL_MS = 250; 
// --- END CONSTANTS ---

// ⚠️ Component Signature Updated
const SpeechToText = ({ 
    handleAsk, 
    language, 
    talking, 
    isListening, // Used to auto-start recording
    setIsListening // Used to signal stop back to parent
}) => {
    
    // --- STATE & REFS ---
    const [recording, setRecording] = useState(false);
    
    // MediaRecorder Refs
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    
    // Web Audio API Refs for VAD and Cleanup
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const volumeLoggerRef = useRef(null); 
    const trackRef = useRef(null); // To store the audio track
    const silenceStartTimeRef = useRef(null); // Tracks when continuous silence began

    // --- UTILITY FUNCTION ---
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            console.log("Stop Recording called.");
            mediaRecorderRef.current.stop();
        }
    }, []);

    // --- MAIN LOGIC ---

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioTrack = stream.getAudioTracks()[0];
            trackRef.current = audioTrack; 

            // ==========================================================
            // 💥 VAD Setup (Replaces the Hard Timeout)
            // ==========================================================
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 2048; 
            source.connect(analyserRef.current);

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            silenceStartTimeRef.current = performance.now(); // Start silence timer immediately

            const checkVolumeAndStop = () => {
                if (!analyserRef.current || mediaRecorderRef.current?.state !== "recording") return;
                
                analyserRef.current.getByteFrequencyData(dataArray);

                let maxVolume = 0;
                for (let i = 0; i < bufferLength; i++) {
                    if (dataArray[i] > maxVolume) {
                        maxVolume = dataArray[i];
                    }
                }
                
                // 🔊 Debug Logging: See the volume live!
                console.log(`🔊 LIVE MAX VOLUME: ${maxVolume}`);
                
                // --- VAD Logic ---
                if (maxVolume < SILENCE_THRESHOLD) {
                    // Current frame is 'silent'. Check if duration exceeded the limit.
                    if (performance.now() - silenceStartTimeRef.current > SILENCE_DURATION_MS) {
                        console.log(`Silence detected (Max Vol: ${maxVolume}) for ${SILENCE_DURATION_MS/1000}s. Stopping recording.`);
                        stopRecording(); // 💥 Auto-stop based on silence
                        return; // Stop the function instance
                    }
                } else {
                    // Loud volume detected (above 150), reset silence timer
                    silenceStartTimeRef.current = performance.now();
                }
                
                // Set up the next check
                volumeLoggerRef.current = setTimeout(checkVolumeAndStop, LOGGING_INTERVAL_MS);
            };
            
            volumeLoggerRef.current = setTimeout(checkVolumeAndStop, LOGGING_INTERVAL_MS);
            // ==========================================================


            mediaRecorderRef.current = new MediaRecorder(stream, {
                mimeType: "audio/webm",
            });

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                // 1. Stop all listeners/timers/loops first
                if (volumeLoggerRef.current) {
                    clearTimeout(volumeLoggerRef.current);
                    volumeLoggerRef.current = null;
                }
                
                // 2. Cleanup Resources
                audioContextRef.current?.close(); 
                if (trackRef.current) trackRef.current.stop(); 

                // 3. Reset states (setRecording and setIsListening already handled)
                setRecording(false);
                setIsListening(false); 

                // 4. Only process audio if we captured data
                if (audioChunksRef.current.length === 0) {
                    console.log("Recording stopped with no audio captured.");
                    return;
                }

                // --- STT Processing Logic ---
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
                        console.log("STT result:", data.text);
                        handleAsk(data.text); 
                    } else {
                        console.error("No transcript received", data);
                    }
                } catch (err) {
                    console.error("Error sending audio:", err);
                }
                // --- End STT Processing Logic ---
            };

            mediaRecorderRef.current.start();
            setRecording(true);
            
        } catch (err) {
            console.error("Microphone access denied:", err);
            setIsListening(false);
        }
    };


    // 1. 💥 Auto-Start Logic (Triggered by isListening from parent)
    useEffect(() => {
        if (isListening && !recording) {
            console.log("Auto-start recording due to wave/greet sequence.");
            startRecording();
        }
    }, [isListening]); 


    // 2. Existing Button/Key Logic (Modified for compatibility)
    const handleButtonClick = () => {
        if (recording) {
            stopRecording();
        } else {
            if (!isListening) {
                startRecording();
            }
        }
    };

    // Listen for T key press/release
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key.toLowerCase() === "t" && !recording && !isListening) {
                startRecording();
            }
        };

        const handleKeyUp = (e) => {
            if (e.key.toLowerCase() === "t" && recording) {
                stopRecording();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        // stopRecording must be in the dependency array since it's used inside the effect
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, [recording, isListening, stopRecording]); 

    return (
        <div className="flex justify-center items-center">

  <button
    onClick={handleButtonClick}
    disabled={talking }
    className={`
      relative w-30 h-30 rounded-full
      flex flex-col items-center justify-center
      text-white font-semibold
      transition-all duration-200
      active:scale-95
      shadow-xl
      ${recording
        ? "bg-gradient-to-br from-orange-500 to-pink-600 animate-pulse"
        : "bg-gradient-to-br from-orange-600 to-orange-400 hover:scale-105"}
      ${(talking || isListening) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
    `}
  >

    {recording ? (
      <>
        <i className="fa-solid fa-share text-3xl mb-2"></i>
        <span className="text-lg tracking-wide">Listening...</span>

        {/* Ripple Effect */}
        <span className="absolute inset-0 rounded-full border-4 border-orange-400 animate-ping opacity-40"></span>
      </>
    ) : (
      <i className="fa-solid fa-microphone text-4xl"></i>
    )}

  </button>

</div>

    );
};

export default SpeechToText;