import { useState } from "react";

export default function AICoach() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    setLoading(true);
    setAnswer("");

    // Simulated AI logic (can be replaced with OpenAI call later)
    setTimeout(() => {
      setAnswer(`🤖 This is a simulated AI response to your question: "${question}"`);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">🤖 Ask AI Coach</h1>
      <div className="space-y-4">
        <textarea
          className="w-full border p-3 rounded resize-none"
          rows="4"
          placeholder="Ask your question here..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        ></textarea>

        <button
          onClick={handleAsk}
          disabled={!question || loading}
          className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
        >
          {loading ? "Thinking..." : "Ask AI"}
        </button>

        {answer && (
          <div className="mt-4 p-4 bg-gray-100 rounded shadow">
            <p className="font-medium text-gray-800">{answer}</p>
          </div>
        )}
      </div>
    </div>
  );
}
