import { useEffect, useState } from "react";

export const useMathJax = (contentRef, dependencies = []) => {
  const [mathJaxLoaded, setMathJaxLoaded] = useState(false);

  // Load MathJax once
  useEffect(() => {
    if (window.MathJax && window.MathJax.typesetPromise) {
      setMathJaxLoaded(true);
      return;
    }

    window.MathJax = {
      tex: {
        inlineMath: [["\\(", "\\)"], ["$", "$"]],
        displayMath: [["\\[", "\\]"], ["$$", "$$"]],
        processEscapes: true,
        processEnvironments: true,
      },
      options: {
        skipHtmlTags: ["script", "noscript", "style", "textarea", "pre", "code"],
      },
      startup: {
        ready: () => {
          window.MathJax.startup.defaultReady();
          setMathJaxLoaded(true);
        },
      },
    };

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Re-render MathJax whenever dependencies change
  useEffect(() => {
    if (mathJaxLoaded && contentRef.current && window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise([contentRef.current]).catch((err) =>
        console.warn("MathJax rendering error:", err)
      );
    }
  }, [mathJaxLoaded, contentRef, ...dependencies]);

  return mathJaxLoaded;
};
export default useMathJax;