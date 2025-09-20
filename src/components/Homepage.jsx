// File: src/components/Homepage.jsx
import React, { useEffect, useState } from "react";
import { uploadFile, askQuestion } from "../services/service";
import "./Homepage.css";
import SpeechToText from "./SpeechToText";
import ReactMarkdown from "react-markdown";
import "./style.css";
import CharacterModel from "./CharacterModel";
import { auth } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { getAuth, signOut } from "firebase/auth";

// rafce style functional component
const Homepage = () => {
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState([]); // { role: 'user' | 'assistant', text }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [language, setlanguage] = useState("english");
  const [subtitle, setSubtitle] = useState("");
  const [background,setBackground]=useState('')

  const [talking, setTalking] = useState(false);

  const [token, setToken] = useState("");

  const [displaySubtitle, setDisplaySubtitle] = useState("");

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
    }, 20); // safer speed (2ms is too fast for React updates)

    return () => clearInterval(interval);
  }, [subtitle]);

  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("Logged in UID:", user.uid);
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

  // const handleUpload = async () => {
  //   if (!selectedFile) {
  //     setError('Please choose a file to upload');
  //     return;
  //   }
  //   setError(null);
  //   setUploading(true);
  //   try {
  //     const data = await uploadFile(selectedFile);
  //     // expected response: { message: 'File uploaded successfully', file: '<filename>' }
  //     if (data?.file) {
  //       setUploadedFiles((p) => {
  //         // avoid duplicates
  //         if (p.includes(data.file)) return p;
  //         return [...p, data.file];
  //       });
  //       setSelectedDocument(data.file);
  //     } else {
  //       setError('Upload succeeded but server returned no filename');
  //     }
  //   } catch (err) {
  //     setError(err.message || 'Upload failed');
  //   } finally {
  //     setUploading(false);
  //     setSelectedFile(null);
  //     // clear native file input if desired by setting key on input (not included here)
  //   }
  // };

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
          .replace(/[\u{1F600}-\u{1F64F}]/gu, "") // emoticons
          .replace(/[\u{1F300}-\u{1F5FF}]/gu, "") // symbols & pictographs
          .replace(/[\u{1F680}-\u{1F6FF}]/gu, "") // transport & map
          .replace(/[\u{2600}-\u{26FF}]/gu, "") // misc symbols
          .replace(/[\u{2700}-\u{27BF}]/gu, "") // dingbats
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
        audio.onended = () => setTalking(false);
        audio.onerror = () => setTalking(false);

        await audio.play();
      } catch (err) {
        console.error("Error in playTTS:", err);
        setTalking(false);
      }
    }
    // add user message to chat
    setChat((p) => [...p, { role: "user", text: question }]);
    setLoading(true);
    try {
      console.log(language);

      const resp = await askQuestion(questionToAsk, token, language);
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

  //   const handleKeyDown = (e) => {
  //     if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return; // ⛔ ignore typing

  //     if (e.key.toLowerCase() === "t") {
  //       if (window.recognition && !window.isRecognizing) {
  //         window.isRecognizing = true;
  //         window.recognition.start();
  //       }
  //     }
  //   };

  //   const handleKeyUp = (e) => {
  //     if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return; // ⛔ ignore typing

  //     if (e.key.toLowerCase() === "t") {
  //       if (window.recognition && window.isRecognizing) {
  //         window.isRecognizing = false;
  //         window.recognition.stop();
  //       }
  //       if (question.trim()) {
  //         handleAsk();
  //       }
  //     }
  //   };

  //   window.addEventListener("keydown", handleKeyDown);
  //   window.addEventListener("keyup", handleKeyUp);

  //   return () => {
  //     window.removeEventListener("keydown", handleKeyDown);
  //     window.removeEventListener("keyup", handleKeyUp);
  //   };
  // }, [question, selectedDocument]);

  // Example usage after chatbot response:

  const handleCheckboxChange = (e) => {
    if (e.target.checked) {
      setBackground("url('/bg1.avif')"); // assuming bg1.jpg is inside /public
    } else {
      setBackground(""); // remove background if unchecked
    }
  };

  return (
    <div className="main-container">
      <label className="check-box">
        <input
          type="checkbox"
          
          onChange={handleCheckboxChange}
        />
        Use Background
      </label> 
      <div className="app-container">
        <div className="app-grid">
          {/* Upload column */}

          {/* Chat column */}
          <div className="chat-column">
            <div className="section-title">
              <img src="/myg.png" width={"40px"} alt="" />
              <h1 className="title">Welcome! How can I assist you?</h1>
              <div className="upload-tab-main">
                <div className="upload-tab">
                  <div className="upload-column">
                    {error && <p className="error-text">{error}</p>}
                    <div>
                      <select
                        name=""
                        id=""
                        onChange={(e) => setlanguage(e.target.value)}
                      >
                        <option value="english">English</option>
                        <option value="malayalam">Malayalam</option>
                        <option value="Hindi">Hindi</option>
                        <option value="arabic">Arabic</option>
                      </select>
                    </div>
                  </div>
                </div>
                <button
                  title="Logout"
                  className="logout-button"
                  onClick={logoutUser}
                >
                  <i class="fa-solid fa-arrow-right-from-bracket"></i>
                </button>
              </div>
            </div>

            {/* <div className="document-selector">
          <label className="selector-label">Selected document:</label>
          <select
            className="selector-dropdown"
            value={selectedDocument}
            onChange={(e) => setSelectedDocument(e.target.value)}
          >
            <option value="">-- choose a document --</option>
            {uploadedFiles.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div> */}

            <div className="chat-window" style={background!=''?{backgroundImage:background,backgroundSize:'cover'}:{backgroundImage:''}}>
              <CharacterModel talking={talking} background={background}/>
            </div>
           <div className="chat-input-container">
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={talking?"Speaking":"Type your question..."}
                  className="chat-input"
                  disabled={loading || talking} // 🔹 disable input while loading or talking
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !loading && !talking) handleAsk();
                  }}
                />
                <button
                  onClick={() => handleAsk(question)}
                  disabled={loading || talking} // 🔹 disable button too
                  className="ask-button"
                >
                  {loading || talking ? "Thinking..." : "Ask"}
                </button>
                <SpeechToText
                  talking={talking}
                  language={language}
                  setQuestion={setQuestion}
                  handleAsk={handleAsk}
                />
              </div>
          </div>
        </div>
      </div>
      {
        <p
          style={
            subtitle.length > 0
              ? { backgroundColor: "rgba(0,0,0,0.4)" }
              : { backgroundColor: "none" }
          }
          className="subtitle"
        >
          <ReactMarkdown>{subtitle.length > 0 ? displaySubtitle : " "}</ReactMarkdown>
        </p>
      }
    </div>
  );
};

export default Homepage;
