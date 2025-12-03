import React, { useEffect, useRef, useState } from "react";
// import hljs from "highlight.js";
//import "highlight.js/styles/github.css"; // try "github-dark.css" for dark mode look
import { parseMarkdown } from "../../utils/parseMarkdown";
import { useHighlightTheme } from "../../hooks/useHighlightTheme";
import { useMathJax } from "../../hooks/useMathJax";
import { AiShowIcon } from "../../asset/icons";
import ModelIcon from "../AIchatbot/Component/ModelIcon";
import ImagePreviewCard from "./ImagePreivewCard";
import { CodePreview } from "../ui/CodePreview";



const ShowUrl = ({ url, modelInfo }) => {
  const [showPreview,setShowPreview]=useState(false);
  const handleClosePreview = () =>{
    setShowPreview(!showPreview);
  }
   if (!url) return null;
  return (
    <div className="flex justify-start">
      <div onClick={handleClosePreview} className="max-w-[100%] bg-nav_hover2 rounded-2xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-500 cursor-pointer">
        {modelInfo && (
          <div className="flex items-center justify-between  border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-nav_hover2">
            <div className="flex items-center text-xs space-x-2">
              <ModelIcon modelName={modelInfo} data={true}/>
            </div>
          </div>
        )}
        <div className="flex items-center justify-center">
          <img
            src={url}
            className="max-h-[200px] w-auto object-contain"
            alt="Generated content"
            onError={(e) => (e.target.style.display = "none")}
          />
        </div>
      </div>
      {showPreview && <ImagePreviewCard imgUrl={url} modelInfo={modelInfo} onClose={handleClosePreview}/>}
    </div>
  );
};

// const DisplayContent = ({ displayContent }) => {
//   return (
//     <>
//       {displayContent?.map((item, index) => (
//         <div
//           key={item.id || item._id || `content-${index}`}
//           className="mb-4 border-gray-200 dark:border-gray-700"
//         >
//           {item.userText && (
//             <div className="mb-3">
//               <div
//                 dangerouslySetInnerHTML={{
//                   __html: parseMarkdown(item.userText),
//                 }}
//               />
//             </div>
//           )}
//           {item.prompt && (
//             <div className="mb-3">
//               <span className="inline-block mb-2 text-xs font-semibold text-white bg-yellow-500 px-2 py-1 rounded">
//                 Prompt
//               </span>
//               <div
//                 dangerouslySetInnerHTML={{
//                   __html: parseMarkdown(item.prompt),
//                 }}
//               />
//             </div>
//           )}
//           {item.aiText && (
//             <div className="mb-3">
//               <ModelIcon modelName={item.model} />
//               <div
//                 className=""
//                 dangerouslySetInnerHTML={{
//                   __html: parseMarkdown(item.aiText),
//                 }}
//               />
//             </div>
//           )}
//           {item.imageUrl?.fileUrl && (
//             <ShowUrl url={item.imageUrl.fileUrl} modelInfo={item.model} />
//           )}
//         </div>
//       ))}
//     </>
//   );
// };
// ---- local text helpers ----
const DisplayContent = ({ displayContent }) => {
  const renderWithCodeBlocks = (text) => {
    if (!text) return null;

    // Match Markdown or HTML <pre><code> style blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      const before = text.slice(lastIndex, match.index);
      const lang = match[1] || "plaintext";
      const code = match[2];
      if (before.trim()) {
        parts.push(
          <div
            key={`text-${lastIndex}`}
            className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none break-words"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(before) }}
          />
        );
      }
      parts.push(
        <div key={`code-${match.index}`} className="my-2 w-full min-w-0 ">
          <CodePreview code={code} language={lang} />
        </div>
      );
      lastIndex = match.index + match[0].length;
    }

    const after = text.slice(lastIndex);
    if (after.trim()) {
      parts.push(
        <div
          key="after-text"
          className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none break-words"
          dangerouslySetInnerHTML={{ __html: parseMarkdown(after) }}
        />
      );
    }

    return parts;
  };

  return (
    <div className="w-full">
      {displayContent?.map((item, index) => (
        <div
          key={item.id || item._id || `content-${index}`}
          className="mb-3 sm:mb-4 border-gray-200 dark:border-gray-700 w-full px-2 sm:px-0"
        >
          {/* User Text */}
          {item.userText && (
            <div className="mb-2 sm:mb-3 break-words">
              {renderWithCodeBlocks(item.userText)}
            </div>
          )}

          {/* Prompt */}
          {item.prompt && (
            <div className="mb-2 sm:mb-3 break-words">
              <span className="inline-block mb-2 text-[10px] sm:text-xs font-semibold text-white bg-yellow-500 px-2 py-1 rounded">
                Prompt
              </span>
              <div className="overflow-x-auto">
                {renderWithCodeBlocks(item.prompt)}
              </div>
            </div>
          )}

          {/* AI Text */}
          {item.aiText && (
            <div className="mb-2 sm:mb-3 break-words">
              <ModelIcon modelName={item.model} />
              <div className="overflow-x-auto">
                {renderWithCodeBlocks(item.aiText)}
              </div>
            </div>
          )}

          {/* Image */}
          {item.imageUrl?.fileUrl && (
            <div className="w-full overflow-hidden">
              <ShowUrl url={item.imageUrl.fileUrl} modelInfo={item.model} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};


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

const storingImageUrl = (content) => {
  const allUrl =
    Array.isArray(content) && content.length > 0
      ? content.map((item) => item.imageUrl?.fileUrl)
      : [];
  return allUrl;
};
// ----------------------------

const ReplyData2 = ({ content }) => {
  const contentRef = useRef(null);
  const [expanded, setExpanded] = useState(false);

  // Theme + MathJax setup
  useHighlightTheme();
  const mathJaxLoaded = useMathJax(contentRef, [expanded, content]);

  const collapsedLimit = 50;

  // Gather all text for summary + word count
  const allUrl = storingImageUrl(content);
  const allTexts =
    Array.isArray(content) && content.length > 0
      ? content.map(
          (item) => `${item.userText || ""} ${item.prompt || ""} ${item.aiText || ""}`
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
    <div className="text-[13px] font-poppins leading-relaxed  text-gray-800 dark:low_text">
   {!expanded ? (
  <>
    <div className="max-h-[200px] overflow-hidden relative">  {/* Changed from h-6 */}
      <DisplayContent displayContent={displayContent} />
      {/* Optional gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-gray-900 to-transparent"></div>
    </div>

    {hasImages && (
      <div className="flex items-center">
        {allUrl?.slice(0, 4).map((url, idx) => (
          <div
            key={url || `image-${idx}`}
            className={`${idx > 0 ? "-ml-8" : ""} flex items-center justify-center`}
          >
          </div>
        ))}
        {allUrl.length > 4 && (
          <div className="items-center justify-content">...</div>
        )}
      </div>
    )}

    {showSeeMore && (
      <button
        onClick={() => setExpanded(true)}
        className="text-theme_color3 dark:theme_color4 font-medium text-xs hover:underline mt-2"
      >
        View More
      </button>
    )}
  </>
)  : (
        <div ref={contentRef}>
          <DisplayContent displayContent={displayContent} />
          {showSeeMore && (
            <button
              onClick={() => setExpanded(false)}
              className="text-theme_color3 dark:text-theme_color4 font-medium text-xs hover:underline"
            >
              View Less
            </button>
          )}
        </div>
      )}

      {!mathJaxLoaded && expanded && (
        <div className="text-xs text-gray-500 mt-2">Loading math renderer...</div>
      )}
    </div>
  );
};

export default ReplyData2;




