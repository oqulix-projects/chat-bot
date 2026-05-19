// File: src/components/Homepage.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { uploadFile, askQuestion } from "../services/service";
// import "./Homepage.css";
import SpeechToText from "./SpeechToText";
import ReactMarkdown from "react-markdown";
// import "./style.css";
import CharacterModel from "./CharacterModel";
import WaveDetector from "./WaveDetector";
import FAQ from "./FAQ";
import LaptopsShowcase from "./LaptopsShowcase";
import Oq from "./Oq";
import { Send, X, Sparkles, MessageCircle, Mic, RefreshCw, VolumeX } from "lucide-react";
// 1. Import at the top
import ThinkingLoader from "./ThinkingLoader";

// 2. Drop it anywhere in the JSX (before the closing </div>)



// 🌟 OPTIMIZATION 1: Move constants OUTSIDE the component to ensure stability (never re-created)
const greetings = {
  english: [
    "Hi! How can I assist you today?",
    "Hello! What can I do for you?",
    "Hey there! Need any help?",
    "Hi! How may I help you?",
    "Hello! What assistance do you need?"
  ],
  malayalam: [
    "ഹായ്! ഞാൻ എങ്ങനെ സഹായിക്കാമെന്ന് പറയൂ?",
    "നമസ്കാരം! എന്ത് സഹായം വേണം?",
    "ഹേയ്! സഹായം വേണോ?",
    "ഹായ്! എനിക്ക് നിങ്ങളെ സഹായിക്കാമോ?",
    "നമസ്കാരം! എങ്ങനെ സഹായിക്കണം?"
  ],
  hindi: [
    "नमस्ते! मैं आपकी कैसे मदद कर सकता हूँ?",
    "हैलो! आपको किस चीज़ में मदद चाहिए?",
    "अरे! कोई मदद चाहिए?",
    "नमस्ते! मैं आपकी सहायता कर सकता हूँ?",
    "हैलो! मैं आपकी कैसे सहायता करूँ?"
  ],
  arabic: [
    "مرحباً! كيف يمكنني مساعدتك اليوم؟",
    "أهلاً! ماذا يمكنني أن أفعل من أجلك؟",
    "مرحباً! هل تحتاج إلى أي مساعدة؟",
    "أهلاً! كيف يمكنني خدمتك؟",
    "مرحباً! كيف يمكنني دعمك اليوم؟"
  ]
};

// Utility function for pausing execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const Homepage = () => {
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState([]); // { role: 'user' | 'assistant', text }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [language, setlanguage] = useState("english");
  const [subtitle, setSubtitle] = useState("");
  const [background,setBackground]=useState('')
  const [wave,setWave]=useState(false)
  const [cameraDetection, setCameraDetection]=useState(false) // Toggles WaveDetector
  const [talking, setTalking] = useState(false);
  const [token, setToken] = useState("guest-user");
  const [displaySubtitle, setDisplaySubtitle] = useState("");
  const [showShowcase,setShowShowcase]=useState(false)

  const [isListening, setIsListening] = useState(false);
console.log(loading)

  // useEffect(() => {
  //   chat.length > 0 &&
  //     chat[chat.length - 1].role == "assistant" &&
  //     setSubtitle(chat[chat.length - 1].text);
  // }, [chat]);

const audioRef = useRef(null);

const stopTalking=()=>{
if (audioRef.current) {
  audioRef.current.pause();
  audioRef.current.currentTime = 0;
  audioRef.current = null;
  setTalking(false);
}
}

const subtitleRef = useRef("");


