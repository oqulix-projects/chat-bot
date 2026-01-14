// File: src/components/Homepage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { uploadFile, askQuestion } from "../services/service";
import "./Homepage.css";
import SpeechToText from "./SpeechToText";
import ReactMarkdown from "react-markdown";
import "./style.css";
import CharacterModel from "./CharacterModel";
import { auth } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { getAuth, signOut } from "firebase/auth";
import WaveDetector from "./WaveDetector";
import FAQ from "./FAQ";

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


  const handleAsk = async (questionToAsk) => {
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

      // store the cleaned text
      const cleanedText = cleanText(text);
      console.log("Cleaned text:", cleanedText);

      try {
        setTalking(true); // start talking state immediately
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
        audio.onplay = () => setTalking(true);
        audio.onended = () => {setTalking(false)
           setIsListening(true)};
        audio.onerror = () => setTalking(false);

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
      setBackground("url('/bg1.avif')"); // assuming bg1.jpg is inside /public
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
    <div className="main-container">
        
      {/* Settings button (visible on mobile, floating at top-left) */}
      <button
        className="settings-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        settings
      </button>

      {/* Control panel */}
      {/* <div className={`control-panel ${isOpen ? "open" : ""}`}>
        <label className="check-box">
          <input type="checkbox" onChange={handleCheckboxChange} />
          Background
        </label>

        <label className="check-box">
          <input type="checkbox" onChange={handleCameraCheckboxChange} />
          Camera
        </label>

        <div>
          <select onChange={(e) => setlanguage(e.target.value)}>
            <option value="english">English</option>
            <option value="malayalam">Malayalam</option>
            <option value="hindi">Hindi</option>
            <option value="arabic">Arabic</option>
          </select>
        </div>
        <SpeechToText
                  talking={talking}
                  language={language}
                  setQuestion={setQuestion}
                  handleAsk={handleAsk}
                  isListening={isListening} 
    setIsListening={setIsListening}
                />
                <FAQ handleAsk={handleAsk}/>
      </div> */}
      
      <div className="app-container">
        <div className="app-grid">
          {/* Upload column */}

          {/* Chat column */}
          <div className="chat-column">
            <div className="section-title">
              {/* <img src="/myg.png" width={"40px"} alt="" /> */}
              <h1 className="title">Welcome! How can I assist you?</h1>
              <div className="upload-tab-main">
                <div className="upload-tab">
                  <div className="upload-column">
                    {error && <p className="error-text">{error}</p>}
                    
                  </div>
                </div>
                <button
                  title="Logout"
                  className="logout-button"
                  onClick={logoutUser}
                >
                  <i className="fa-solid fa-arrow-right-from-bracket"></i>
                </button>
              </div>
            </div>

            {/* <div className="document-selector"> ... </div> */}

            <div className="chat-window" style={background!=''?{backgroundImage:background,backgroundSize:'cover'}:{backgroundImage:''}}>
              {/* handleWave is now stable */}
              <CharacterModel wave={wave} onWaveDetected={handleWave} talking={talking} background={background}/>
            </div>
            <div className="chat-input-container">
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  type="text"
                  placeholder={
    loading ? "Thinking..." : talking ? "Talking..." : "Type your question"
  }        className="chat-input"
                  disabled={loading || talking} // 🔹 disable input while loading or talking
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !loading && !talking) handleAsk(question);
                  }}
                />
                <button
                  onClick={() => handleAsk(question)}
                  disabled={loading || talking} // 🔹 disable button too
                  className="ask-button"
                >
                  Ask
                </button>
                
              </div>
          </div>
        </div>
      </div>
      {
        <div
          style={
            subtitle.length > 0
              ? { backgroundColor: "rgba(0,0,0,0.4)" }
              : { backgroundColor: "none" }
          }
          className="subtitle"
        >
          { <ReactMarkdown>{subtitle.length > 0 ? displaySubtitle : " "}</ReactMarkdown> }
        </div>
      }
      {/* WaveDetector is conditionally rendered based on state */}
      <div className="camera">{cameraDetection&&<WaveDetector talking={talking} isListening={isListening} onWaveDetected={handleWave} />}</div>
    </div>
  );
};

export default Homepage;