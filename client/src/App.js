import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";

// --- Sprinkle Animation Component ---
// Handles rainbow sprinkle effect on mouse move
const SprinkleComponent = React.memo(({ sprinkle }) => (
  <div
    style={{
      position: 'fixed',
      left: sprinkle.x,
      top: sprinkle.y,
      width: sprinkle.size,
      height: sprinkle.size * 3,
      backgroundColor: sprinkle.color,
      borderRadius: '2px',
      transform: `rotate(${sprinkle.rotation}deg)`,
      pointerEvents: 'none',
      zIndex: 9999,
      willChange: 'transform',
    }}
  />
));

// --- Recipe Tab Button ---
const RecipeTab = React.memo(({ recipe, index, focusedIdx, onTabClick }) => (
  <button
    onClick={() => onTabClick(index)}
    style={{
      background: index === focusedIdx ? "#f3d6b6" : "#f8e5c2",
      color: index === focusedIdx ? "#6b4f27" : "#a67c52",
      border: "3px solid #000",
      borderRadius: 12,
      padding: index === focusedIdx ? "10px 22px" : "8px 18px",
      fontWeight: 600,
      fontSize: "1.31rem",
      fontFamily: "'Quicksand', sans-serif",
      cursor: index === focusedIdx ? "default" : "pointer",
      opacity: index === focusedIdx ? 1 : 0.7,
      boxShadow: index === focusedIdx ? "2px 2px 0px #000" : "3px 3px 0px #000",
      transition: "all 0.2s cubic-bezier(.4,2,.6,1)",
      minWidth: 120,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      transform: index === focusedIdx ? "translate(1px, 1px)" : "translate(0px, 0px)",
    }}
    disabled={index === focusedIdx}
    title={recipe.title}
  >
    <span style={{ fontWeight: 700 }}>{recipe.title}</span>
  </button>
));

