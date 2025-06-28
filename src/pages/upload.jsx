// src/Upload.jsx
import { useState } from "react";
import { db, auth } from "./firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, getStorage } from "firebase/storage";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file && !content.trim()) {
      alert("Upload a file or enter content");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("User not logged in");
      return;
    }

    try {
      const userId = user.uid;
      const appId = "default-rbi-app";
      const noteRef = doc(collection(db, `artifacts/${appId}/users/${userId}/notes`));

      let fileUrl = null;
      let fileName = "";
      const storage = getStorage();

      if (file) {
        fileName = file.name;
        const storageRef = ref(storage, `notes/${noteRef.id}/${file.name}`);
        await uploadBytes(storageRef, file);
        fileUrl = await getDownloadURL(storageRef);
      }

      await setDoc(noteRef, {
        title: title || file?.name || "Untitled Note",
        content: content || "",
        uploadedFile: fileName,
        uploadedFileUrl: fileUrl,
        createdAt: new Date().toISOString()
      });

      setFile(null);
      setTitle("");
      setContent("");
      setUploadStatus("✅ Note uploaded successfully!");
    } catch (err) {
      console.error("Upload error:", err);
      setUploadStatus("❌ Upload failed: " + err.message);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📤 Upload Notes</h1>
      <form onSubmit={handleUpload} className="space-y-4">
        <input
          type="text"
          placeholder="Enter note title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="block w-full border p-2 rounded"
        />

        <textarea
          placeholder="Type or paste content here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="block w-full border p-2 rounded min-h-[120px]"
        ></textarea>

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="block w-full border p-2 rounded"
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Upload Note
        </button>

        {uploadStatus && <p className="mt-4">{uploadStatus}</p>}
      </form>
    </div>
  );
}
