import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="p-10 text-center space-y-6">
      <h1 className="text-4xl font-bold">🏆 RBI Grade B AIR 1 Dashboard</h1>
      <div className="space-x-4 mt-6">
        <Link to="/notes" className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700">
          📚 View Notes
        </Link>
        <Link to="/upload" className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700">
          📤 Upload Notes
        </Link>
      </div>
    </div>
  );
}