const handleAsk = async (questionToAsk) => {
  setSubtitle("")
  setLoading(true);

  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current = null;
    setTalking(false);
  }

  console.log("asking");
  console.log(questionToAsk);

  setError(null);
  if (!questionToAsk.trim()) {
    setError("Please type your question");
    return;
  }

  function cleanText(text) {
    return (
      text
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/#+\s/g, "")
        .replace(/`{1,3}(.*?)`{1,3}/g, "$1")
        .replace(/\[(.*?)\]\(.*?\)/g, "$1")
        .replace(/[\u{1F600}-\u{1F64F}]/gu, "") 
        .replace(/[\u{1F300}-\u{1F5FF}]/gu, "") 
        .replace(/[\u{1F680}-\u{1F6FF}]/gu, "") 
        .replace(/[\u{2600}-\u{26FF}]/gu, "") 
        .replace(/[\u{2700}-\u{27BF}]/gu, "") 
        .replace(/\s{2,}/g, " ")
        .trim()
    );
  }

  let sentenceBuffer = "";
  let fullText = "";
  let ttsQueue = [];
  let isPlayingTTS = false;
  let hasReceivedFirstChunk = false;

  async function playTTSSentence(text) {
    console.log("🔊 Playing sentence:", text);

    const cleanedText = cleanText(text);
    if (!cleanedText || cleanedText.length < 5) return;

    try {
      let voiceName;
      let languageCode;

      switch (language.toLowerCase()) {
        case "malayalam":
          languageCode = "ml-IN";
          voiceName = "ml-IN-Wavenet-A";
          break;
        case "hindi":
          languageCode = "hi-IN";
          voiceName = "hi-IN-Wavenet-A";
          break;
        case "arabic":
          languageCode = "ar-XA";
          voiceName = "ar-XA-Chirp3-HD-Achernar";
          break;
        case "english":
        default:
          languageCode = "en-US";
          voiceName = "en-US-Wavenet-F";
          break;
      }

      const resp = await fetch(
        "https://oqulix-chat-server.onrender.com/speak",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: cleanedText,
            languageCode,
            voiceName,
          }),
        }
      );

      if (!resp.ok) throw new Error("TTS request failed");

      const buf = await resp.arrayBuffer();
      const blob = new Blob([buf], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => {
        setTalking(true);
        setSubtitle(text);
      };

      audio.onended = () => {
        console.log("✅ Audio ended, queue length:", ttsQueue.length);
        
        if (ttsQueue.length > 0) {
          const nextSentence = ttsQueue.shift();
          playTTSSentence(nextSentence);
        } else {
          // ✅ STOP TALKING WHEN QUEUE IS EMPTY
          console.log("🛑 No more sentences in queue. Stopping...");
          setTalking(false);
          setIsListening(true);
          audioRef.current = null;
          setLoading(false);
          setSubtitle(fullText);
        }
      };

      audio.onerror = (error) => {
        console.error("Audio error:", error);
        setTalking(false);
        audioRef.current = null;
      };

      // ✅ Add timeout to prevent infinite talking
      const timeoutId = setTimeout(() => {
        console.warn("⚠️ Audio timeout - forcing stop");
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setTalking(false);
      }, 120000); // 2 minutes max

      audio.addEventListener('ended', () => clearTimeout(timeoutId), { once: true });

      await audio.play();
    } catch (err) {
      console.error("Error in playTTS:", err);
      setTalking(false);
    }
  }

  const handleChunk = (chunk) => {
    sentenceBuffer += chunk;
    fullText += chunk;
    
    console.log("📝 Buffer:", sentenceBuffer);
    
    if (subtitleRef.current !== undefined) {
      subtitleRef.current = fullText;
    }

    if (!hasReceivedFirstChunk) {
      hasReceivedFirstChunk = true;
      setLoading(false);
      console.log("✅ First chunk received! Loading stopped.");
    }

    const sentenceRegex = /[.!?]+|\n/g;
    let match;
    let lastIndex = 0;

    while ((match = sentenceRegex.exec(sentenceBuffer)) !== null) {
      const sentence = sentenceBuffer.substring(lastIndex, match.index + match[0].length).trim();
      
      if (sentence) {
        console.log("✅ Complete sentence:", sentence);
        ttsQueue.push(sentence);

        if (!isPlayingTTS) {
          isPlayingTTS = true;
          const firstSentence = ttsQueue.shift();
          playTTSSentence(firstSentence);
        }
      }
      
      lastIndex = match.index + match[0].length;
    }

    sentenceBuffer = sentenceBuffer.substring(lastIndex);
  };

  setChat((p) => [...p, { role: "user", text: questionToAsk }]);

  try {
    console.log(language);

    const resp = await askQuestion(questionToAsk, token, language, subtitle, handleChunk);
    const answer = resp?.answer ?? "No answer from server";

    if (sentenceBuffer.trim()) {
      console.log("✅ Final sentence:", sentenceBuffer);
      ttsQueue.push(sentenceBuffer);
      
      if (!isPlayingTTS) {
        isPlayingTTS = true;
        const firstSentence = ttsQueue.shift();
        playTTSSentence(firstSentence);
      }
    }

    setChat((p) => [...p, { role: "assistant", text: answer }]);
    
    setQuestion("");
  } catch (err) {
    console.error("Error:", err);
    setError(err.message || "Error getting answer");
    setTalking(false);
    setLoading(false);
  }
};



  async function playTTSWave(text) {
      console.log("GCP service playing TTS for wave");

      // store the cleaned text
      const cleanedText = text;
      console.log("Cleaned text:", cleanedText);

      try {
      
        setWave(true)
        let voiceName;
        let languageCode;

        switch (language.toLowerCase()) {
          case "malayalam":
            languageCode = "ml-IN";
            voiceName = "ml-IN-Wavenet-A";
            break;
          case "hindi":
            languageCode = "hi-IN";
            voiceName = "hi-IN-Wavenet-A";
            break;
          case "arabic":
            languageCode = "ar-XA";
            voiceName = "ar-XA-Chirp3-HD-Achernar";
            break;
          case "english":
          default:
            languageCode = "en-US";
            voiceName = "en-US-Wavenet-F";
            break;
        }

        // const idToken = await auth.currentUser.getIdToken();

        const resp = await fetch("https://oqulix-chat-server.onrender.com/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: cleanedText, //send cleaned text
            languageCode,
            voiceName,
          }),
        });

        if (!resp.ok) throw new Error("TTS request failed");

        const buf = await resp.arrayBuffer();
        const blob = new Blob([buf], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);

        const audio = new Audio(url);

        // Track start/end/error like in Web Speech API
        audio.onplay = () => setWave(true);
        audio.onended = () => setWave(false);
        audio.onerror = () => setWave(false);

        await audio.play();
      } catch (err) {
        console.error("Error in playTTSWave:", err);
        setWave(false);
      }
    }

  // 🌟 OPTIMIZATION 2: useCallback is now stable because 'greetings' is stable
  const handleWave = useCallback(async() => {
    
    {// Trigger your 3D model animation, ChatGPT, TTS, etc.
    const waveReply = greetings[language]?.[Math.floor(Math.random() * greetings[language].length)] || greetings.english[0];
    console.log(waveReply);
    
    // 1. Await TTS completion
    await playTTSWave(waveReply);
    setSubtitle(waveReply);
    // 2. Pause execution for 3 seconds (3000 milliseconds)
    await delay(3000); 
    
    
    setIsListening(true);}
  }, [language]); // Only dependency needed now is 'language'

  const handleCheckboxChange = (e) => {
    if (e.target.checked) {
      setBackground("url('/bg2.png')"); // assuming bg1.jpg is inside /public
    } else {
      setBackground(""); // remove background if unchecked
    }
  };

  const handleCameraCheckboxChange = (e) => {
    if (e.target.checked) {
      setCameraDetection(true); 
    } else {
      setCameraDetection(false); 
    }
  };

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="min-h-screen w-screen flex items-center justify-center p-0 md:p-6 overflow-hidden relative"
      style={{
        backgroundImage: "url('/bg2.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      
      {/* Background ambient glowing blobs */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-pink-600/10 blur-[120px] pointer-events-none"></div>

      {/* Main Interactive Mobile Viewport */}
      <div className="w-full h-full fixed inset-0 md:relative md:inset-auto md:h-[860px] md:max-w-[420px] md:rounded-[40px] md:border-[10px] md:border-zinc-800/90 md:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9)] text-white flex flex-col overflow-hidden transition-all duration-300">
        
        {/* ================= COMPACT MOBILE HEADER ================= */}
        <div 
          className="bg-orange-500/90 backdrop-blur-md px-4 flex items-center justify-between shadow-md z-40 border-b border-orange-400/20"
          style={{
            paddingTop: "max(12px, env(safe-area-inset-top))",
            paddingBottom: "12px"
          }}
        >
          <div className="flex items-center gap-2">
            <img src="/myg.png" className="h-8 rounded" alt="MYG Logo" style={{ width: '60px' }} />
            <div className="flex flex-col">
              <h1 className="text-base font-bold leading-none tracking-wide text-white flex items-center gap-1">
                Assistant
              </h1>
              <span className="text-[9px] text-orange-200 mt-0.5 leading-none">V.3.0.1</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              onChange={(e) => setlanguage(e.target.value)}
              className="bg-orange-600 text-white px-2 py-1 rounded-lg text-xs font-semibold focus:outline-none cursor-pointer hover:bg-orange-700 transition"
              value={language}
            >
              <option value="english">EN</option>
              <option value="malayalam">ML</option>
              <option value="hindi">HI</option>
              <option value="arabic">AR</option>
            </select>
          </div>
        </div>

        {/* ================= QUICK QUESTIONS (FAQ) ================= */}
        <FAQ loading={loading} handleAsk={handleAsk} setShowShowcase={setShowShowcase} />

        {/* ================= CHARACTER SECTION ================= */}
        <div
          className="absolute inset-0 flex items-center justify-center z-10"
          style={{ pointerEvents: 'none', top: '40px' }}
        >
          {/* Subtle radial dark glow behind character */}
          <div className="absolute w-[260px] h-[260px] rounded-full bg-black/40 blur-3xl pointer-events-none"></div>

          <div style={{ pointerEvents: 'auto' }} className="w-full h-full flex items-center justify-center">
            <CharacterModel
              wave={wave}
              onWaveDetected={handleWave}
              talking={talking}
              background={background}
              loading={loading}
            />
          </div>
        </div>

        {/* ================= SUBTITLES ================= */}
        {subtitle && subtitle.length > 0 && !loading && (
          <div
            className="absolute z-30 animate-slideInUp"
            style={{ 
              bottom: "130px", // Adjusted above the consolidated bottom panel
              left: "16px", 
              right: "16px",
              maxWidth: "calc(100% - 32px)",
              pointerEvents: 'auto'
            }}
            data-subtitle="true"
          >
            {/* Outer Glow - Pulsing */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "16px",
                background: "rgba(249,115,22,0.15)",
                filter: "blur(16px)",
                animation: "pulse 2s ease-in-out infinite"
              }}
            />
            
            {/* Main Bubble - Floating */}
            <div
              style={{
                position: "relative",
                background: "linear-gradient(135deg, rgba(249,115,22,0.3), rgba(194,65,12,0.03))",
                color: "#fff",
                fontSize: "12px",
                lineHeight: 1.45,
                padding: "10px 14px",
                borderRadius: "16px",
                border: "1px solid rgba(251,146,60,0.3)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                zIndex: 20,
                backdropFilter: "blur(8px)",
              }}
            >
              <ReactMarkdown>
                {subtitleRef.current}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* ================= BOTTOM ACTION SHEET / INPUTS ================= */}
        <div
          className="absolute bottom-0 left-0 w-full z-40"
          style={{
            fontFamily: "'Rajdhani', sans-serif",
          }}
        >
          {talking && (
            <div 
              className="absolute z-50 animate-calloutIn"
              style={{ 
                bottom: "125px", // Positioned bottom center above the glass panel
                left: "50%",
                transform: "translateX(-50%)"
              }}
            >
              <button 
                onClick={stopTalking} 
                className="relative px-6 py-3 rounded-full font-bold text-white text-sm
                  bg-gradient-to-br from-red-600 to-red-900
                  border border-red-500/50
                  shadow-[0_0_30px_rgba(220,38,38,0.6),inset_0_1px_0_rgba(255,255,255,0.2)]
                  hover:scale-105 active:scale-95 transition-all duration-300
                  flex items-center gap-2 backdrop-blur-sm"
                style={{
                  animation: "pulseRed 1.5s ease-in-out infinite"
                }}
              >
                <X size={16} strokeWidth={3} />
                <span>STOP TALKING</span>
              </button>

              <style>{`
                @keyframes pulseRed {
                  0%, 100% {
                    box-shadow: 0 0 30px rgba(220,38,38,0.6);
                    transform: scale(1);
                  }
                  50% {
                    box-shadow: 0 0 45px rgba(220,38,38,0.8);
                    transform: scale(1.03);
                  }
                }
              `}</style>
            </div>
          )}

          {showShowcase && (
            <div className="absolute bottom-[210px] left-0 w-full max-h-[220px] overflow-y-auto bg-slate-950/95 border-t border-orange-500/20 z-50">
              <LaptopsShowcase />
            </div>
          )}

          {/* Glass Panel */}
          <div
            className="flex flex-col gap-3 p-4"
            style={{
              background: "rgba(10, 10, 12, 0.88)",
              backdropFilter: "blur(24px)",
              borderTop: "1px solid rgba(249,115,22,0.22)",
              boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
              paddingBottom: "max(24px, env(safe-area-inset-bottom))"
            }}
          >
            {/* Top orange gradient rule */}
            <div
              style={{
                height: "2px",
                background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.6) 30%, rgba(249,115,22,0.6) 70%, transparent)",
                borderRadius: "2px",
              }}
            />

            {/* Input Row */}
            <div className="flex items-center gap-3">
              {/* Text Input wrapper */}
              <div className="flex-1 relative">
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  type="text"
                  placeholder={
                    loading
                      ? "Thinking…"
                      : talking
                      ? "Talking…"
                      : "Ask about the showroom…"
                  }
                  disabled={loading || talking}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !loading && !talking) handleAsk(question);
                  }}
                  className="w-full text-sm font-medium tracking-wide text-slate-100 placeholder-slate-400 bg-white/5 border border-white/10 rounded-xl outline-none transition"
                  style={{
                    padding: "12px 42px 12px 16px",
                    caretColor: "#f97316",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(249,115,22,0.6)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255,255,255,0.1)";
                    e.target.style.boxShadow = "none";
                  }}
                />
                {/* Send icon inside input */}
                <button
                  onClick={() => !loading && !talking && handleAsk(question)}
                  disabled={loading || talking}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-none border-none cursor-pointer flex items-center transition"
                  style={{
                    color: question.trim() ? "#f97316" : "rgba(255,255,255,0.25)",
                  }}
                >
                  <Send size={16} strokeWidth={2} />
                </button>
              </div>

              {/* WhatsApp voice note mic button */}
              <div className="flex-shrink-0">
                <SpeechToText
                  talking={talking}
                  language={language}
                  setQuestion={setQuestion}
                  handleAsk={handleAsk}
                  isListening={isListening}
                  setIsListening={setIsListening}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-center text-xs font-semibold tracking-wide text-red-400 mt-1">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* ================= CAMERA/WATERMARK/OTHERS ================= */}
        {cameraDetection && (
          <div className="absolute top-16 right-4 z-50 overflow-hidden rounded-xl border border-white/10 shadow-lg scale-75 origin-top-right">
            <WaveDetector
              talking={talking}
              isListening={isListening}
              onWaveDetected={handleWave}
            />
          </div>
        )}

        <ThinkingLoader visible={loading} />
        
        <div className="absolute bottom-2 left-4 z-40 pointer-events-none scale-75 origin-bottom-left opacity-30">
          <Oq />
        </div>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap');
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
          }
        `}</style>

      </div>
    </div>
  );
}

export default Homepage;