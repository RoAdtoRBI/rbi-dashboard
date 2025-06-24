import { useState } from "react";

export default function Planner() {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const [target, setTarget] = useState(5); // hours
  const [logged, setLogged] = useState(0);
  const [logInput, setLogInput] = useState("");

  const handleLog = () => {
    const hours = parseFloat(logInput);
    if (!isNaN(hours) && hours > 0) {
      setLogged((prev) => Math.min(prev + hours, target));
      setLogInput("");
    }
  };

  const percent = Math.min((logged / target) * 100, 100).toFixed(0);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-4">📅 Daily Study Planner</h1>

      <div className="bg-white shadow rounded p-4 space-y-4">
        <p className="text-lg font-medium">📆 Date: {today}</p>

        <div>
          🎯 Target Hours:
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="ml-2 p-1 border rounded w-16"
            min="1"
          />
        </div>

        <div>
          ⏱️ Log Study Hours:
          <input
            type="number"
            value={logInput}
            onChange={(e) => setLogInput(e.target.value)}
            className="ml-2 p-1 border rounded w-16"
            min="0"
          />
          <button
            onClick={handleLog}
            className="ml-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Log Hours
          </button>
        </div>

        <div className="mt-4">
          <p className="mb-1 font-semibold">📊 Progress: {logged}/{target} hours</p>
          <div className="w-full bg-gray-300 h-4 rounded">
            <div
              className="h-4 bg-blue-500 rounded"
              style={{ width: `${percent}%` }}
            ></div>
          </div>
          <p className="text-sm mt-1 text-gray-600">
            {percent >= 100 ? "✅ Goal Achieved!" : "Keep going! You can do it!"}
          </p>
        </div>
      </div>
    </div>
  );
}
