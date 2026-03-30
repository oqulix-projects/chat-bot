// File: src/components/Homepage.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { uploadFile, askQuestion } from "../services/service";
// import "./Homepage.css";
import SpeechToText from "./SpeechToText";
import ReactMarkdown from "react-markdown";
// import "./style.css";
import CharacterModel from "./CharacterModel";
import { auth } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { getAuth, signOut } from "firebase/auth";
import WaveDetector from "./WaveDetector";
import FAQ from "./FAQ";
import LaptopsShowcase from "./LaptopsShowcase";
import Oq from "./Oq";
import { Send, X } from "lucide-react";


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
  const [token, setToken] = useState("");
  const [displaySubtitle, setDisplaySubtitle] = useState("");
  const [showShowcase,setShowShowcase]=useState(false)

  const [isListening, setIsListening] = useState(false);
console.log(loading)

  onAuthStateChanged(auth, (user) => {
    if (user) {
      setToken(user.uid);
    } else {
      console.log("User is signed out");
    }
  });

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
  
  function logoutUser() {
    const auth = getAuth();
    return signOut(auth)
      .then(() => {
        console.log("✅ User logged out");
      })
      .catch((error) => {
        console.error("❌ Logout error:", error);
      });
  }


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
  <div className="h-screen w-screen  text-white flex flex-col overflow-hidden">
    

    {/* ================= HEADER ================= */}
    <div className="bg-orange-500 px-8 py-5 flex items-center justify-between shadow-lg">

      <div className="flex items-center gap-4" style={{alignItems:'center'}}>
        <img src="/myg.png" style={{width:'90px',borderRadius:'5px'}} alt="MYG Logo" className="h-12" />
        <h1 className="text-3xl font-bold tracking-wide">
          Assistant
        </h1>
        <span style={{fontSize:'10px'}} className="text-orange-300">V.3.0.1</span>
      </div>

<div className="flex" style={{justifyContent:'right',gap:'30px'}}> 
  
  
<a href="https://runner-jet.vercel.app/" className="h-10 w-28 flex justify-center bg-white text-orange-500 rounded-3xl" style={{alignItems:'center',fontWeight:'800'}}>Play Game</a>
  
  <div className="flex flex-col gap-6 ">

  

    {/* <label className="flex items-center justify-between gap-3 text-lg">
      <span>Background</span>
      <input
        type="checkbox"
        onChange={handleCheckboxChange}
        className="w-5 h-5 accent-orange-500"
      />
    </label> */}

    

    <select
      onChange={(e) => setlanguage(e.target.value)}
      className="bg-orange-600 text-white px-2 py-2 rounded-xl text-sm w-25 focus:outline-none focus:ring-2 focus:ring-orange-500"
    >
      <option value="english">English</option>
      <option value="malayalam">Malayalam</option>
      <option value="hindi">Hindi</option>
      <option value="arabic">Arabic</option>
    </select>

  </div>
  <label className="flex items-center justify-between gap-3 text-lg">
      <span>Camera</span>
      <input
        type="checkbox"
        onChange={handleCameraCheckboxChange}
        className="w-5 h-5 accent-orange-500"
      />
    </label>

</div>
      <button
        onClick={logoutUser}
        className="bg-white text-orange-600 px-6 py-3 rounded-xl font-semibold hover:scale-105 transition"
      >
        Logout
      </button>

      
    </div>

<div className=" p-6 flex gap-10 z-30" style={{width:'95%'}}>

  {/* LEFT SIDE — SETTINGS */}
 

  {/* RIGHT SIDE — FAQ */}
  <div className="overflow-y-auto" >
    <FAQ loading={loading} handleAsk={handleAsk} setShowShowcase={setShowShowcase}/>
  </div>

</div>

    {/* ================= CHARACTER SECTION ================= */}
    <div
  className="flex-1 flex items-center justify-center relative h-30"
  // style={
  //   background
  //     ? {
  //         backgroundImage: background,
  //         backgroundSize: "cover",
  //         backgroundPosition: "center",
  //       }
  //     : {}
  // }
  style={{position:'fixed',top:'45%',width:'100%'}}
>
  {/* Subtle radial dark glow behind character */}
  <div className="absolute w-[600px] h-[600px] rounded-full bg-black/40 blur-3xl"></div>

  <CharacterModel
    wave={wave}
    onWaveDetected={handleWave}
    talking={talking}
    background={background}
    loading={loading}
  />
