import React, { useEffect, useState } from "react";

const wordCount = (str = "") =>
  String(str).trim() ? String(str).trim().split(/\s+/).length : 0;

const trimToWords = (str = "", limit = 100) => {
  const words = String(str).trim().split(/\s+/);
  if (words.length <= limit) return String(str).trim();
  return words.slice(0, limit).join(" ") + "...";
};

const ReplyData = ({ content }) => {
  const [expanded, setExpanded] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Track viewport to set responsive word limit (sm breakpoint at 640px)
  useEffect(() => {
    const checkScreen = () => setIsSmallScreen(window.innerWidth < 640);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const collapsedLimit = isSmallScreen ? 20 : 50;

  // Flatten all fields into one array for combined length calculation
  const allTexts = content?.map(
    (item) => `${item.userText || ""} ${item.prompt || ""} ${item.aiText || ""}`
  );
  const combinedCount = wordCount(allTexts?.join(" "));
  const hasImages = Array.isArray(content) && content.some((item) => item?.imageUrl?.fileUrl);

  // Check if we need the button
  const showSeeMore = combinedCount > collapsedLimit || hasImages;

  useEffect(() => {
    // Auto-expand only when short text and no images to show
    if (combinedCount < collapsedLimit && !hasImages) {
      setExpanded(true);
    }
  }, [combinedCount, hasImages, collapsedLimit]);

  // Collapsed: show first 50 words from combined fields (userText + prompt + aiText)
  const collapsedSummary = trimToWords(
    content
      ?.map((item) =>
        [item.userText, item.prompt, item.aiText].filter(Boolean).join(" ")
      )
      .join(" ") || "",
    collapsedLimit
  );

  return (
    <div className="text-sm text-text_content whitespace-pre-wrap leading-relaxed">
      {!expanded ? (
        <>
          {collapsedSummary && (
            <p className="mb-1 text-text_header">
              {collapsedSummary}
            </p>
          )}
          {showSeeMore && (
            <button
              onClick={() => setExpanded(true)}
              className="ml-2 text-blue-600 font-small hover:underline md:font-medium"
            >
              View More
            </button>
          )}
        </>
      ) : (
        <>
          {content?.map((item, index) => (
            <div key={index} className="mb-1">
              {item.userText && (
                <div className="mb-1">
                  <span className="mr-2 text-xs text-time_header">User</span>
                  <p className="leading-snug text-text_header">{item.userText}</p>
                </div>
              )}
              {item.prompt && (
                <div className="mb-1">
                  <span className="mr-2 text-xs text-time_header">Prompt</span>
                  <p className="leading-snug text-text_header">{item.prompt}</p>
                </div>
              )}
              {item.aiText && (
                <div className="mb-1">
                  <span className="mr-2 text-xs text-time_header">AI</span>
                  <p className="leading-sung text-text_header">{item.aiText}</p>
                </div>
              )}
              {item.imageUrl?.fileUrl && (
                <img
                  src={item.imageUrl.fileUrl}
                  alt={item.imageUrl.fileName || "uploaded"}
                  className="w-64 h-auto rounded-md mt-2"
                  loading="lazy"
                />
              )}
            </div>
          ))}
          {showSeeMore && (
            <button
              onClick={() => setExpanded(false)}
              className="ml-2 text-xs md:text-md  text-blue-600 hover:underline font-medium"
            >
              View Less
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default ReplyData;

// user text 40
//   ai prompt 70
//  ai text  80
// ai generated image

// user text 40
//   ai prompt 70
//  ai text  80
// ai generated image

// user text 40
//   ai prompt 70
//  ai text  80
// ai generated image
