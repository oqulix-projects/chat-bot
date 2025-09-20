import React, { useRef, useState, useEffect } from "react";
import "./Speech.css";

const SpeechToText = ({ handleAsk, language, talking }) => {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "audio/webm" });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioChunksRef.current = []; // reset buffer

        // Prepare audio for upload
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
            handleAsk(data.text); // directly ask question
          } else {
            console.error("No transcript received", data);
          }
        } catch (err) {
          console.error("Error sending audio:", err);
        }
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // Example in a React component
const handleButtonClick = () => {
  if (recording) {
    stopRecording();
  } else {
    startRecording();
  }
};

  // Listen for T key press/release
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === "t" && !recording) {
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

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [recording]);

  return (
    <div className="speak-btn-div">
    <button
  onClick={handleButtonClick}
  disabled={talking}
  className={`hold-to-speak-text ${recording ? "listening" : ""}`}
>
  {talking
    ? "Speaking..."
    : recording
    ? "Listening..."
    : <i className="fa-solid fa-microphone"></i>}
</button>



    </div>
  );
};

export default SpeechToText;
