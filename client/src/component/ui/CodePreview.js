import React, { useState, useRef, useEffect } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import { useHighlightTheme } from "../../hooks/useHighlightTheme";

// Helper functions
const isExecutableLanguage = (language) => {
  const executable = ["python", "javascript", "js", "java", "cpp", "c", "go", "rust", "php", "ruby"];
  return executable.includes(language?.toLowerCase());
};

const hasWebPreview = (language) => {
  const webLangs = ["html", "xml", "css"];
  return webLangs.includes(language?.toLowerCase());
};

const shouldShowPreview = (language) => {
  return isExecutableLanguage(language) || hasWebPreview(language);
};

export const CodePreview = ({ code, language }) => {
  const [activeTab, setActiveTab] = useState("code");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef(null);
  const codeRef = useRef(null);

  const isExecutable = isExecutableLanguage(language);
  const isWebCode = hasWebPreview(language);
  const hasPreview = shouldShowPreview(language);

  useHighlightTheme();

  useEffect(() => {
    if (codeRef.current) {
      try {
        hljs.highlightElement(codeRef.current);
      } catch (err) {
       // console.warn("Highlight.js failed:", err);
         console.warn("");

      }
    }
  }, [code, language, activeTab]);

  const executeCode = async () => {
    setIsRunning(true);
    setError("");
    setOutput("");
    setActiveTab("preview");

    try {
      const response = await fetch("http://localhost:8099/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: language.toLowerCase(),
          code: code,
        }),
      });

      const result = await response.json();

      if (result.error) {
        setError(result.error);
      } else {
        setOutput(result.output || "Code executed successfully with no output");
      }
    } catch (err) {
      setError("⚠️ Failed to execute code. Make sure the server is running at localhost:8099");
    } finally {
      setIsRunning(false);
    }
  };

  const renderPreview = () => {
    if (isWebCode) {
      return (
        <iframe
          ref={iframeRef}
          srcDoc={code}
          title="Preview"
          className="w-full h-full border-0 bg-white"
          sandbox="allow-scripts allow-same-origin"
        />
      );
    } else if (output || error) {
      return (
        <div className="p-3 sm:p-4 font-mono text-xs sm:text-sm overflow-auto h-full bg-gray-900 text-gray-100">
          {error ? (
            <div className="text-red-400 flex items-start gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="break-words">{error}</span>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap break-words">{output}</pre>
          )}
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center h-full text-gray-500 bg-gray-50 dark:bg-gray-800 p-4">
          <div className="text-center">
            <svg
              className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-xs sm:text-sm">Click "Run Code" to see output</p>
          </div>
        </div>
      );
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- Static Code Block (non-executable) ---
  if (!hasPreview) {
    return (
      <div className="relative group my-3 max-w-full overflow-hidden border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-900 text-gray-100">
        <div className="absolute top-2 right-2 flex gap-1 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <div className="bg-gray-700 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-1 rounded">
            {language}
          </div>
          <button
            onClick={copyCode}
            className="p-1 sm:p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors touch-manipulation"
            title="Copy code"
          >
            {copied ? (
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>
        </div>
        {/* Responsive code container */}
        <div className="h-[200px] sm:h-[280px] md:h-[320px] overflow-auto">
          <pre className="p-3 sm:p-4 text-xs sm:text-sm overflow-x-auto w-full min-w-0">
            <code ref={codeRef} className={`language-${language || "plaintext"}`}>
              {code}
            </code>
          </pre>
        </div>
      </div>
    );
  }

  // --- Full Preview with Tabs ---
  return (
    <div className="my-3 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800 w-full max-w-full">
      {/* Tabs Header */}
      <div className="flex items-center justify-between border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 flex-wrap sm:flex-nowrap gap-2 sm:gap-0">
        <div className="flex flex-1 min-w-0">
          <button
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-[10px] sm:text-xs font-medium transition-colors touch-manipulation flex-1 sm:flex-initial justify-center ${
              activeTab === "code"
                ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span className="hidden xs:inline">Code</span>
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-[10px] sm:text-xs font-medium transition-colors touch-manipulation flex-1 sm:flex-initial justify-center ${
              activeTab === "preview"
                ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span className="hidden xs:inline">Preview</span>
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-0">
          <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate max-w-[60px] sm:max-w-none">
            {language}
          </span>
          <button
            onClick={copyCode}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors touch-manipulation"
            title="Copy code"
          >
            {copied ? (
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>

          {isExecutable && (
            <button
              onClick={executeCode}
              disabled={isRunning}
              className="flex items-center gap-1 px-2 py-1 rounded bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-[10px] sm:text-xs font-medium transition-colors touch-manipulation whitespace-nowrap"
            >
              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              {isRunning ? "..." : "Run"}
            </button>
          )}
        </div>
      </div>

      {/* Responsive Content Area */}
 <div className="h-[200px] sm:h-[280px] md:h-[320px] overflow-auto">
  {activeTab === "code" ? (
    <div className="h-full bg-gray-900 text-gray-100 rounded-b-lg">
      <pre className="p-2 sm:p-3 w-full max-w-full min-w-0 overflow-auto text-[11px] sm:text-xs leading-relaxed break-words whitespace-pre-wrap">
        <code
          ref={codeRef}
          className={`language-${language || "plaintext"}`}
        >
          {code}
        </code>
      </pre>
    </div>
  ) : (
    renderPreview()
  )}
</div>

    </div>
  );
};
