// utils/parseMarkdown.js
import hljs from "highlight.js";
import React, { useEffect, useRef, useState } from "react";

export const parseMarkdown = (text) => {
  let html = text || "";

  // Code blocks
  html = html.replace(/```(\w+)?([\s\S]*?)```/g, (match, lang, code) => {
    let highlighted;
    try {
      if (lang && hljs.getLanguage(lang)) {
        highlighted = hljs.highlight(code.trim(), { language: lang }).value;
      } else {
        highlighted = hljs.highlightAuto(code.trim()).value;
      }
    } catch {
      highlighted = code.trim();
    }
    return `<pre class="rounded-md overflow-x-auto mb-4"><code class="hljs ${lang || ''}">${highlighted}</code></pre>`;
  });

  // Headings
  html = html.replace(/^### (.+)$/gm, "<h3 class='text-xl font-bold'>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2 class='text-2xl font-bold'>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1 class='text-3xl font-bold'>$1</h1>");

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Italics (not bullet stars)
  html = html.replace(/(?<!^)\*(.+?)\*/gm, "<em>$1</em>");

  // Lists
  html = html.replace(/^\s*[-*] (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>)/gs, "<ul class='list-disc ml-6'>$1</ul>");

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code class='bg-gray-200 dark:bg-gray-800 px-1 rounded'>$1</code>");

  // Paragraphs
  html = "<p>" + html.replace(/\n\n/g, "</p><p>") + "</p>";

  return html;
};

export default parseMarkdown;
