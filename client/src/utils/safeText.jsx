import React from 'react';

/**
 * Parses bold markdown (**text**) into safe React elements.
 */
function parseInlineStyles(text) {
  if (typeof text !== 'string') return text;

  const parts = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <strong key={`bold-${match.index}`} className="font-semibold text-slate-900">
        {match[1]}
      </strong>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Safely converts multi-line markdown text to React elements without dangerouslySetInnerHTML.
 */
export function SafeText({ text, className = "" }) {
  if (!text) return null;

  const lines = text.split('\n');
  const blocks = [];
  let currentList = null;
  let listType = null; // 'ul' or 'ol'

  const flushList = () => {
    if (currentList && currentList.length > 0) {
      if (listType === 'ol') {
        blocks.push(
          <ol key={`ol-${blocks.length}`} className="list-decimal pl-5 space-y-1 my-2 text-slate-700">
            {currentList.map((item, i) => (
              <li key={`li-${i}`}>{parseInlineStyles(item)}</li>
            ))}
          </ol>
        );
      } else {
        blocks.push(
          <ul key={`ul-${blocks.length}`} className="list-disc pl-5 space-y-1 my-2 text-slate-700">
            {currentList.map((item, i) => (
              <li key={`li-${i}`}>{parseInlineStyles(item)}</li>
            ))}
          </ul>
        );
      }
      currentList = null;
      listType = null;
    }
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      return;
    }

    // Numbered list item
    const olMatch = line.match(/^\d+\.\s+(.+)/);
    if (olMatch) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
        currentList = [];
      }
      currentList.push(olMatch[1]);
      return;
    }

    // Bullet list item
    const ulMatch = line.match(/^[-*•]\s+(.+)/);
    if (ulMatch) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
        currentList = [];
      }
      currentList.push(ulMatch[1]);
      return;
    }

    // Normal paragraph line
    flushList();
    blocks.push(
      <p key={`p-${index}`} className="my-1.5 leading-relaxed text-slate-700">
        {parseInlineStyles(line)}
      </p>
    );
  });

  flushList();

  return <div className={`space-y-1 ${className}`}>{blocks}</div>;
}
