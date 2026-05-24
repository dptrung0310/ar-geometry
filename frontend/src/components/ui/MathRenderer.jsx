import React, { useEffect, useState, useRef } from "react";

export default function MathRenderer({ text }) {
  const [katexLoaded, setKatexLoaded] = useState(!!window.katex);
  const containerRef = useRef(null);

  useEffect(() => {
    if (window.katex && window.renderMathInElement) {
      setKatexLoaded(true);
      return;
    }

    // Ensure we don't append duplicate link/script elements
    let link = document.querySelector('link[href*="katex.min.css"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css";
      document.head.appendChild(link);
    }

    const loadScripts = () => {
      let script = document.querySelector('script[src*="katex.min.js"]');
      if (!script) {
        script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js";
        script.onload = () => {
          let renderScript = document.querySelector('script[src*="auto-render.min.js"]');
          if (!renderScript) {
            renderScript = document.createElement("script");
            renderScript.src = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js";
            renderScript.onload = () => {
              setKatexLoaded(true);
            };
            document.head.appendChild(renderScript);
          } else {
            setKatexLoaded(true);
          }
        };
        document.head.appendChild(script);
      } else {
        // Scripts might already be loading, wait a bit or check
        const checkInterval = setInterval(() => {
          if (window.katex && window.renderMathInElement) {
            setKatexLoaded(true);
            clearInterval(checkInterval);
          }
        }, 100);
      }
    };

    loadScripts();
  }, []);

  useEffect(() => {
    if (katexLoaded && containerRef.current && window.renderMathInElement) {
      try {
        window.renderMathInElement(containerRef.current, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true }
          ],
          throwOnError: false,
        });
      } catch (err) {
        console.error("KaTeX rendering error:", err);
      }
    }
  }, [text, katexLoaded]);

  // A very basic markdown parser to format lists, headers, bold text and blocks
  const formatMarkdownToHTML = (rawText) => {
    if (!rawText) return "";

    // Escape basic HTML tags to prevent injections but keep LaTeX backslashes intact
    let html = rawText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Headings: e.g. "### Bước 1: ..."
    html = html.replace(/^### (.*?)$/gm, '<h4 class="math-h4" style="color:var(--cyan); font-weight:600; margin-top:16px; margin-bottom:8px; font-size:15px; border-left: 3px solid var(--cyan); padding-left: 8px;">$1</h4>');
    html = html.replace(/^## (.*?)$/gm, '<h3 class="math-h3" style="color:var(--text); font-weight:700; margin-top:20px; margin-bottom:10px; font-size:17px; border-bottom: 1px solid var(--border); padding-bottom: 6px;">$1</h3>');
    html = html.replace(/^# (.*?)$/gm, '<h2 class="math-h2" style="color:var(--text); font-weight:800; margin-top:24px; margin-bottom:12px; font-size:20px;">$1</h2>');

    // Bold: **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text); font-weight:600;">$1</strong>');

    // Bullet points: lines starting with "- " or "* "
    html = html.replace(/^(?:-|\*)\s+(.*?)$/gm, '<li style="margin-left: 20px; margin-bottom: 6px; list-style-type: disc;">$1</li>');
    
    // Numbered lists: lines starting with e.g. "1. " or "2. "
    html = html.replace(/^(\d+)\.\s+(.*?)$/gm, '<li style="margin-left: 20px; margin-bottom: 6px; list-style-type: decimal;">$2</li>');

    // Paragraph splits by double newlines, ignoring list items and headings
    const lines = html.split("\n");
    const processedLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      // If it's already an HTML block tag (li, h2, h3, h4), return as is
      if (trimmed.startsWith("<li") || trimmed.startsWith("<h") || trimmed.startsWith("<ul") || trimmed.startsWith("<ol")) {
        return line;
      }
      return `<p style="margin-bottom: 12px; color: var(--text2); text-align: justify; text-justify: inter-word; line-height: 1.7;">${line}</p>`;
    });

    return processedLines.join("\n");
  };

  return (
    <div
      ref={containerRef}
      className="math-renderer-content"
      style={{
        lineHeight: "1.7",
        fontSize: "14px",
        color: "var(--text2)",
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}
      dangerouslySetInnerHTML={{ __html: formatMarkdownToHTML(text) }}
    />
  );
}
