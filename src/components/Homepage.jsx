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

  useEffect(() => {
    if (!subtitle) {
      setDisplaySubtitle("");
      return;
    }

    setDisplaySubtitle(""); // reset before typing
    let index = 0;

    const interval = setInterval(() => {
      index++;
      setDisplaySubtitle(subtitle.slice(0, index));
      if (index >= subtitle.length) {
        clearInterval(interval);
      }
    }, 20); 

    return () => clearInterval(interval);
  }, [subtitle]);

  onAuthStateChanged(auth, (user) => {
    if (user) {
      setToken(user.uid);
    } else {
      console.log("User is signed out");
    }
  });

  useEffect(() => {
    chat.length > 0 &&
      chat[chat.length - 1].role == "assistant" &&
      setSubtitle(chat[chat.length - 1].text);
  }, [chat]);

const audioRef = useRef(null);

const stopTalking=()=>{
if (audioRef.current) {
  audioRef.current.pause();
  audioRef.current.currentTime = 0;
  audioRef.current = null;
  setTalking(false);
}
}

const handleAsk = async (questionToAsk) => {
  setSubtitle("")

  // 🔴 Force stop any ongoing speech immediately
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
          // remove bold/italics markers
          .replace(/\*\*(.*?)\*\*/g, "$1")
          .replace(/\*(.*?)\*/g, "$1")
          // remove headings like ### Heading
          .replace(/#+\s/g, "")
          // remove inline code
          .replace(/`{1,3}(.*?)`{1,3}/g, "$1")
          // remove links but keep text
          .replace(/\[(.*?)\]\(.*?\)/g, "$1")
          // remove emojis (all unicode emoji ranges)
          .replace(/[\u{1F600}-\u{1F64F}]/gu, "") 
          .replace(/[\u{1F300}-\u{1F5FF}]/gu, "") 
          .replace(/[\u{1F680}-\u{1F6FF}]/gu, "") 
          .replace(/[\u{2600}-\u{26FF}]/gu, "") 
          .replace(/[\u{2700}-\u{27BF}]/gu, "") 
          // trim extra spaces
          .replace(/\s{2,}/g, " ")
          .trim()
      );
    }

async function playTTS(text) {
  console.log("GCP service playing TTS");

  const cleanedText = cleanText(text);

  try {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

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

    // ✅ Animation starts EXACTLY when audio starts
    audio.onplay = () => {
      setTalking(true);
      setChat((p) => [...p, { role: "assistant", text: text }]);
    };

    audio.onended = () => {
      setTalking(false);
      setIsListening(true);
      audioRef.current = null;
    };

    audio.onerror = () => {
      setTalking(false);
      audioRef.current = null;
    };

    await audio.play();
  } catch (err) {
    console.error("Error in playTTS:", err);
    setTalking(false);
  }
}

    // add user message to chat
    setChat((p) => [...p, { role: "user", text: questionToAsk }]);
    setLoading(true);
    try {
      console.log(language);

      const resp = await askQuestion(questionToAsk, token, language, subtitle);
      // expected: { question, answer, userId }

      const answer = resp?.answer ?? "No answer from server";
      playTTS(answer);
      
      
      setQuestion("");
    } catch (err) {
      setError(err.message || "Error getting answer");
    } finally {
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
      {/* <button
        onClick={logoutUser}
        className="bg-white text-orange-600 px-6 py-3 rounded-xl font-semibold hover:scale-105 transition"
      >
        Logout
      </button> */}

      
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

  {talking&&<div className="flex justify-center animate-calloutIn animate-calloutIn" style={{marginBottom:'120px'}}>
    <button onClick={stopTalking} className=" bg-red-600 p-10 text-2xl rounded-4xl flex gap-1 items-center" ><X/> Stop talking</button>
  </div>}


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
      className="fixed z-10 animate-calloutIn"
      style={{ top: "480px", left: "32px", maxWidth: "360px" }}
    >
      {/* Outer Glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "18px",
          background: "rgba(249,115,22,0.22)",
          filter: "blur(22px)",
        }}
      />
      {/* Main Bubble */}
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
        }}
      >
        <ReactMarkdown>
          {subtitle.length > 0 ? displaySubtitle : " "}
        </ReactMarkdown>
      </div>
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