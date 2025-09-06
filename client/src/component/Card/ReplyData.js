import React, { useEffect, useRef, useState } from "react";
import hljs from "highlight.js";
//import "highlight.js/styles/github.css"; // try "github-dark.css" for dark mode look

// Word count helper
const wordCount = (str = "") =>
  String(str).trim() ? String(str).trim().split(/\s+/).length : 0;

// Trim by words
const trimToWords = (str = "", limit = 100) => {
  const words = String(str).trim().split(/\s+/);
  if (words.length <= limit) return String(str).trim();
  return words.slice(0, limit).join(" ") + "...";
};

// Strip HTML for plain text summary
const getPlainTextSummary = (html) => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
};

const useHighlightTheme = () => {
  useEffect(() => {
    // Tailwind dark mode toggles "dark" on <html> or <body>
    const root = document.documentElement;

    const applyTheme = () => {
      const isDark = root.classList.contains("dark");
      const themeHref = isDark
        ? "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css"
        : "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css";

      // Remove existing highlight.js style if any
      document.querySelectorAll("link[data-hljs-theme]").forEach((el) => el.remove());

      // Inject correct theme
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = themeHref;
      link.setAttribute("data-hljs-theme", "true");
      document.head.appendChild(link);
    };

    // Initial apply
    applyTheme();

    // Watch for Tailwind dark mode toggle
    const observer = new MutationObserver(applyTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);
};


const ReplyData = ({ content }) => {
  const contentRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [mathJaxLoaded, setMathJaxLoaded] = useState(false);

  useHighlightTheme();
  const collapsedLimit = 50;

  // Load MathJax
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
    script.onload = () => {
      setTimeout(() => {
        if (window.MathJax?.typesetPromise && !mathJaxLoaded) {
          setMathJaxLoaded(true);
        }
      }, 100);
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Re-render MathJax
  useEffect(() => {
    if (
      mathJaxLoaded &&
      expanded &&
      contentRef.current &&
      window.MathJax?.typesetPromise
    ) {
      window.MathJax.typesetPromise([contentRef.current]).catch((err) => {
        console.warn("MathJax rendering error:", err);
      });
    }
  }, [mathJaxLoaded, expanded, content]);

  // Markdown parser
  const parseMarkdown = (text) => {
    let html = text;

    // Code blocks ```lang ... ```
    html = html.replace(/```(\w+)?([\s\S]*?)```/g, (match, lang, code) => {
      let highlighted;
      try {
        if (lang && hljs.getLanguage(lang)) {
          highlighted = hljs.highlight(code.trim(), { language: lang }).value;
        } else {
          highlighted = hljs.highlightAuto(code.trim()).value;
        }
      } catch (err) {
        highlighted = code.trim();
      }

      return `<pre class="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-sm rounded-md overflow-x-auto mb-4 p-4">
        <code class="hljs ${lang || ""}">${highlighted}</code>
      </pre>`;
    });

    // Horizontal rule
    html = html.replace(
      /^---$/gm,
      '<hr class="border-gray-300 dark:border-gray-600 my-6" />'
    );

    // Headings
    html = html.replace(
      /^### (.+)$/gm,
      '<h3 class="text-xl font-bold text-blue-800 dark:text-blue-300 mt-6 mb-4 border-b-2 border-blue-200 dark:border-blue-700 pb-2">$1</h3>'
    );
    html = html.replace(
      /^## (.+)$/gm,
      '<h2 class="text-2xl font-bold text-blue-900 dark:text-blue-200 mt-8 mb-4">$1</h2>'
    );
    html = html.replace(
      /^# (.+)$/gm,
      '<h1 class="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-8 mb-6">$1</h1>'
    );

    // Bold
    html = html.replace(
      /\*\*(.+?)\*\*/g,
      '<strong class="font-bold text-purple-700 dark:text-purple-300">$1</strong>'
    );

    // Bullets
    html = html.replace(
      /^\s*[-*] (.+)$/gm,
      '<li class="ml-4 mb-2 text-gray-700 dark:text-gray-300">$1</li>'
    );
    html = html.replace(
      /(<li.*<\/li>)/gs,
      '<ul class="list-disc list-inside mb-4">$1</ul>'
    );

    // Inline code
    html = html.replace(
      /`([^`]+)`/g,
      '<code class="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-1 rounded">$1</code>'
    );

    // Italic (skip list stars)
    html = html.replace(
      /(?<!^)\*(.+?)\*/gm,
      '<em class="italic text-gray-700 dark:text-gray-300">$1</em>'
    );

    // Paragraphs
    html = html.replace(
      /\n\n/g,
      '</p><p class="mb-4 text-gray-800 dark:text-gray-200 leading-relaxed">'
    );
    html =
      '<p class="mb-4 text-gray-800 dark:text-gray-200 leading-relaxed">' +
      html +
      "</p>";

    // Cleanup
    html = html.replace(/<p class="[^"]*">\s*<\/p>/g, "");
    html = html.replace(/<p class="[^"]*">\s*<hr/g, "<hr");
    html = html.replace(/<p class="[^"]*">\s*<h/g, "<h");
    html = html.replace(/<\/h[1-6]>\s*<\/p>/g, "</h3>");
    html = html.replace(/<p class="[^"]*">\s*<ul/g, "<ul");
    html = html.replace(/<\/ul>\s*<\/p>/g, "</ul>");

    return html;
  };

  // Stats
  const allTexts =
    Array.isArray(content) && content.length > 0
      ? content.map(
          (item) =>
            `${item.userText || ""} ${item.prompt || ""} ${item.aiText || ""}`
        )
      : [];

  const combinedCount = wordCount(allTexts.join(" "));
  const hasImages =
    Array.isArray(content) && content.some((item) => item?.imageUrl?.fileUrl);
  const showSeeMore = combinedCount > collapsedLimit || hasImages;

  useEffect(() => {
    if (combinedCount < collapsedLimit && !hasImages) {
      setExpanded(true);
    }
  }, [combinedCount, hasImages]);

  const collapsedSummary = trimToWords(
    getPlainTextSummary(allTexts.join(" ")),
    collapsedLimit
  );

  const displayContent =
    content && Array.isArray(content) && content.length > 0 ? content : [];

  return (
    <div className="text-sm leading-relaxed text-gray-800 dark:text-gray-200">
      {!expanded ? (
        <>
          {collapsedSummary && (
            <div className="mb-2">{collapsedSummary}</div>
          )}
          {showSeeMore && (
            <button
              onClick={() => setExpanded(true)}
              className="text-blue-600 dark:text-blue-400 text-xs hover:underline"
            >
              View More
            </button>
          )}
        </>
      ) : (
        <div ref={contentRef}>
          {displayContent?.map((item, index) => (
            <div
              key={index}
              className="mb-4 border-l-2 border-gray-200 dark:border-gray-700 pl-3"
            >
              {item.userText && (
                <div className="mb-3">
                  <span className="inline-block mb-2 text-xs font-semibold text-white bg-blue-500 px-2 py-1 rounded">
                    User
                  </span>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: parseMarkdown(item.userText),
                    }}
                  />
                </div>
              )}
              {item.prompt && (
                <div className="mb-3">
                  <span className="inline-block mb-2 text-xs font-semibold text-white bg-yellow-500 px-2 py-1 rounded">
                    Prompt
                  </span>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: parseMarkdown(item.prompt),
                    }}
                  />
                </div>
              )}
              {item.aiText && (
                <div className="mb-3">
                  <span className="inline-block mb-2 text-xs font-semibold text-white bg-green-500 px-2 py-1 rounded">
                    AI
                  </span>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: parseMarkdown(item.aiText),
                    }}
                  />
                </div>
              )}
              {item.imageUrl?.fileUrl && (
                <img
                  src={item.imageUrl.fileUrl}
                  alt={item.imageUrl.fileName || "uploaded"}
                  className="max-w-md h-auto rounded-md shadow-sm border"
                />
              )}
            </div>
          ))}
          {showSeeMore && (
            <button
              onClick={() => setExpanded(false)}
              className="text-blue-600 dark:text-blue-400 text-xs hover:underline"
            >
              View Less
            </button>
          )}
        </div>
      )}

      {!mathJaxLoaded && expanded && (
        <div className="text-xs text-gray-500 mt-2">
          Loading math renderer...
        </div>
      )}
    </div>
  );
};

export default ReplyData;
