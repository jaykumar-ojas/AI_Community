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

const isReactCode = (language) => {
  const reactLangs = ["react", "jsx", "tsx"];
  return reactLangs.includes(language?.toLowerCase());
};

const isThreeJsCode = (language, code) => {
  const threeJsLangs = ["threejs", "three", "three.js"];
  if (threeJsLangs.includes(language?.toLowerCase())) return true;
  // Check if code imports THREE or mentions THREE
  return code?.includes("import * as THREE") || 
         code?.includes("from 'three'") ||
         code?.includes("new THREE.") ||
         code?.includes("THREE.");
};

const isMermaidCode = (language) => {
  return language?.toLowerCase() === "mermaid";
};

const shouldShowPreview = (language, code) => {
  return isExecutableLanguage(language) || 
         hasWebPreview(language) || 
         isReactCode(language) ||
         isThreeJsCode(language, code) ||
         isMermaidCode(language);
};

export const CodePreview = ({ code, language }) => {
  const [activeTab, setActiveTab] = useState("code");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [renderError, setRenderError] = useState("");
  
  const iframeRef = useRef(null);
  const codeRef = useRef(null);
  const mermaidRef = useRef(null);

  const isExecutable = isExecutableLanguage(language);
  const isWebCode = hasWebPreview(language);
  const isReact = isReactCode(language);
  const isThreeJs = isThreeJsCode(language, code);
  const isMermaid = isMermaidCode(language);
  const hasPreview = shouldShowPreview(language, code);

  useHighlightTheme();

  useEffect(() => {
    if (codeRef.current && activeTab === "code") {
      try {
        hljs.highlightElement(codeRef.current);
      } catch (err) {
        console.warn("");
      }
    }
  }, [code, language, activeTab]);

  // Render Mermaid diagrams
useEffect(() => {
  if (isMermaid && activeTab === "preview" && mermaidRef.current) {
    const renderMermaid = async () => {
      try {
        // ✅ Load latest Mermaid if missing
        if (!window.mermaid) {
          const script = document.createElement("script");
          script.src = "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";
          script.async = true;
          document.head.appendChild(script);
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
          });
        }

        const mermaid = window.mermaid;

        // ✅ Initialize (safe even if called multiple times)
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
        });

        // ✅ Clean & sanitize code
        const cleanCode = code
          .replace(/^```(mermaid)?/gm, "")
          .replace(/```$/gm, "")
          .trim()
          // Replace raw double quotes with HTML entities
          .replace(/"/g, "&quot;");

        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

        // ✅ Render
        const { svg } = await mermaid.render(id, cleanCode);
        mermaidRef.current.innerHTML = svg;
        setRenderError("");
      } catch (err) {
        console.error("Mermaid render error:", err);
        setRenderError(
          `Mermaid render error: ${err.message || "Failed to render diagram"}`
        );
      }
    };

    renderMermaid();
  }
}, [isMermaid, code, activeTab]);



  const executeCode = async () => {
    setIsRunning(true);
    setError("");
    setOutput("");
    setActiveTab("preview");

    try {
      const response = await fetch("https://api.pixxelmind.com/run", {
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

  const generateReactPreviewHTML = (reactCode) => {
    // Transform the code to work in an iframe
    let transformedCode = reactCode;
    
    // Remove all import statements since we're loading everything via CDN
    transformedCode = transformedCode.replace(/import\s+.*?from\s+['"]react['"];?\s*/g, '');
    transformedCode = transformedCode.replace(/import\s+.*?from\s+['"]react-dom['"];?\s*/g, '');
    transformedCode = transformedCode.replace(/import\s+React,?\s*\{[^}]*\}\s*from\s+['"]react['"];?\s*/g, '');
    transformedCode = transformedCode.replace(/import\s+\{[^}]*\}\s*from\s+['"]react['"];?\s*/g, '');
    
    // Handle both export default and named exports
    transformedCode = transformedCode.replace(/export default function (\w+)/g, 'function $1');
    transformedCode = transformedCode.replace(/export default /g, '');
    transformedCode = transformedCode.replace(/export (function|const|class) /g, '$1 ');
    
    // Extract component name (first function or const component)
    const functionMatch = transformedCode.match(/function\s+(\w+)/);
    const constMatch = transformedCode.match(/const\s+(\w+)\s*=/);
    const componentName = functionMatch?.[1] || constMatch?.[1] || 'App';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 0; }
    #root { width: 100%; height: 100vh; }
    .error-display {
      padding: 20px;
      background: #fee;
      color: #c00;
      font-family: monospace;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    try {
      const { useState, useEffect, useRef, useCallback, useMemo, useReducer, useContext, createContext } = React;
      
      ${transformedCode}
      
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<${componentName} />);
    } catch (error) {
      document.getElementById('root').innerHTML = '<div class="error-display"><strong>React Render Error:</strong><br/>' + error.message + '<br/><br/>' + error.stack + '</div>';
      console.error('React Error:', error);
    }
  </script>
  <script>
    window.onerror = function(msg, url, lineNo, columnNo, error) {
      document.getElementById('root').innerHTML = '<div class="error-display"><strong>JavaScript Error:</strong><br/>' + msg + '<br/>Line: ' + lineNo + '</div>';
      return false;
    };
  </script>
</body>
</html>`;
  };

  const generateThreeJsPreviewHTML = (threeCode) => {
    // Check if it's a complete HTML document or just JavaScript code
    const isCompleteHTML = threeCode.trim().toLowerCase().startsWith('<!doctype') || 
                          threeCode.trim().toLowerCase().startsWith('<html');
    
    if (isCompleteHTML) {
      // Return the HTML as-is, it's already a complete document
      return threeCode;
    }
    
    // It's just JavaScript code, so wrap it
    // Transform imports to use CDN
    let transformedCode = threeCode.replace(
      /import \* as THREE from ['"]three['"]/g,
      "// THREE is loaded globally"
    );
    transformedCode = transformedCode.replace(
      /import .+ from ['"]three.+['"]/g,
      "// Additional THREE imports"
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; overflow: hidden; }
    canvas { display: block; width: 100%; height: 100vh; }
  </style>
</head>
<body>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script>
    try {
      ${transformedCode}
    } catch (error) {
      document.body.innerHTML = '<div style="padding: 20px; color: red;">Error: ' + error.message + '</div>';
      console.error(error);
    }
  </script>
</body>
</html>`;
  };

  const renderPreview = () => {
    // Mermaid diagram
    if (isMermaid) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-white p-4 overflow-auto">
          {renderError ? (
            <div className="text-red-600 p-4">{renderError}</div>
          ) : (
            <div ref={mermaidRef} className="max-w-full" />
          )}
        </div>
      );
    }

    // React component preview
    if (isReact) {
      try {
        const html = generateReactPreviewHTML(code);
        return (
          <iframe
            ref={iframeRef}
            srcDoc={html}
            title="React Preview"
            className="w-full h-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin"
          />
        );
      } catch (err) {
        return (
          <div className="flex items-center justify-center h-full text-red-600 bg-red-50 p-4">
            <div className="text-center">
              <p className="font-semibold mb-2">Preview Error</p>
              <p className="text-sm">{err.message}</p>
            </div>
          </div>
        );
      }
    }

    // Three.js preview
    if (isThreeJs) {
      try {
        const html = generateThreeJsPreviewHTML(code);
        return (
          <iframe
            ref={iframeRef}
            srcDoc={html}
            title="Three.js Preview"
            className="w-full h-full border-0 bg-black"
            sandbox="allow-scripts allow-same-origin"
          />
        );
      } catch (err) {
        return (
          <div className="flex items-center justify-center h-full text-red-600 bg-red-50 p-4">
            <div className="text-center">
              <p className="font-semibold mb-2">Preview Error</p>
              <p className="text-sm">{err.message}</p>
            </div>
          </div>
        );
      }
    }

    // HTML/Web preview
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
    }

    // Executable code output
    if (output || error) {
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
    }

    // Default empty state
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
          <p className="text-xs sm:text-sm">
            {isReact || isThreeJs ? "Switch to Preview tab to see the rendered output" : "Click 'Run Code' to see output"}
          </p>
        </div>
      </div>
    );
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Auto-switch to preview for React, Three.js, and Mermaid
  useEffect(() => {
    if ((isReact || isThreeJs || isMermaid) && activeTab === "code") {
      // Small delay to allow user to see the code first
      const timer = setTimeout(() => setActiveTab("preview"), 100);
      return () => clearTimeout(timer);
    }
  }, [isReact, isThreeJs, isMermaid]);

  // Static Code Block (non-executable)
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

  // Full Preview with Tabs
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
            {(isReact || isThreeJs || isMermaid) && (
              <span className="ml-1 text-green-600">●</span>
            )}
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

          {isExecutable && !isReact && !isThreeJs && (
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

      {/* Content Area */}
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