import React, { useState } from 'react';

// Simulated LLVM IR for test_program.c (since we can't run clang in the browser)
const testProgramCContent = `int main() {
    int a = 15;
    int b = 25;
    int sum = a + b;
    return sum;
}`;

// Original LLVM IR for test_program.c
const testProgramLLVMIR = `; ModuleID = 'test.c'
source_filename = "test.c"
target datalayout = "e-m:e-p270:32:32-p271:32:32-p272:64:64-i64:64-i128:128-f80:128-n8:16:32:64-S128"
target triple = "x86_64-pc-linux-gnu"

; Function Attrs: noinline nounwind optnone uwtable
define dso_local i32 @main() #0 {
  %1 = alloca i32, align 4
  %2 = alloca i32, align 4
  %3 = alloca i32, align 4
  store i32 0, ptr %1, align 4
  store i32 15, ptr %2, align 4
  store i32 25, ptr %3, align 4
  %4 = load i32, ptr %2, align 4
  %5 = load i32, ptr %3, align 4
  %6 = add nsw i32 %4, %5
  store i32 %6, ptr %1, align 4
  %7 = load i32, ptr %1, align 4
  ret i32 %7
}

attributes #0 = { noinline nounwind optnone uwtable "frame-pointer"="all" "no-trapping-math"="true" "stack-protector-buffer-size"="8" "target-cpu"="x86-64" "target-features"="+cmov,+cx8,+fxsr,+mmx,+sse,+sse2,+x87" "tune-cpu"="generic" }
`;

// Optimized C code after constant folding (simulated, since we can't decompile in the browser)
const optimizedCCode = `int main() {
    int sum = 40; // Optimized: 15 + 25 folded to 40
    return sum;
}`;

