import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebaseConfig"; 
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("✅ Logged in:", userCredential.user);
    } catch (err) {
      console.error("❌ Login error:", err.message);
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <>
            

      <div className="login-container">
          <div className="login-head">
              <img width={'50px'} src="/OQ.png" alt="" />
              <h1>Oqulix  Private Limited</h1></div>
         
        <div className="login-card">
          <div className="login-image">
            <img src="/login.jpg" alt="Login" />
          </div>
          <div className="login-form-side">
            <form onSubmit={handleLogin} className="login-form">
              <h2 className="login-title">Login</h2>
  
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
                required
              />
  
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                required
              />
  
              {error && <p className="login-error">Error: Invalid email or password</p>}
  
              <button type="submit" disabled={loading} className="login-button">
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
