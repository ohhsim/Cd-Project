// src/components/Header.jsx
export default function Header() {
  return (
    <header className="text-center py-6">
      <h1 className="text-4xl font-bold text-gray-800 flex justify-center items-center gap-3">
        <img src="https://img.icons8.com/color/48/brain.png" alt="AI Logo" />
        AI Compiler Optimizer
      </h1>
      <p className="text-sm text-gray-500">Boost your LLVM IR with AI magic!</p>
    </header>
  );
}
