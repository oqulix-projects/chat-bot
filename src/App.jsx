import React, { useEffect, useState } from "react";
import Homepage from "./components/Homepage";
import Login from "./components/Login";
import { auth } from "../firebaseConfig"; // your firebase.js config
import { onAuthStateChanged } from "firebase/auth";
import "./App.css";

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Track login state
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe(); // cleanup
  }, []);

  if (loading) {
    return <div className="main">Loading...</div>;
  }

  return (
    <div className="main">
      {user ? <Homepage /> : <Login />}
    </div>
  );
};

export default App;
