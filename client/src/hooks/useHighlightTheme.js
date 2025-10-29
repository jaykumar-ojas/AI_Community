import { useEffect } from "react";

export const useHighlightTheme = () => {
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      const isDark = root.classList.contains("dark");
      const themeHref =  "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css";
        // : "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css";

      document.querySelectorAll("link[data-hljs-theme]").forEach((el) => el.remove());

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = themeHref;
      link.setAttribute("data-hljs-theme", "true");
      document.head.appendChild(link);
    };

    applyTheme();
    const observer = new MutationObserver(applyTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);
};
export default useHighlightTheme;