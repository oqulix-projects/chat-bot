import React from "react";

const showroomFAQs = [
  { id: 1, question: "Where are the large home appliances, like washing machines and refrigerators?" },
  { id: 2, question: "Do you offer any payment options like EMI or have exchange offers?" },
  { id: 3, question: "Which floor has the mobile phones and laptops?" },
  { id: 4, question: "Where can I compare different types of televisions?" },
  { id: 5, question: "Where are the Apple products located?" },
  { id: 6, question: "I have an old phone. Do you accept offer exchange discounts?" },
  { id: 7, question: "I need a gaming laptop. What brands and options do you have?" },
  { id: 8, question: "I'm interested in a soundbar for my TV. Where should I look?" },
];

const FAQ = ({ handleAsk }) => {

  const handleQuestionClick = (questionText) => {
    handleAsk(questionText);
  };

  return (
    <div className="absolute top-28 right-6 w-180 h-50 bg-black/60 backdrop-blur-md rounded-2xl p-4 shadow-xl z-30" style={{marginTop:'10px'}}>

      <p className="text-sm text-gray-300 mb-3 font-semibold tracking-wide">
        Quick Questions
      </p>

      <div className="flex flex-col gap-2 max-h-34 overflow-y-auto pr-1">
        {showroomFAQs.map((faq) => (
          <button
            key={faq.id}
            onClick={() => handleQuestionClick(faq.question)}
            className="text-left text-sm bg-gray-800 hover:bg-orange-500 hover:text-white transition px-4 py-2 rounded-xl"
          >
            {faq.question}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
