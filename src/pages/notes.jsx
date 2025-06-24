import { useEffect, useState } from "react";

export default function Notes() {
  const [noteList, setNoteList] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [noteContent, setNoteContent] = useState("");

  useEffect(() => {
    fetch("/notes/index.json")
      .then((res) => res.json())
      .then(setNoteList)
      .catch((err) => console.error("Failed to load index:", err));
  }, []);

  const openNote = (filename) => {
    fetch(`/notes/${filename}`)
      .then((res) => res.text())
      .then(setNoteContent);
    setSelectedNote(filename);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">📚 Chapterwise Notes</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {noteList.map((file) => (
          <button
            key={file}
            onClick={() => openNote(file)}
            className="bg-white p-4 rounded shadow hover:bg-blue-50 transition text-left border"
          >
            {file.replace(".txt", "")}
          </button>
        ))}
      </div>

      {selectedNote && (
        <div className="bg-white p-6 rounded shadow mt-6 border">
          <h2 className="text-xl font-semibold mb-4">{selectedNote.replace(".txt", "")}</h2>
          <pre className="whitespace-pre-wrap">{noteContent}</pre>
        </div>
      )}
    </div>
  );
}
