// utils/parseMarkdown.js
import hljs from "highlight.js";

export const parseMarkdown = (text) => {
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

  // Italic
  html = html.replace(
    /(?<!^)\*(.+?)\*/gm,
    '<em class="italic text-gray-700 dark:text-gray-300">$1</em>'
  );

      // Tables
    html = html.replace(
      /((?:\|.+\|\r?\n)+)(?=\n|$)/g,
      (match) => {
        const rows = match
          .trim()
          .split("\n")
          .filter((line) => line.trim().startsWith("|"));

        if (rows.length < 2) return match; // not a table

        const headers = rows[0]
          .split("|")
          .filter(Boolean)
          .map((h) => `<th class="px-3 py-2 border">${h.trim()}</th>`)
          .join("");

        const bodyRows = rows
          .slice(2) // skip header + alignment row
          .map((row) => {
            const cols = row
              .split("|")
              .filter(Boolean)
              .map((c) => `<td class="px-3 py-2 border">${c.trim()}</td>`)
              .join("");
            return `<tr>${cols}</tr>`;
          })
          .join("");

        return `<table class="border-collapse border border-gray-400 dark:border-gray-600 my-4">
          <thead><tr>${headers}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>`;
      }
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
