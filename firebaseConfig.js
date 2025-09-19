// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBNwSthZDXjpijaFXrBqi81L-2M33bL8Bo",
  authDomain: "oqulix-chat-bot.firebaseapp.com",
  projectId: "oqulix-chat-bot",
  storageBucket: "oqulix-chat-bot.firebasestorage.app",
  messagingSenderId: "132482555914",
  appId: "1:132482555914:web:da16084e60cca452ecfff3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);