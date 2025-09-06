import React, { useEffect, useRef, useState } from "react";
// import hljs from "highlight.js";
//import "highlight.js/styles/github.css"; // try "github-dark.css" for dark mode look
import { parseMarkdown } from "../../utils/parseMarkdown";
import { useHighlightTheme } from "../../hooks/useHighlightTheme";
import { useMathJax } from "../../hooks/useMathJax";
// ---- local text helpers ----
const wordCount = (str = "") =>
  String(str).trim() ? String(str).trim().split(/\s+/).length : 0;

const trimToWords = (str = "", limit = 100) => {
  const words = String(str).trim().split(/\s+/);
  if (words.length <= limit) return String(str).trim();
  return words.slice(0, limit).join(" ") + "...";
};

const getPlainTextSummary = (html) => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
};
// ----------------------------

const ReplyData = ({ content }) => {
  const contentRef = useRef(null);
  const [expanded, setExpanded] = useState(false);

  // Theme + MathJax setup
  useHighlightTheme();
  const mathJaxLoaded = useMathJax(contentRef, [expanded, content]);

  const collapsedLimit = 50;

  // Gather all text for summary + word count
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
          {collapsedSummary && <div className="mb-2">{collapsedSummary}</div>}
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

