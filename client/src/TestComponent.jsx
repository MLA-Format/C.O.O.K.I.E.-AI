import React, { useState } from "react";

function TestComponent() {
  const [response, setResponse] = useState("");

  const handleTest = async () => {
    try {
      const res = await fetch("http://localhost:8080/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: "hello" })
      });
      const data = await res.json();
      setResponse(JSON.stringify(data));
    } catch (err) {
      setResponse("Error: " + err.message);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Test Express API</h2>
      <button onClick={handleTest}>Send Test POST to /post</button>
      <div style={{ marginTop: 16 }}>
        <strong>Response:</strong>
        <pre>{response}</pre>
      </div>
    </div>
  );
}

export default TestComponent;
