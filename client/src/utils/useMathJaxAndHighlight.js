import { useEffect } from "react";

export const useMathJaxAndHighlight = () => {
  useEffect(() => {
    // Configure MathJax
    window.MathJax = {
      tex: {
        inlineMath: [["\\(", "\\)"], ["$", "$"]],
        displayMath: [["\\[", "\\]"], ["$$", "$$"]],
      },
      options: {
        skipHtmlTags: ["script", "noscript", "style", "textarea", "pre", "code"],
      },
    };

    // Load MathJax
    if (!document.querySelector("#mathjax-script")) {
      const script = document.createElement("script");
      script.id = "mathjax-script";
      script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
      script.async = true;
      document.head.appendChild(script);
    }

    // Highlight.js theme switcher
    const root = document.documentElement;
    const applyTheme = () => {
      const isDark = root.classList.contains("dark");
      const href = isDark
        ? "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css"
        : "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css";
      document.querySelectorAll("link[data-hljs-theme]").forEach((el) => el.remove());
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.setAttribute("data-hljs-theme", "true");
      document.head.appendChild(link);
    };
    applyTheme();
    const obs = new MutationObserver(applyTheme);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
};

export default useMathJaxAndHighlight;