// src/components/CodeViewer.jsx
export default function CodeViewer({ title, code }) {
  return (
    <div className="max-w-4xl mx-auto my-6">
      <h3 className="text-xl font-semibold text-gray-700 mb-2">{title}</h3>
      <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto whitespace-pre-wrap">
        {code}
      </pre>
    </div>
  );
}
