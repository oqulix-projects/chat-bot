import React, { useEffect, useState, useRef } from "react";

const PRODUCTS = [
  {
    id: "lap-001",
    name: "Apple MacBook Air M2",
    specs: '13.6" Liquid Retina · M2 · 16GB · 256GB SSD',
    price: "₹72,990",
    tag: "Best Seller",
    imageUrl: "https://techcrunch.com/wp-content/uploads/2022/07/CMC_1580.jpg",
  },
  {
    id: "lap-003",
    name: "Dell XPS 13 9340",
    specs: '13.4" FHD+ · Intel Core Ultra 7 · 16GB · 512GB SSD',
    price: "₹1,68,990",
    tag: "Ultra Thin",
    imageUrl: "https://laptopmedia.com/wp-content/uploads/2024/04/5-15.jpg",
  },
  {
    id: "lap-005",
    name: "Lenovo Legion 5",
    specs: '15.3" 120Hz · Ryzen 7 · RTX 5050 · 16GB RAM',
    price: "₹1,88,990",
    tag: "Gaming Beast",
    imageUrl:
      "https://i.pcmag.com/imagery/reviews/032Ghc5tCjiCya7cxiW3B5O-11.fit_scale.size_400x225.v1623952890.jpg",
  },
  {
    id: "lap-006",
    name: "ASUS ROG Zephyrus G14",
    specs: '14" 3K OLED · Ryzen 9 · RTX 4060 · 16GB RAM',
    price: "₹1,76,990",
    tag: "OLED Display",
    imageUrl:
      "https://www.cnet.com/a/img/resize/33edf0812bed3890a8ef1d9e69947c6ba2b8be70/hub/2024/02/05/e716f8f8-a7a4-418c-9b14-0b210d9dfc72/asus-rog-zephyrus-g14-2024-5409.jpg?auto=webp&fit=crop&height=900&width=1200",
  },
  {
    id: "lap-009",
    name: "Lenovo LOQ AI",
    specs: '14" AI Performance · Core Ultra 5 · 16GB · 512GB SSD',
    price: "₹79,990",
    tag: "AI Powered",
    imageUrl:
      "https://p3-ofp.static.pub//fes/cms/2023/06/19/4a29tjbf02npxpyll9ftj0k6dnw6so241163.jpg",
  },
];

const THINKING_PHRASES = [
  "Searching our showroom…",
  "Finding the best for you…",
  "Checking stock…",
  "Personalising your answer…",
  "Almost there…",
];

