// src/components/SuggestionCard.jsx
export default function SuggestionCard({ text }) {
  return (
    <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg shadow-md max-w-3xl mx-auto my-4">
      <h3 className="text-lg font-semibold mb-2">AI Suggestion</h3>
      <p>{text}</p>
    </div>
  );
}
