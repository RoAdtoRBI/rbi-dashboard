import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between">
      <h1 className="font-bold">RBI Dashboard</h1>
      <div className="space-x-4">
        <Link to="/" className="hover:underline">Home</Link>
        <Link to="/notes" className="hover:underline">Notes</Link>
        <Link to="/upload" className="hover:underline">Upload</Link>
      </div>
    </nav>
  );
}
