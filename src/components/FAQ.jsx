import React from 'react';
import './FAQ.css'

// Data structure for the FAQs
const showroomFAQs = [
  {
    id: 1,
    question: "Where are the large home appliances, like washing machines and refrigerators?"
    },
  {
    id: 2,
    question: "Do you offer any payment options like EMI or have exchange offers?"
  },
  {
    id: 3,
    question: "Which floor has the mobile phones and laptops?"
  },
  {
    id: 4,
    question: "Where can I compare different types of televisions?"
  },
  {
    id: 5,
    question: "Where are the Apple products located?"
  },
  {
    id: 6,
    question: "I have an old phone. Do you accept offer exchange discounts?"
  },
  {
    id: 7,
    question: "I need a gaming laptop. What brands and options do you have?"
  },
  {
    id: 8,
    question: "I'm interested in a soundbar for my TV. Where should I look?"
  
  },
];

const FAQ = ({handleAsk}) => {
  // In a real application, you would manage the 'active' state here to show/hide the answer.
  const handleQuestionClick = (questionText) => {
    console.log(`Question clicked: ${questionText}`);
    handleAsk(questionText)
  };

  return (
    <div className="faq-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '2px' }}>
      
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Frequently asked questions
      </p>

      <div className="faq-list">
        {showroomFAQs.map((faq) => (
          <button
            key={faq.id}
            className="faq-button"
            onClick={() => handleQuestionClick(faq.question)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '12px 15px',
              margin: '8px 0',
              backgroundColor: '#242424ff',
              border: '.5px solid #383636ff',
              borderRadius: '25px',
              cursor: 'pointer',
              fontWeight:'200',
              color:'#ddddddff',
              letterSpacing:'1px',
              // Simple hover style for interactivity
            }}
          >
            {/* Using a simple counter for display */}
            
            {faq.question}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FAQ;