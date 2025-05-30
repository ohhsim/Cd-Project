import React, { useState } from "react";

function FileUpload({ setOptimizedCode }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/optimize", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      // 👉 Send the result to parent App.jsx
      setOptimizedCode(result.optimized_code);
    } catch (err) {
      alert("Error optimizing code.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
      >
        {loading ? "Optimizing..." : "Optimize Code"}
      </button>
    </div>
  );
}

export default FileUpload;
