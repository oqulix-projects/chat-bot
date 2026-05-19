import React, { useState } from "react";
import { WashingMachine, CreditCard, Smartphone, Tv, Apple, RefreshCw, Gamepad2, Volume2, MessageCircleQuestion, ChevronDown, ChevronUp } from "lucide-react";

const showroomFAQs = [
  { id: 1, question: "Where are the large home appliances, like washing machines and refrigerators?", Icon: WashingMachine },
  { id: 2, question: "I need a gaming laptop. What brands and options do you have?", Icon: CreditCard },
  { id: 3, question: "Which floor has the accessories for mobile phones and laptops?", Icon: Smartphone },
  { id: 4, question: "Where can I compare different types of televisions?", Icon: Tv },
  { id: 5, question: "Where are the Apple products located?", Icon: Apple },
  { id: 6, question: "I have an old phone. Do you accept offer exchange discounts?", Icon: RefreshCw },
  { id: 7, question: "Do you offer any payment options like EMI or have exchange offers?", Icon: Gamepad2 },
  { id: 8, question: "I'm interested in a soundbar for my TV. Where should I look?", Icon: Volume2 },
];

const FAQ = ({ handleAsk, setShowShowcase, loading }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleQuestionClick = (questionText) => {
    handleAsk(questionText);
    questionText === "I need a gaming laptop. What brands and options do you have?"
      ? setShowShowcase(true)
      : setShowShowcase(false);
  };

  const leftFAQs = showroomFAQs.slice(0, 4);
  const rightFAQs = showroomFAQs.slice(4, 8);

  return (
    <div
      style={{
        position: "absolute",
        top: "70px",
        left: "12px",
        right: "12px",
        width: "calc(100% - 24px)",
        zIndex: 30,
      }}
    >
      {/* Header with toggle button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: isOpen ? "12px" : "0px",
          paddingLeft: "2px",
          cursor: "pointer",
        }}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div
          style={{
            width: "3px",
            height: "20px",
            background: "linear-gradient(180deg, #f97316, #ea580c)",
            borderRadius: "2px",
            flexShrink: 0,
          }}
        />
        <p
          style={{
            color: "#d1d5db",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "2px",
            textTransform: "uppercase",
            margin: 0,
            userSelect: "none",
          }}
        >
          Quick Questions
        </p>
        <div
          style={{
            flex: 1,
            height: "1px",
            background:
              "linear-gradient(90deg, rgba(249,115,22,0.4), transparent)",
          }}
        />

        {/* Toggle button */}
        <button
          className="faq-toggle-btn"
          title={isOpen ? "Hide questions" : "Show questions"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            background: isOpen
              ? "rgba(249,115,22,0.15)"
              : "rgba(249,115,22,0.25)",
            border: "1px solid rgba(249,115,22,0.35)",
            borderRadius: "8px",
            padding: "4px 10px",
            cursor: "pointer",
            color: "#f97316",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "1px",
            textTransform: "uppercase",
            flexShrink: 0,
            transition: "all 0.2s ease",
          }}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
        >
          <MessageCircleQuestion size={13} strokeWidth={2.5} />
          {isOpen ? (
            <>
              Hide
              <ChevronUp size={12} strokeWidth={2.5} />
            </>
          ) : (
            <>
              Show
              <ChevronDown size={12} strokeWidth={2.5} />
            </>
          )}
        </button>
      </div>

      {/* Collapsible panel */}
      <div
        style={{
          overflow: "hidden",
          maxHeight: isOpen ? "400px" : "0px",
          opacity: isOpen ? 1 : 0,
          transition: "max-height 0.35s ease, opacity 0.25s ease",
        }}
      >
        {/* Scrollable single-column list */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            background: "rgba(15, 23, 42, 0.95)",
            backdropFilter: "blur(24px)",
            borderRadius: "16px",
            padding: "12px",
            border: "1px solid rgba(249,115,22,0.2)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            maxHeight: "260px",
            overflowY: "auto",
          }}
          className="no-scrollbar"
        >
          {showroomFAQs.map((faq) => (
            <FAQButton
              key={faq.id}
              faq={faq}
              loading={loading}
              onClick={handleQuestionClick}
            />
          ))}
        </div>
      </div>

      <style>{`
        .faq-toggle-btn:hover {
          background: rgba(249,115,22,0.3) !important;
          border-color: rgba(249,115,22,0.6) !important;
          box-shadow: 0 0 12px rgba(249,115,22,0.2);
        }

        .faq-btn {
          transition: all 0.2s ease;
        }

        .faq-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(249,115,22,0.85), rgba(234,88,12,0.9)) !important;
          border-color: rgba(249,115,22,0.8) !important;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(249,115,22,0.3), 0 0 0 1px rgba(249,115,22,0.4) !important;
        }

        .faq-btn:hover:not(:disabled) .faq-icon {
          background: rgba(255,255,255,0.2) !important;
        }

        .faq-btn:hover:not(:disabled) .faq-text {
          color: #fff !important;
        }

        .faq-btn:active:not(:disabled) {
          transform: translateY(0px) !important;
        }

        .faq-btn:disabled {
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

const FAQButton = ({ faq, loading, onClick }) => {
  const { Icon } = faq;
  return (
    <button
      className="faq-btn"
      disabled={loading}
      onClick={() => onClick(faq.question)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        textAlign: "left",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "10px",
        padding: "10px 12px",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.3 : 1,
        width: "100%",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }}
    >
      <span
        className="faq-icon"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: "28px",
          height: "28px",
          background: "rgba(249,115,22,0.15)",
          borderRadius: "7px",
          transition: "background 0.2s ease",
          color: "#f97316",
        }}
      >
        <Icon size={15} strokeWidth={2} />
      </span>
      <span
        className="faq-text"
        style={{
          color: "#cbd5e1",
          fontSize: "15px",
          fontWeight: 500,
          lineHeight: "1.4",
          letterSpacing: "0.2px",
          transition: "color 0.2s ease",
        }}
      >
        {faq.question}
      </span>
    </button>
  );
};

export default FAQ;