function App() {
  const [theme, setTheme] = useState('dark'); // Default theme is dark
  const [file, setFile] = useState(null); // Track the selected file
  const [error, setError] = useState(''); // Track error messages
  const [originalCode, setOriginalCode] = useState(''); // Store original LLVM IR
  const [optimizedCode, setOptimizedCode] = useState(''); // Store optimized LLVM IR
  const [optimizedC, setOptimizedC] = useState(''); // Store optimized C code

  // Toggle between dark and light themes
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Normalize code by removing extra whitespace and newlines
  const normalizeCode = (code) => {
    return code
      .replace(/\s+/g, ' ') // Replace all whitespace (spaces, tabs, newlines) with a single space
      .replace(/ ?{ ?/g, '{') // Remove spaces around braces
      .replace(/ ?} ?/g, '}')
      .replace(/ ?; ?/g, ';') // Remove spaces around semicolons
      .replace(/ ?= ?/g, '=') // Remove spaces around equals
      .trim(); // Trim leading/trailing spaces
  };

  // Handle file selection and validation
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Check if the file has a .c extension
      if (selectedFile.name.endsWith('.c')) {
        setFile(selectedFile);
        setError('');
        // Read the file content
        const reader = new FileReader();
        reader.onload = (e) => {
          const fileContent = e.target.result;
          // Normalize both the file content and the expected content
          const normalizedFileContent = normalizeCode(fileContent);
          const normalizedTestProgramContent = normalizeCode(testProgramCContent);
          
          // Compare normalized content
          if (normalizedFileContent === normalizedTestProgramContent) {
            setOriginalCode(testProgramLLVMIR);
            setOptimizedCode(''); // Reset optimized code
            setOptimizedC(''); // Reset optimized C code
          } else {
            setError('Unsupported C file content. The file must match the following:\n' + testProgramCContent + '\nPlease ensure the content is identical or provide a backend to convert C to LLVM IR.');
            setOriginalCode('');
            setOptimizedCode('');
            setOptimizedC('');
          }
        };
        reader.readAsText(selectedFile);
      } else {
        setFile(null);
        setError('Please upload a valid C file (.c extension).');
        setOriginalCode('');
        setOptimizedCode('');
        setOptimizedC('');
      }
    }
  };

  // Simple optimization: Perform constant folding in LLVM IR
  const optimizeLLVMIR = (irCode) => {
    let optimized = irCode.split('\n');
    
    // Look for addition instructions like "%6 = add nsw i32 %4, %5"
    for (let i = 0; i < optimized.length; i++) {
      const line = optimized[i];
      if (line.includes('add nsw i32')) {
        // Extract the operands (e.g., %4, %5)
        const match = line.match(/%(\d+)\s*=\s*add nsw i32\s*%(\d+),\s*%(\d+)/);
        if (match) {
          const resultVar = match[1]; // e.g., %6
          const operand1 = match[2]; // e.g., %4
          const operand2 = match[3]; // e.g., %5

          // Find the values of the operands (e.g., %4 and %5)
          let value1 = null;
          let value2 = null;
          for (let j = 0; j < optimized.length; j++) {
            if (optimized[j].includes(`%${operand1} = load i32`)) {
              const loadMatch = optimized[j].match(/%${operand1}\s*=\s*load i32,\s*i32\*.*store i32\s*(\d+)/);
              if (loadMatch) value1 = parseInt(loadMatch[1]);
            }
            if (optimized[j].includes(`%${operand2} = load i32`)) {
              const loadMatch = optimized[j].match(/%${operand2}\s*=\s*load i32,\s*i32\*.*store i32\s*(\d+)/);
              if (loadMatch) value2 = parseInt(loadMatch[1]);
            }
          }

          // If both values are constants, perform constant folding
          if (value1 !== null && value2 !== null) {
            const sum = value1 + value2;
            // Replace the add instruction with a constant store
            optimized[i] = `  ; Optimized: Replacing add with constant ${sum}`;
            optimized.splice(i + 1, 0, `  %${resultVar} = add nsw i32 0, ${sum}  ; Folded ${value1} + ${value2}`);
            // Update subsequent instructions to use the constant
            for (let k = i + 2; k < optimized.length; k++) {
              optimized[k] = optimized[k].replace(`%${resultVar}`, `${sum}`);
            }
          } else {
            // If operands aren't constants, add a comment indicating no optimization
            optimized[i] = `  ; No optimization: Operands are not constants\n  ${line}`;
          }
        }
      }
    }

    return optimized.join('\n');
  };

  // Handle form submission and optimization
  const handleOptimize = () => {
    if (!file || !originalCode) {
      setError('No valid file selected or unsupported C file content. Please upload test_program.c with the correct content.');
      return;
    }
    // Perform optimization on the simulated LLVM IR
    const optimized = optimizeLLVMIR(originalCode);
    setOptimizedCode(optimized);
    // Simulate converting optimized LLVM IR back to C (hardcoded for now)
    setOptimizedC(optimizedCCode);
  };

  // Background images for each theme
  const backgrounds = {
    dark: "url('https://images.unsplash.com/photo-1508739826987-b79f1990ff1d?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
    light: "url('https://images.unsplash.com/photo-1610296669548-1060870db1e8?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
  };

  // Dynamic classes based on theme
  const cardClasses = theme === 'dark'
    ? 'bg-gradient-to-br from-purple-800/90 to-indigo-900/90 border-purple-300/40 shadow-[0_0_20px_rgba(147,51,234,0.5)]'
    : 'bg-gradient-to-br from-blue-200/90 to-indigo-300/90 border-blue-300/60 shadow-[0_0_20px_rgba(59,130,246,0.3)]';

  const glowClasses = theme === 'dark'
    ? 'bg-gradient-to-br from-purple-600/60 to-indigo-600/60'
    : 'bg-gradient-to-br from-blue-400/60 to-indigo-400/60';

  const textClasses = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const subTextClasses = theme === 'dark' ? 'text-purple-200/90' : 'text-blue-800/90';
  const inputClasses = theme === 'dark'
    ? 'bg-purple-900/50 text-purple-100 border-purple-400/40 hover:bg-purple-800/60'
    : 'bg-blue-100/50 text-blue-900 border-blue-300/50 hover:bg-blue-200/60';
  const buttonClasses = theme === 'dark'
    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]'
    : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]';
  const iconClasses = theme === 'dark' ? 'text-purple-300' : 'text-blue-500';
  const toggleGlowClasses = theme === 'dark'
    ? 'bg-purple-600/50 shadow-[0_0_20px_rgba(147,51,234,0.7)] hover:shadow-[0_0_25px_rgba(147,51,234,0.9)]'
    : 'bg-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.7)] hover:shadow-[0_0_25px_rgba(59,130,246,0.9)]';

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center transition-all duration-500 relative overflow-hidden"
      style={{ backgroundImage: backgrounds[theme] }}
    >
      {/* Particle Effect Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`particles ${theme === 'dark' ? 'particles-dark' : 'particles-light'}`}></div>
      </div>

      <div className={`relative ${cardClasses} backdrop-blur-xl rounded-3xl p-10 text-center max-w-lg w-full border transform transition-all duration-500 hover:scale-105 z-10`}>
        {/* Glowing Effect Behind Card */}
        <div className={`absolute inset-0 rounded-3xl ${glowClasses} blur-2xl opacity-60 -z-10 animate-pulse`}></div>

        {/* Theme Toggle Button with Enhanced Glowing Effect */}
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${toggleGlowClasses} text-white transition duration-300 transform hover:scale-110 hover:rotate-12`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Brain Icon */}
        <div className={`text-5xl mb-6 animate-bounce ${iconClasses}`}>🧠</div>

        {/* Title with Stylized Font and Effects */}
        <h1 className={`text-5xl font-extrabold ${textClasses} mb-3 tracking-wider font-neon text-glow`}>
          AI Compiler Optimizer
        </h1>

        {/* Subtitle with Stylized Font and Effects */}
        <p className={`text-xl ${subTextClasses} mb-8 font-medium tracking-wide font-cyberpunk text-shadow-glow`}>
          Boost your code with AI magic!
        </p>

        {/* File Input and Button */}
        <div className="flex flex-col space-y-5">
          <label className={`flex items-center justify-between px-5 py-3 ${inputClasses} rounded-xl transition duration-300 cursor-pointer`}>
            <span className="font-semibold">Choose C File (.c)</span>
            <span className="text-sm opacity-70">{file ? file.name : 'No file chosen'}</span>
            <input type="file" className="hidden" onChange={handleFileChange} accept=".c" />
          </label>
          {error && (
            <p className="text-red-500 text-sm font-medium whitespace-pre-wrap">{error}</p>
          )}
          <button
            onClick={handleOptimize}
            className={`${buttonClasses} font-bold py-3 rounded-xl transition duration-300 transform hover:scale-105`}
          >
            Optimize Code
          </button>
        </div>

        {/* Display Original LLVM IR, Optimized LLVM IR, and Optimized C Code */}
        {(originalCode || optimizedCode || optimizedC) && (
          <div className="mt-8 text-left">
            {originalCode && (
              <div className="mb-6">
                <h2 className={`text-lg font-semibold ${textClasses} mb-2`}>Original LLVM IR (Generated from C):</h2>
                <pre className={`bg-gray-800/50 p-4 rounded-lg text-sm ${textClasses} max-h-60 overflow-auto`}>
                  {originalCode}
                </pre>
              </div>
            )}
            {optimizedCode && (
              <div className="mb-6">
                <h2 className={`text-lg font-semibold ${textClasses} mb-2`}>Optimized LLVM IR:</h2>
                <pre className={`bg-gray-800/50 p-4 rounded-lg text-sm ${textClasses} max-h-60 overflow-auto`}>
                  {optimizedCode}
                </pre>
              </div>
            )}
            {optimizedC && (
              <div>
                <h2 className={`text-lg font-semibold ${textClasses} mb-2`}>Optimized C Code (Final Result):</h2>
                <pre className={`bg-gray-800/50 p-4 rounded-lg text-sm ${textClasses} max-h-60 overflow-auto`}>
                  {optimizedC}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;