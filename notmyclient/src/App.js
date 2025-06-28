import React, { useEffect, useState } from "react";

function App() {
  const [backendData, setBackendData] = useState({});
  const [inputValue, setInputValue] = useState("");
  const [restrictions, setRestrictions] = useState("");
  const [prompt, setPrompt] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedIdx, setFocusedIdx] = useState(0);

  useEffect(() => {
    fetch("/api")
      .then((response) => response.json())
      .then((data) => {
        setBackendData(data);
      });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch("/api/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: inputValue }),
    })
      .then((res) => res.json())
      .then((data) => {
        // Print the response to the console
        console.log("Backend response:", data);
        setInputValue("");
      });
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRecipes([]);
    setFocusedIdx(0);
    // Send restrictions and prompt to backend
    fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restrictions, prompt }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.recipes) {
          setRecipes(data.recipes);
        } else {
          setError("No recipes returned.");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to generate recipes.");
        setLoading(false);
      });
  };

  const renderNumberedList = (arr) => (
    <ol style={{ margin: 0, paddingLeft: 20 }}>
      {Array.isArray(arr) &&
        arr.map((item, i) => (
          <li key={i} style={{ marginBottom: 4 }}>
            {item}
          </li>
        ))}
    </ol>
  );

  return (
    <div
      style={{
        background: "#f4f6fb",
        minHeight: "100vh",
        fontFamily: "Inter, Arial, sans-serif",
        margin: 0,
        padding: 0,
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "48px auto",
          padding: "36px 24px",
          background: "#fff",
          borderRadius: 24,
          boxShadow:
            "0 8px 32px rgba(60,60,90,0.12), 0 1.5px 6px rgba(60,60,90,0.08)",
        }}
      >
        <h1
          style={{
            fontSize: "2.6rem",
            fontWeight: 700,
            letterSpacing: "-1px",
            color: "#2d3142",
            marginBottom: 28,
            textAlign: "center",
          }}
        >
          AI Recipe Creator
        </h1>
        <form
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            justifyContent: "center",
            marginBottom: 36,
          }}
          onSubmit={handleGenerate}
        >
          <input
            style={{
              flex: "1 1 260px",
              padding: "14px 18px",
              border: "1.5px solid #d1d5db",
              borderRadius: 8,
              fontSize: "1.1rem",
              background: "#f7f8fa",
              transition: "border 0.2s",
            }}
            type="text"
            placeholder="Dietary restrictions (e.g. vegan, gluten-free)"
            value={restrictions}
            onChange={(e) => setRestrictions(e.target.value)}
          />
          <input
            style={{
              flex: "1 1 260px",
              padding: "14px 18px",
              border: "1.5px solid #d1d5db",
              borderRadius: 8,
              fontSize: "1.1rem",
              background: "#f7f8fa",
              transition: "border 0.2s",
            }}
            type="text"
            placeholder="Recipe prompt (e.g. quick dinner with tofu)"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button
            style={{
              padding: "14px 32px",
              background: loading
                ? "#bfc9e6"
                : "linear-gradient(90deg, #5e81f4 0%, #3a5fc8 100%)",
              color: "#fff",
              fontSize: "1.1rem",
              fontWeight: 600,
              border: "none",
              borderRadius: 8,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px rgba(94,129,244,0.08)",
              transition: "background 0.2s, box-shadow 0.2s",
            }}
            type="submit"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Recipes"}
          </button>
        </form>
        {error && (
          <div
            style={{
              color: "red",
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}
        {recipes.length > 0 && (
          <div>
            {/* Tabs for other recipes */}
            <div
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 24,
                justifyContent: "center",
              }}
            >
              {recipes.map((r, idx) => (
                <button
                  key={idx}
                  onClick={() => setFocusedIdx(idx)}
                  style={{
                    background: idx === focusedIdx ? "#5e81f4" : "#e9eaf3",
                    color: idx === focusedIdx ? "#fff" : "#3a5fc8",
                    border: "none",
                    borderRadius: 8,
                    padding: focusedIdx === null ? "8px 18px" : (idx === focusedIdx ? "8px 18px" : "6px 14px"),
                    fontWeight: 600,
                    fontSize: focusedIdx === null ? "1rem" : (idx === focusedIdx ? "1rem" : "0.92rem"),
                    cursor: idx === focusedIdx ? "default" : "pointer",
                    opacity: idx === focusedIdx ? 1 : 0.7,
                    boxShadow:
                      idx === focusedIdx
                        ? "0 2px 8px rgba(94,129,244,0.08)"
                        : "none",
                    transition: "all 0.2s cubic-bezier(.4,2,.6,1)",
                    minWidth: focusedIdx === null ? 120 : (idx === focusedIdx ? 120 : 90),
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                  }}
                  disabled={idx === focusedIdx}
                  title={r.title}
                >
                  <span style={{ fontWeight: 700 }}>{r.title}</span>
                  <span style={{
                    fontSize: '0.95em',
                    color: '#222',
                    marginTop: 2,
                    fontStyle: 'italic',
                    maxWidth: 180,
                    whiteSpace: 'normal',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'block',
                    textAlign: 'center',
                  }}>{r.difference}</span>
                </button>
              ))}
            </div>
            {/* Focused recipe details */}
            {recipes[focusedIdx] && (
            <div
              style={{
                background:
                  "linear-gradient(135deg, #f7f8fa 60%, #e9eaf3 100%)",
                borderRadius: 18,
                boxShadow: "0 2px 12px rgba(60,60,90,0.07)",
                padding: "28px 22px 22px 22px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                transition: "box-shadow 0.2s, transform 0.2s",
                maxWidth: 600,
                margin: "0 auto",
              }}
            >
              <h2
                style={{
                  fontSize: "1.35rem",
                  fontWeight: 700,
                  color: "#3a5fc8",
                  marginBottom: 10,
                  display: 'flex', alignItems: 'center', gap: 10
                }}
              >
                {recipes[focusedIdx].title}
              </h2>
              <p
                style={{
                  fontSize: "1.05rem",
                  color: "#2d3142",
                  marginBottom: 8,
                }}
              >
                <b>Servings:</b> {recipes[focusedIdx].servings}
              </p>
              <div
                style={{
                  fontSize: "1.05rem",
                  color: "#2d3142",
                  marginBottom: 8,
                }}
              >
                <b>Ingredients:</b>{" "}
                {renderNumberedList(recipes[focusedIdx].ingredients)}
              </div>
              <div
                style={{
                  fontSize: "1.05rem",
                  color: "#2d3142",
                  marginBottom: 8,
                }}
              >
                <b>Tools:</b> {renderNumberedList(recipes[focusedIdx].tools)}
              </div>
              <div
                style={{
                  fontSize: "1.05rem",
                  color: "#2d3142",
                  marginBottom: 8,
                }}
              >
                <b>Instructions:</b>{" "}
                {renderNumberedList(recipes[focusedIdx].instructions)}
              </div>
            </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;