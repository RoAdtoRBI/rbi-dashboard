// src/Notes.jsx
import { useEffect, useState } from "react";
import { db, auth } from "./firebase";
import { collection, query, getDocs } from "firebase/firestore";

export default function Notes() {
  const [noteList, setNoteList] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotes = async () => {
      const user = auth.currentUser;
      if (!user) {
        setError("User not logged in");
        setLoading(false);
        return;
      }

      try {
        const userId = user.uid;
        const appId = "default-rbi-app";
        const q = query(collection(db, `artifacts/${appId}/users/${userId}/notes`));
        const querySnapshot = await getDocs(q);

        const notes = [];
        querySnapshot.forEach((doc) => {
          notes.push({ id: doc.id, ...doc.data() });
        });
        setNoteList(notes);
      } catch (err) {
        console.error("Error loading notes:", err);
        setError("Failed to load notes");
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">📚 Your Uploaded Notes</h1>

      {loading && <p>Loading notes...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {noteList.map((note) => (
          <button
            key={note.id}
            onClick={() => setSelectedNote(note)}
            className="bg-white p-4 rounded shadow hover:bg-blue-50 transition text-left border"
          >
            <strong>{note.title}</strong>
            <p className="text-sm text-gray-500 truncate">{note.content?.slice(0, 50)}</p>
          </button>
        ))}
      </div>

      {selectedNote && (
        <div className="bg-white p-6 rounded shadow mt-6 border">
          <h2 className="text-xl font-semibold mb-4">{selectedNote.title}</h2>
          <pre className="whitespace-pre-wrap text-sm">
            {selectedNote.content || "(No inline content found)"}
          </pre>

          {selectedNote.uploadedFileUrl && (
            <a
              href={selectedNote.uploadedFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline mt-4 inline-block"
            >
              📄 View Uploaded File
            </a>
          )}
        </div>
      )}
    </div>
  );
}
