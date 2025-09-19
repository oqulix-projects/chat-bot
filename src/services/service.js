// --------------------------------------------------
// File: src/services/service.js
// Small helper service to call the backend endpoints (/upload and /ask)

import { auth } from "../../firebaseConfig";

const API_BASE = "http://localhost:4000" //process.env.REACT_APP_API_URL ?? '';

export async function uploadFile(file) {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Upload failed');
  }

  return res.json(); // expected { message, file }
}




export async function askQuestion(question, userId, language) {
  const payload = { question, userId, language };

  const res = await fetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Ask failed');
  }

  return res.json(); // expected { question, answer, userId }
}