</div>



    {/* ================= INPUT SECTION ================= */}

<div
  style={{
    position: "fixed",
    bottom: "50px",
    width: "100%",
    zIndex: 50,
    fontFamily: "'Rajdhani', sans-serif",
  }}
>

{talking && (
  <div 
    className="fixed z-50 animate-calloutIn"
    style={{ 
      bottom: "280px",
      left: "50%",
      transform: "translateX(-50%)"
    }}
  >
    <button 
      onClick={stopTalking} 
      className="relative px-10 py-5 rounded-2xl font-bold text-white text-xl
        bg-gradient-to-br from-red-600 to-red-900
        border-2 border-red-500/70
        shadow-[0_0_50px_rgba(220,38,38,0.8),inset_0_1px_0_rgba(255,255,255,0.2)]
        hover:shadow-[0_0_60px_rgba(220,38,38,1)]
        transition-all duration-300
        flex items-center gap-3
        hover:scale-110
        active:scale-95
        backdrop-blur-sm"
      style={{
        animation: "pulse 1.5s ease-in-out infinite"
      }}
    >
      <X size={28} strokeWidth={3} className="animate-pulse" />
      <span>STOP</span>
    </button>

    <style>{`
      @keyframes pulse {
        0%, 100% {
          box-shadow: 0 0 50px rgba(220,38,38,0.8), inset 0 1px 0 rgba(255,255,255,0.2);
          transform: scale(1);
        }
        50% {
          box-shadow: 0 0 70px rgba(220,38,38,1), inset 0 1px 0 rgba(255,255,255,0.3);
          transform: scale(1.02);
        }
      }
    `}</style>
  </div>
)}

  {showShowcase && (
    <div>
      <LaptopsShowcase />
    </div>
  )}

  {/* Glass Panel */}
  <div
    style={{
      padding: "24px 24px",
      background: "rgba(9,9,11,0.82)",
      backdropFilter: "blur(20px)",
      borderTop: "1px solid rgba(249,115,22,0.18)",
      boxShadow: "0 -8px 40px rgba(0,0,0,0.55)",marginBottom:'20px'
    }}
  >
    {/* Top orange gradient rule */}
    <div
      style={{
        height: "2px",
        marginBottom: "14px",
        background:
          "linear-gradient(90deg, transparent, rgba(249,115,22,0.65) 30%, rgba(249,115,22,0.65) 70%, transparent)",
        borderRadius: "2px",
      }}
    />

    

    {/* Input Row */}
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>

      {/* Text Input wrapper */}
      <div style={{ flex: 1, position: "relative" }}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          type="text"
          placeholder={
            loading
              ? "Thinking…"
              : talking
              ? "Talking…"
              : "Ask anything about the showroom…"
          }
          disabled={loading || talking}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading && !talking) handleAsk(question);
          }}
          style={{
            width: "100%",
            padding: "14px 52px 14px 20px",
            fontSize: "16px",
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 500,
            letterSpacing: "0.3px",
            color: "#f1f5f9",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "14px",
            outline: "none",
            boxSizing: "border-box",
            caretColor: "#f97316",
            transition: "border-color 0.2s, box-shadow 0.2s",
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
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            padding: "4px",
            cursor: loading || talking ? "not-allowed" : "pointer",
            color: question.trim() ? "#f97316" : "rgba(255,255,255,0.25)",
            display: "flex",
            alignItems: "center",
            transition: "color 0.2s",
          }}
        >
          <Send size={18} strokeWidth={2} />
        </button>
      </div>

      {/* Ask Button */}
      <button
        onClick={() => handleAsk(question)}
        disabled={loading || talking}
        style={{
          padding: "14px 28px",
          fontSize: "15px",
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          color: "#fff",
          background:
            loading || talking
              ? "rgba(255,255,255,0.08)"
              : "linear-gradient(135deg, #f97316, #ea580c)",
          border: "none",
          borderRadius: "14px",
          cursor: loading || talking ? "not-allowed" : "pointer",
          boxShadow:
            loading || talking ? "none" : "0 4px 20px rgba(249,115,22,0.4)",
          whiteSpace: "nowrap",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          if (!loading && !talking) {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 6px 28px rgba(249,115,22,0.55)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(249,115,22,0.4)";
        }}
      >
        {loading ? "…" : talking ? "Wait" : "Ask"}
      </button>

      {/* BIG Mic Button */}
      
    </div>

    {/* Error */}
    {error && (
      <p
        style={{
          marginTop: "10px",
          color: "#f87171",
          fontSize: "13px",
          fontWeight: 500,
          letterSpacing: "0.2px",
        }}
      >
        {error}
      </p>
    )}
  </div>

  <div
        style={{
          position:'fixed',
          top:'550px',
          right:'70px',
          width: "170px",
          height: "170px",
          marginLeft:'20px',marginRight:'20px',
          borderRadius: "50%",
          display:'flex',
          justifyContent:'center',alignItems:'center',
          background: isListening
            ? "linear-gradient(135deg, #f97316, #dc2626)"
            : "rgba(249,115,22,0.12)",
          border: isListening
            ? "2px solid rgba(249,115,22,0.9)"
            : "2px solid rgba(249,115,22,0.3)",
          boxShadow: isListening
            ? "0 0 0 6px rgba(249,115,22,0.15), 0 0 20px rgba(249,115,22,0.4)"
            : "none",
          flexShrink: 0,
          transition: "all 0.25s ease",
        }}
      >
        <SpeechToText
          talking={talking}
          language={language}
          setQuestion={setQuestion}
          handleAsk={handleAsk}
          isListening={isListening}
          setIsListening={setIsListening}
        />
      </div>

  {/* ================= SUBTITLES ================= */}
{subtitle && subtitle.length > 0 && !loading && (
  <div
    className="fixed z-10"
    style={{ 
      top: "480px", 
      left: "32px", 
      maxWidth: "360px",
      animation: "slideInUp 0.5s ease-out forwards"
    }}
    data-subtitle="true"
  >
    {/* Outer Glow - Pulsing */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "18px",
        background: "rgba(249,115,22,0.22)",
        filter: "blur(22px)",
        animation: "pulse 2s ease-in-out infinite"
      }}
    />
    
    {/* Main Bubble - Floating */}
    <div
      style={{
        position: "relative",
        background:
          "linear-gradient(135deg, rgba(249,115,22,0.82), rgba(194,65,12,0.88))",
        color: "#fff",
        fontSize: "13px",
        lineHeight: 1.55,
        padding: "12px 18px",
        borderRadius: "18px",
        border: "1px solid rgba(251,146,60,0.4)",
        boxShadow:
          "0 0 32px rgba(249,115,22,0.5), 0 4px 16px rgba(0,0,0,0.5)",
        zIndex: 20,
        animation: "float 3s ease-in-out infinite",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* ✅ Use ReactMarkdown with ref */}
      <ReactMarkdown>
        {subtitleRef.current}
      </ReactMarkdown>
    </div>

    {/* Animated border glow */}
    <div
      style={{
        position: "absolute",
        inset: "-2px",
        borderRadius: "18px",
        background: "linear-gradient(45deg, rgba(249,115,22,0.5), rgba(251,146,60,0.3), rgba(249,115,22,0.5))",
        backgroundSize: "200% 200%",
        animation: "gradientShift 3s ease infinite",
        zIndex: -1,
        opacity: 0.6
      }}
    />

    <style>{`
      @keyframes slideInUp {
        from {
          opacity: 0;
          transform: translateY(30px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes float {
        0%, 100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-10px);
        }
      }

      @keyframes pulse {
        0%, 100% {
          opacity: 0.4;
        }
        50% {
          opacity: 0.8;
        }
      }

      @keyframes gradientShift {
        0% {
          backgroundPosition: 0% 50%;
        }
        50% {
          backgroundPosition: 100% 50%;
        }
        100% {
          backgroundPosition: 0% 50%;
        }
      }

      @keyframes typewriter {
        from {
          width: 0;
        }
        to {
          width: 100%;
        }
      }
    `}</style>
  </div>
)}

  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap');
  `}</style>
</div>


    {/* ================= CONTROL PANEL (LEFT FLOATING) ================= */}
    



    {/* ================= CAMERA ================= */}
    {cameraDetection && (
      <div className="absolute bottom-6 left-6">
        <WaveDetector
          talking={talking}
          isListening={isListening}
          onWaveDetected={handleWave}
        />
      </div>
    )}
<Oq/>
  </div>
);
}

export default Homepage;