function App() {
  // --- State ---
  const [backendData, setBackendData] = useState({});
  const [inputValue, setInputValue] = useState("");
  const [restrictions, setRestrictions] = useState("");
  const [prompt, setPrompt] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedIdx, setFocusedIdx] = useState(0);

  // --- Sprinkle Animation System ---
  const animationFrameRef = useRef();
  const lastMouseMoveTime = useRef(0);
  const sprinkleIdCounter = useRef(0);
  const sprinklesArray = useRef([]);
  const maxSprinkles = 6;

  // --- Fetch backend test data on mount ---
  useEffect(() => {
    fetch("/api")
      .then((response) => response.json())
      .then((data) => {
        setBackendData(data);
      });
  }, []);

  // --- Rainbow sprinkle color palette ---
  const rainbowColors = useMemo(() => ['#ff0000', '#ff8000', '#ffff00', '#00ff00', '#0080ff', '#8000ff', '#ff0080'], []);

  // --- Sprinkle creation helper ---
  const createSprinkle = useCallback((x, y) => {
    const sprinkle = document.createElement('div');
    const size = Math.random() * 6 + 4;
    const color = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
    const rotation = Math.random() * 360;
    sprinkle.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size * 2.5}px;
      background-color: ${color};
      border: 2px solid #000;
      border-radius: 4px;
      transform: rotate(${rotation}deg);
      pointer-events: none;
      z-index: 9999;
      box-shadow: inset 1px 1px 2px rgba(255,255,255,0.3), inset -1px -1px 2px rgba(0,0,0,0.2);
      will-change: transform;
    `;
    document.body.appendChild(sprinkle);
    return {
      element: sprinkle,
      x: x,
      y: y,
      velocityY: Math.random() * 3 + 1,
      velocityX: (Math.random() - 0.5) * 2,
      rotation: rotation,
      createdAt: Date.now(),
      id: ++sprinkleIdCounter.current
    };
  }, [rainbowColors]);

  // --- Mouse move handler for sprinkles ---
  const handleMouseMove = useCallback((e) => {
    if (loading) return;
    const now = Date.now();
    if (now - lastMouseMoveTime.current < 400) return;
    lastMouseMoveTime.current = now;
    while (sprinklesArray.current.length >= maxSprinkles) {
      const oldSprinkle = sprinklesArray.current.shift();
      if (oldSprinkle.element.parentNode) {
        oldSprinkle.element.parentNode.removeChild(oldSprinkle.element);
      }
    }
    const newSprinkle = createSprinkle(e.clientX, e.clientY);
    sprinklesArray.current.push(newSprinkle);
  }, [loading, createSprinkle]);

  // --- Sprinkle animation loop ---
  useEffect(() => {
    const animateSprinkles = () => {
      const now = Date.now();
      sprinklesArray.current = sprinklesArray.current.filter(sprinkle => {
        const age = now - sprinkle.createdAt;
        if (age > 1200) {
          if (sprinkle.element.parentNode) {
            sprinkle.element.parentNode.removeChild(sprinkle.element);
          }
          return false;
        }
        sprinkle.y += sprinkle.velocityY;
        sprinkle.x += sprinkle.velocityX;
        sprinkle.rotation += 2;
        sprinkle.element.style.transform = `translate(${sprinkle.x - sprinkle.element.offsetLeft}px, ${sprinkle.y - sprinkle.element.offsetTop}px) rotate(${sprinkle.rotation}deg)`;
        return true;
      });
      animationFrameRef.current = requestAnimationFrame(animateSprinkles);
    };
    animationFrameRef.current = requestAnimationFrame(animateSprinkles);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      sprinklesArray.current.forEach(sprinkle => {
        if (sprinkle.element.parentNode) {
          sprinkle.element.parentNode.removeChild(sprinkle.element);
        }
      });
      sprinklesArray.current = [];
    };
  }, []);

  // --- Add mousemove listener for sprinkles ---
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // --- Demo add endpoint ---
  const handleSubmit = (e) => {
    e.preventDefault();
    fetch("/api/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: inputValue }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Backend response:", data);
        setInputValue("");
      });
  };

  // --- Generate recipes from backend ---
  const handleGenerate = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRecipes([]);
    setFocusedIdx(0);
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

  // --- Render numbered list helper ---
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

  // --- Main Render ---
  return (
    <div
      style={{
        background: "#f8f5f0",
        minHeight: "100vh",
        fontFamily: "'Quicksand', sans-serif",
        margin: 0,
        padding: 0,
      }}
    >
      {/* Global CSS reset and font import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { margin: 0 !important; padding: 0 !important; font-family: 'Quicksand', sans-serif !important; }
        html { margin: 0; padding: 0; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      <div
        style={{
          maxWidth: 900,
          margin: "0px auto",
          borderRadius: 10,
          boxShadow:
            "0 8px 32px rgba(180, 140, 90, 0.10), 0 1.5px 6px rgba(180, 140, 90, 0.08)",
          overflow: "hidden",
        }}
      >
        {/* --- Title Bar --- */}
        <div
          style={{
            background: "#f3d6b6",
            padding: "24px 24px 45px 24px",
            position: "relative",
            borderBottom: "4px solid #000",
          }}
        >
          {/* Rotating cookie on the left */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0 20px",
              position: "relative",
            }}
          >
            <div
              style={{
                width: "310px",
                height: "310px",
                animation: "rotate 10s linear infinite",
                borderRadius: "0%",
                position: "absolute",
                left: "-55px",
                top: "-75px",
                pointerEvents: "none",
              }}
            >
              <img 
                src="/CookieSpinning2.png" 
                alt="Spinning Cookie" 
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "50%",
                }}
              />
            </div>
            {/* Logo on the right */}
            <img 
              src="/CookieAI2.png" 
              alt="Cookie AI Logo" 
              style={{
                height: "112px",
                objectFit: "contain",
                marginLeft: "auto",
                marginTop: "30px",
              }}
            />
          </div>
        </div>
        {/* --- Main Content --- */}
        <div
          style={{
            background: "#fff8e7",
            padding: "36px 24px",
          }}
        >
        {/* Tagline */}
        <div
          style={{
            textAlign: "center",
            marginTop: "40px",
            marginBottom: "18px",
            fontSize: "1.6rem",
            color: "#6b4f27",
            fontFamily: "'Quicksand', sans-serif",
            fontWeight: 600,
          }}
        >
          Create delicious recipes tailored to your taste and dietary needs!
        </div>
        {/* --- Recipe Form --- */}
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
              border: "3px solid #000",
              borderRadius: 12,
              fontSize: "1.1rem",
              fontFamily: "'Quicksand', sans-serif",
              background: "#fdf6ed",
              transition: "all 0.2s",
              boxShadow: "3px 3px 0px #000",
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
              border: "3px solid #000",
              borderRadius: 12,
              fontSize: "1.1rem",
              fontFamily: "'Quicksand', sans-serif",
              background: "#fdf6ed",
              transition: "all 0.2s",
              boxShadow: "3px 3px 0px #000",
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
                ? "#e7d7c1"
                : "linear-gradient(90deg, #f3d6b6 0%, #c9a06c 100%)",
              color: "#6b4f27",
              fontSize: "1.1rem",
              fontFamily: "'Quicksand', sans-serif",
              fontWeight: 600,
              border: "3px solid #000",
              borderRadius: 12,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "3px 3px 0px #000",
              transition: "all 0.2s",
              transform: loading ? "translate(2px, 2px)" : "translate(0px, 0px)",
            }}
            type="submit"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Recipes"}
          </button>
        </form>
        {/* --- Error Message --- */}
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
        {/* --- Recipe Tabs and Details --- */}
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
                    background: idx === focusedIdx ? "#f3d6b6" : "#f8e5c2",
                    color: idx === focusedIdx ? "#6b4f27" : "#a67c52",
                    border: "3px solid #000",
                    borderRadius: 12,
                    padding: focusedIdx === null ? "10px 22px" : (idx === focusedIdx ? "10px 22px" : "8px 18px"),
                    fontWeight: 600,
                    fontSize: "1.31rem",
                    fontFamily: "'Quicksand', sans-serif",
                    cursor: idx === focusedIdx ? "default" : "pointer",
                    opacity: idx === focusedIdx ? 1 : 0.7,
                    boxShadow: idx === focusedIdx ? "2px 2px 0px #000" : "3px 3px 0px #000",
                    transition: "all 0.2s cubic-bezier(.4,2,.6,1)",
                    minWidth: 120,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    transform: idx === focusedIdx ? "translate(1px, 1px)" : "translate(0px, 0px)",
                  }}
                  disabled={idx === focusedIdx}
                  title={r.title}
                >
                  <span style={{ fontWeight: 700 }}>{r.title}</span>
                </button>
              ))}
            </div>
            {/* Focused recipe details */}
            {recipes[focusedIdx] && (
            <div
              data-recipecard
              style={{
                background:
                  "linear-gradient(135deg, #fff8e7 60%, #f3e3c3 100%)",
                borderRadius: 18,
                boxShadow: "0 2px 12px rgba(180,140,90,0.07)",
                padding: "28px 22px 22px 22px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                transition: "box-shadow 0.2s, transform 0.2s",
                width: '100%',
                border: '4px solid #000',
                marginBottom: 24,
                overflow: 'hidden',
                boxSizing: 'border-box',
                position: 'relative',
                fontFamily: "'Quicksand', sans-serif",
              }}
            >
              <div style={{display: 'flex', width: '100%', alignItems: 'flex-start', gap: 30}}>
                <div style={{flex: 1, minWidth: 0}}>
                  <h2
                    style={{
                      fontSize: "1.965rem",
                      fontWeight: 700,
                      color: "#a67c52",
                      marginBottom: 22,
                      display: 'flex', alignItems: 'center', gap: 12,
                      wordBreak: 'break-word',
                      maxWidth: '100%',
                    }}
                  >
                    {recipes[focusedIdx].title}
                  </h2>
                  {/* Description text only, without image */}
                  {recipes[focusedIdx].description && (
                    <div
                      style={{
                        fontSize: "1.31rem",
                        color: "#6b4f27",
                        marginBottom: 10,
                        width: '100%',
                        wordBreak: 'break-word',
                      }}
                      dangerouslySetInnerHTML={{
                        __html: recipes[focusedIdx].description.replace(/<img[^>]+>/, '')
                      }}
                    />
                  )}
                </div>
                {/* Show image to the right, even larger, with text wrapping around */}
                {recipes[focusedIdx].description && recipes[focusedIdx].description.includes('<img') && (
                  <div style={{flexShrink: 0, marginLeft: 22, maxWidth: 316, minWidth: 173, float: 'right'}}>
                    <span style={{display:'block'}} dangerouslySetInnerHTML={{
                      __html: (recipes[focusedIdx].description.match(/<img[^>]+>/)?.[0] || '').replace('max-width:100%', 'max-width:100%; width: 287px; height: auto;')
                    }} />
                  </div>
                )}
              </div>
              {/* Time marker above servings */}
              <div
                style={{
                  fontSize: "1.31rem",
                  color: "#6b4f27",
                  marginBottom: 15,
                }}
              >
                <b>Time:</b> {recipes[focusedIdx].time || 'N/A'}
              </div>
              <div
                style={{
                  fontSize: "1.31rem",
                  color: "#6b4f27",
                  marginBottom: 15,
                }}
              >
                <b>Servings:</b> {recipes[focusedIdx].servings}
              </div>
              <div
                style={{
                  fontSize: "1.31rem",
                  color: "#6b4f27",
                  marginBottom: 15,
                }}
              >
                <b>Ingredients:</b>{" "}
                {renderNumberedList(recipes[focusedIdx].ingredients)}
              </div>
              <div
                style={{
                  fontSize: "1.31rem",
                  color: "#6b4f27",
                  marginBottom: 15,
                }}
              >
                <b>Tools:</b> {renderNumberedList(recipes[focusedIdx].tools)}
              </div>
              <div
                style={{
                  fontSize: "1.31rem",
                  color: "#6b4f27",
                  marginBottom: 15,
                }}
              >
                <b>Instructions:</b>{" "}
                {renderNumberedList(recipes[focusedIdx].instructions)}
              </div>
              {/* --- Action Buttons (Regenerate, Print) --- */}
              <button
                style={{
                  marginTop: 22,
                  alignSelf: 'flex-end',
                  padding: '13px 33px',
                  background: 'linear-gradient(90deg, #f3d6b6 0%, #c9a06c 100%)',
                  color: '#6b4f27',
                  fontSize: '1.25rem',
                  fontFamily: "'Quicksand', sans-serif",
                  fontWeight: 600,
                  border: '3px solid #000',
                  borderRadius: 12,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '3px 3px 0px #000',
                  transition: 'all 0.2s',
                  marginRight: 12,
                  printArea: true,
                  transform: loading ? "translate(2px, 2px)" : "translate(0px, 0px)",
                }}
                disabled={loading}
                className="no-print"
                onClick={async () => {
                  setLoading(true);
                  setError("");
                  // Regenerate only the focused recipe
                  const res = await fetch("/api/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ restrictions, prompt }),
                  });
                  const data = await res.json();
                  if (data.recipes && data.recipes[focusedIdx]) {
                    setRecipes(prev => prev.map((r, i) => i === focusedIdx ? data.recipes[focusedIdx] : r));
                  } else {
                    setError("Failed to regenerate recipe.");
                  }
                  setLoading(false);
                }}
              >
                {loading ? "Regenerating..." : "Regenerate This Recipe"}
              </button>
              <button
                style={{
                  marginTop: 22,
                  alignSelf: 'flex-end',
                  padding: '13px 33px',
                  background: 'linear-gradient(90deg, #c9a06c 0%, #f3d6b6 100%)',
                  color: '#6b4f27',
                  fontSize: '1.25rem',
                  fontFamily: "'Quicksand', sans-serif",
                  fontWeight: 600,
                  border: '3px solid #000',
                  borderRadius: 12,
                  cursor: 'pointer',
                  boxShadow: '3px 3px 0px #000',
                  transition: 'all 0.2s',
                  printArea: true
                }}
                className="no-print"
                onClick={() => {
                  // Print only the focused recipe overview, matching the web layout
                  // Use querySelectorAll on the current container, not the whole document
                  const allCards = document.querySelectorAll('[data-recipecard]');
                  // Find the visible card (should be only one rendered)
                  let recipeCard = null;
                  if (allCards.length === 1) {
                    recipeCard = allCards[0];
                  } else if (allCards.length > 1) {
                    // Fallback: pick the one that is not display:none
                    recipeCard = Array.from(allCards).find(card => card.offsetParent !== null);
                  }
                  if (!recipeCard) return;
                  const printWindow = window.open('', '', 'width=900,height=1100');
                  printWindow.document.write('<html><head><title>Recipe Print</title>');
                  Array.from(document.styleSheets).forEach(sheet => {
                    try {
                      if (sheet.href) {
                        printWindow.document.write(`<link rel="stylesheet" href="${sheet.href}">`);
                      } else if (sheet.ownerNode && sheet.ownerNode.tagName === 'STYLE') {
                        printWindow.document.write(`<style>${sheet.ownerNode.innerHTML}</style>`);
                      }
                    } catch (e) {}
                  });
                  printWindow.document.write('<style>@media print {.no-print { display: none !important; }}</style>');
                  printWindow.document.write('</head><body style="background:#f8f5f0;">');
                  printWindow.document.write('<div style="display:flex;justify-content:center;"><div>' + recipeCard.innerHTML + '</div></div>');
                  printWindow.document.write('</body></html>');
                  printWindow.document.close();
                  setTimeout(() => {
                    printWindow.focus();
                    printWindow.print();
                    printWindow.close();
                  }, 300);
                }}
              >
                Print This Recipe
              </button>
            </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export default App;