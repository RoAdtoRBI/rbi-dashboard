// src/pages/MockTest.jsx
import { useState } from "react";

const mockChapters = [
  "Finance - Chapter 1_ Indian Financial System",
  "Finance - Chapter 2_ Time Value of Money",
  "Management - Chapter 1_ Motivation Part 1",
  "ESI - Chapter 1_ Indian Economy Overview"
];

const generateQuestions = (chapter) =>
  Array.from({ length: 5 }, (_, i) => ({
    question: `${chapter} - Q${i + 1}: What is the correct answer?`,
    options: [
      `Option A`,
      `Option B`,
      `Option C`,
      `Option D`
    ],
    correct: 1,
    explanation: `Explanation for Q${i + 1}: Option B is correct.`
  }));

export default function MockTest() {
  const [selectedChapter, setSelectedChapter] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const startTest = () => {
    const qns = generateQuestions(selectedChapter);
    setQuestions(qns);
    setAnswers({});
    setSubmitted(false);
  };

  const handleAnswer = (index, value) => {
    setAnswers((prev) => ({ ...prev, [index]: parseInt(value) }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const score = Object.entries(answers).reduce((sum, [index, selected]) => {
    return questions[index]?.correct === selected ? sum + 1 : sum;
  }, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">📝 Chapter-wise Mock Test</h1>

      <div className="mb-4 text-center">
        <select
          value={selectedChapter}
          onChange={(e) => setSelectedChapter(e.target.value)}
          className="border p-2 rounded w-full sm:w-96"
        >
          <option value="">-- Select Chapter --</option>
          {mockChapters.map((chapter, i) => (
            <option key={i} value={chapter}>
              {chapter.replace(".txt", "")}
            </option>
          ))}
        </select>
        <button
          disabled={!selectedChapter}
          onClick={startTest}
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Start Test
        </button>
      </div>

      {questions.length > 0 && (
        <>
          {questions.map((q, idx) => (
            <div key={idx} className="mb-6 border rounded p-4 shadow bg-white">
              <p className="font-medium mb-2">{idx + 1}. {q.question}</p>
              {q.options.map((opt, i) => (
                <label key={i} className="block mb-1">
                  <input
                    type="radio"
                    name={`q${idx}`}
                    value={i}
                    checked={answers[idx] === i}
                    onChange={(e) => handleAnswer(idx, e.target.value)}
                    disabled={submitted}
                    className="mr-2"
                  />
                  {opt}
                </label>
              ))}
              {submitted && (
                <div className="mt-2 text-sm">
                  <p className={answers[idx] === q.correct ? "text-green-600" : "text-red-600"}>
                    {answers[idx] === q.correct
                      ? "✅ Correct!"
                      : `❌ Incorrect. Correct Answer: ${q.options[q.correct]}`}
                  </p>
                  <p className="text-gray-700">💡 {q.explanation}</p>
                </div>
              )}
            </div>
          ))}

          {!submitted ? (
            <div className="text-center">
              <button
                onClick={handleSubmit}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Submit Test
              </button>
            </div>
          ) : (
            <div className="text-center mt-6 text-lg font-semibold">
              🎯 You scored {score} out of {questions.length}
            </div>
          )}
        </>
      )}
    </div>
  );
}
