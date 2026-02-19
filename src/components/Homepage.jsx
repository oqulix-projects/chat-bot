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

const handleAsk = async (questionToAsk) => {

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
  console.log("Cleaned text:", cleanedText);

  try {
    // 🔴 STOP any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    setTalking(true);

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
    audioRef.current = audio; // 🔵 store reference

    audio.onplay = () => setTalking(true);

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

      setChat((p) => [...p, { role: "assistant", text: answer }]);
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
  
  
<a href="https://www.myg.in/" className="h-10 w-28 flex justify-center bg-white text-orange-500 rounded-3xl" style={{alignItems:'center',fontWeight:'800'}}>Shop Now</a>
  
  <div className="flex flex-col gap-6 ">

  

    {/* <label className="flex items-center justify-between gap-3 text-lg">
      <span>Background</span>
      <input
        type="checkbox"
        onChange={handleCheckboxChange}
        className="w-5 h-5 accent-orange-500"
      />
    </label>

    <label className="flex items-center justify-between gap-3 text-lg">
      <span>Camera</span>
      <input
        type="checkbox"
        onChange={handleCameraCheckboxChange}
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
    <div className="bg-gray-850 px-10 py-6 flex flex-col gap-4 z-50" style={{position:'fixed',bottom:'50px',width:'100%'}}>

      {showShowcase&&<div >
  <LaptopsShowcase/>
</div>}

      {/* Input Row */}
      <div className="flex items-center gap-6">

        {/* Text Input */}
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          type="text"
          placeholder={
            loading
              ? "Thinking..."
              : talking
              ? "Talking..."
              : "Type your question"
          }
          disabled={loading || talking}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading && !talking)
              handleAsk(question);
          }}
          className="flex-1 px-6 py-5 text-xl rounded-2xl bg-gray-700/50 focus:outline-none focus:ring-4 focus:ring-orange-500"
        />

        {/* Ask Button */}
        <button
          onClick={() => handleAsk(question)}
          disabled={loading || talking}
          className="px-8 py-5 text-xl bg-orange-500 rounded-2xl font-semibold hover:bg-orange-600 transition disabled:bg-gray-600"
        >
          Ask
        </button>

        {/* BIG Mic Button */}
        <div className=" p-6 rounded-full shadow-xl hover:scale-105 transition">
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

      {/* ================= SUBTITLES ================= */}

 {subtitle && subtitle.length > 0 && !loading && <div className="fixed top-120 left-8 z-100 animate-calloutIn" style={{maxWidth:'350px'}}>

  {/* Outer Glow */}
  <div className="absolute inset-0 rounded-2xl bg-orange-500/20 blur-2xl"></div>

  {/* Main Bubble */}
  <div className="
    relative
    bg-gradient-to-br from-orange-400/80 to-orange-600/80
    text-white
    text-sm
    px-5 py-3
    rounded-2xl
    shadow-[0_0_30px_rgba(255,140,0,0.8)]
    border border-orange-400/40
    z-20
  ">

    <ReactMarkdown>
      {subtitle.length > 0 ? displaySubtitle : " "}
    </ReactMarkdown>

    {/* Talking Tail Circles */}
   {/* Talking Tail */}



  </div>
</div>}


      {/* old subs */}
      {/* <div className="min-h-[70px] text-sm bg-black/40 p-4 rounded-xl">
        <ReactMarkdown>
          {subtitle.length > 0 ? displaySubtitle : " "}
        </ReactMarkdown>
      </div> */}

      {error && (
        <p className="text-red-400 text-lg">{error}</p>
      )}
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