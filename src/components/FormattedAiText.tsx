import React from 'react';

interface FormattedAiTextProps {
  text: string;
  onSelectCode?: (code: string) => void;
  knownCodes?: Set<string>;
}

function renderInlineTokens(
  line: string,
  onSelectCode?: (code: string) => void,
  knownCodes?: Set<string>
): React.ReactNode[] {
  // Split by bold (**...**), italic (*...*), or item codes ([SHE-01] or SHE-01)
  const tokenRegex =
    /(\*\*[^*]+\*\*|\*[^*\n]+\*|\[?[A-Z]{2,6}-\d{1,4}\]?)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      const inner = token.slice(2, -2);
      parts.push(
        <strong
          key={`b-${match.index}`}
          className="font-extrabold text-[#122A47]"
        >
          {renderInlineTokens(inner, onSelectCode, knownCodes)}
        </strong>
      );
    } else if (
      token.startsWith('*') &&
      token.endsWith('*') &&
      token.length > 2
    ) {
      parts.push(
        <em key={`i-${match.index}`} className="italic text-[#475569]">
          {token.slice(1, -1)}
        </em>
      );
    } else {
      const cleanCode = token.replace(/^\[|\]$/g, '').toUpperCase();
      const isKnown = knownCodes ? knownCodes.has(cleanCode) : /^SHE-\d{2,3}$/.test(cleanCode);
      if (isKnown && onSelectCode) {
        parts.push(
          <button
            key={`c-${match.index}`}
            type="button"
            onClick={() => onSelectCode(cleanCode)}
            className="mx-0.5 inline-flex items-center rounded bg-[#EEF6F8] hover:bg-[#D9ECF2] border border-[#BBD7E3] px-1.5 py-0.5 font-mono text-[11px] font-extrabold text-[#0F5E6E] align-baseline transition-colors"
          >
            {cleanCode}
          </button>
        );
      } else {
        parts.push(token);
      }
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }

  return parts;
}

export function FormattedAiText({
  text,
  onSelectCode,
  knownCodes,
}: FormattedAiTextProps) {
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 text-[13.5px] leading-relaxed text-[#182230]">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trimEnd();
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={`sp-${idx}`} className="h-1" />;
        }

        const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);
        if (bulletMatch) {
          return (
            <div key={`li-${idx}`} className="flex items-start gap-2 pl-1">
              <span
                aria-hidden="true"
                className="mt-[7px] h-1.5 w-1.5 rounded-full bg-[#C9A227] shrink-0"
              />
              <span className="min-w-0 flex-1">
                {renderInlineTokens(bulletMatch[1], onSelectCode, knownCodes)}
              </span>
            </div>
          );
        }

        const numberedMatch = trimmed.match(/^(\d+\.)\s+(.*)$/);
        if (numberedMatch) {
          return (
            <div key={`ol-${idx}`} className="flex items-start gap-2 pl-1">
              <span className="font-mono text-[12px] font-bold text-[#8A6510] shrink-0 mt-[1px]">
                {numberedMatch[1]}
              </span>
              <span className="min-w-0 flex-1">
                {renderInlineTokens(numberedMatch[2], onSelectCode, knownCodes)}
              </span>
            </div>
          );
        }

        const headingMatch = trimmed.match(/^#{1,3}\s+(.*)$/);
        if (headingMatch) {
          return (
            <p
              key={`h-${idx}`}
              className="text-[14px] font-extrabold text-[#122A47] pt-0.5"
            >
              {renderInlineTokens(headingMatch[1], onSelectCode, knownCodes)}
            </p>
          );
        }

        return (
          <p key={`p-${idx}`} className="break-words">
            {renderInlineTokens(trimmed, onSelectCode, knownCodes)}
          </p>
        );
      })}
    </div>
  );
}