export default function ThinkingLoader({ visible }) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [fadePhrase, setFadePhrase] = useState(true);
  const [dots, setDots] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const stripRef = useRef(null);
  const animRef = useRef(null);
  const posRef = useRef(0);

  // Cycle thinking phrases
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => {
      setFadePhrase(false);
      setTimeout(() => {
        setPhraseIndex((p) => (p + 1) % THINKING_PHRASES.length);
        setFadePhrase(true);
      }, 300);
    }, 2200);
    return () => clearInterval(id);
  }, [visible]);

  // Animate dots
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 450);
    return () => clearInterval(id);
  }, [visible]);

  // RAF marquee
  useEffect(() => {
    if (!visible) return;
    const strip = stripRef.current;
    if (!strip) return;
    const speed = 0.7;
    const tick = () => {
      posRef.current -= speed;
      const half = strip.scrollWidth / 2;
      if (Math.abs(posRef.current) >= half) posRef.current = 0;
      strip.style.transform = `translateX(${posRef.current}px)`;
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [visible]);

  // Spotlight card
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % PRODUCTS.length);
    }, 1800);
    return () => clearInterval(id);
  }, [visible]);

  if (!visible) return null;

  const allCards = [...PRODUCTS, ...PRODUCTS];

  return (
    <>
      {/* ── Thinking pill — top center, floats above bot head ── */}
      <div
        style={{
          position: "fixed",
          top: 90,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 200,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          pointerEvents: "none",
        }}
      >
        {/* Pill badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(9,9,11,0.72)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(249,115,22,0.4)",
            borderRadius: 999,
            padding: "8px 20px 8px 14px",
            boxShadow: "0 0 30px rgba(249,115,22,0.18), 0 4px 24px rgba(0,0,0,0.5)",
          }}
        >
          {/* Spinning arc */}
          <div style={{ position: "relative", width: 22, height: 22, flexShrink: 0 }}>
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              border: "2px solid rgba(249,115,22,0.15)",
            }} />
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              border: "2px solid transparent",
              borderTopColor: "#f97316",
              animation: "spin 0.85s linear infinite",
            }} />
          </div>

          {/* Phrase */}
          <span
            style={{
              fontFamily: "'Rajdhani', 'Trebuchet MS', sans-serif",
              fontSize: 15, fontWeight: 700, letterSpacing: 1.5,
              textTransform: "uppercase",
              color: "#f97316",
              opacity: fadePhrase ? 1 : 0,
              transition: "opacity 0.28s ease",
              whiteSpace: "nowrap",
            }}
          >
            {THINKING_PHRASES[phraseIndex]}{dots}
          </span>
        </div>

        {/* Slim shimmer bar under pill */}
        <div style={{
          width: 180, height: 2, borderRadius: 99,
          background: "rgba(255,255,255,0.06)", overflow: "hidden",
        }}>
          <div style={{
            height: "100%", borderRadius: 99,
            background: "linear-gradient(90deg, transparent, #f97316, #ea580c, transparent)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.3s linear infinite",
          }} />
        </div>
      </div>

      {/* ── Product marquee — anchored to bottom above the input bar ── */}
      <div
        style={{
          position: "fixed",
          bottom: 160,          // sits just above your input panel
          left: 0,
          right: 0,
          zIndex: 200,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {/* Section label */}
        <div style={{
          textAlign: "center",
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 10, letterSpacing: 4,
          textTransform: "uppercase",
          color: "rgba(249,115,22,0.45)",
          marginBottom: 10,
        }}>
          While you wait — explore our picks
        </div>

        {/* Fade masks */}
        <div style={{
          position: "absolute", left: 0, top: 22, bottom: 0, width: 100, zIndex: 2,
          background: "linear-gradient(90deg, rgba(0,0,0,0.6), transparent)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", right: 0, top: 22, bottom: 0, width: 100, zIndex: 2,
          background: "linear-gradient(-90deg, rgba(0,0,0,0.6), transparent)",
          pointerEvents: "none",
        }} />

        {/* Scrolling strip */}
        <div
          ref={stripRef}
          style={{ display: "flex", gap: 16, padding: "4px 24px", width: "max-content" }}
        >
          {allCards.map((product, idx) => {
            const realIdx = idx % PRODUCTS.length;
            const isActive = realIdx === activeIndex;

            return (
              <div
                key={`${product.id}-${idx}`}
                style={{
                  width: 200,
                  flexShrink: 0,
                  borderRadius: 14,
                  overflow: "hidden",
                  background: isActive
                    ? "rgba(249,115,22,0.14)"
                    : "rgba(9,9,11,0.55)",
                  backdropFilter: "blur(12px)",
                  border: isActive
                    ? "1px solid rgba(249,115,22,0.5)"
                    : "1px solid rgba(255,255,255,0.07)",
                  boxShadow: isActive
                    ? "0 0 22px rgba(249,115,22,0.22)"
                    : "0 2px 12px rgba(0,0,0,0.35)",
                  transform: isActive ? "translateY(-5px) scale(1.03)" : "translateY(0) scale(1)",
                  transition: "all 0.5s cubic-bezier(0.34,1.56,0.64,1)",
                }}
              >
                {/* Image */}
                <div style={{ height: 110, overflow: "hidden", position: "relative" }}>
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    style={{
                      width: "100%", height: "100%", objectFit: "cover",
                      filter: isActive
                        ? "brightness(1.05) saturate(1.1)"
                        : "brightness(0.6) saturate(0.5)",
                      transition: "filter 0.5s ease",
                    }}
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                  {/* Tag */}
                  <div style={{
                    position: "absolute", top: 8, left: 8,
                    fontSize: 8, fontWeight: 800, letterSpacing: 1.5,
                    textTransform: "uppercase", color: "#fff",
                    padding: "2px 8px", borderRadius: 99,
                    fontFamily: "'Rajdhani', sans-serif",
                    background: isActive
                      ? "linear-gradient(90deg,#f97316,#ea580c)"
                      : "rgba(0,0,0,0.5)",
                    transition: "background 0.5s ease",
                  }}>
                    {product.tag}
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: "10px 12px 12px" }}>
                  <div style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: 12, fontWeight: 700, color: "#f1f5f9",
                    lineHeight: 1.3, marginBottom: 3,
                  }}>
                    {product.name}
                  </div>
                  <div style={{
                    fontSize: 9, color: "rgba(255,255,255,0.38)",
                    fontFamily: "'Rajdhani', sans-serif", lineHeight: 1.5, marginBottom: 7,
                  }}>
                    {product.specs}
                  </div>
                  <div style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: 15, fontWeight: 800,
                    color: isActive ? "#f97316" : "rgba(249,115,22,0.5)",
                    transition: "color 0.5s ease",
                  }}>
                    {product.price}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </>
  );
}