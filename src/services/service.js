// --------------------------------------------------
// File: src/services/service.js
// Small helper service to call the backend endpoints (/upload and /ask)

// http://localhost:4000
// https://oqulix-chat-server.onrender.com

const API_BASE = "https://oqulix-chat-server.onrender.com" //process.env.REACT_APP_API_URL ?? '';

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



export async function askQuestion(question, userId, language, previousAnswer, onChunk) {
  console.log("yes its from here");
  
  const payload = { question, userId, language, previousAnswer };

  const res = await fetch(`${API_BASE}/askClaude`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Ask failed');
  }

  // ✅ STREAMING - read chunks as they arrive
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullAnswer = "";

  while (true) {
    const { done, value } = await reader.read();
    
    if (done) {
      console.log("✅ Stream complete. Full answer:", fullAnswer);
      return { answer: fullAnswer };
    }

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        
        if (data.chunk) {
          fullAnswer += data.chunk;
          console.log("🟢 Received chunk:", data.chunk);
          
          // ✅ CALL CALLBACK WITH EACH CHUNK
          if (onChunk) {
            onChunk(data.chunk);
          }
        }
        
        if (data.done) {
          return { answer: fullAnswer };
        }
      }
    }
  }
}