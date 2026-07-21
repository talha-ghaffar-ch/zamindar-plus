import { Fragment, type ReactNode } from 'react';

/**
 * Renders the light markdown the agent is allowed to use — paragraphs, bullet
 * and numbered lists, and **bold** — as React elements.
 *
 * Everything is built from parsed text nodes, so model output is never injected
 * as HTML and cannot introduce markup or scripts.
 */

type Block =
  | { kind: 'paragraph'; lines: string[] }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'numbers'; items: string[] };

const BULLET_PATTERN = /^\s*[-*•]\s+(.*)$/;
const NUMBER_PATTERN = /^\s*\d+[.)]\s+(.*)$/;

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let current: Block | null = null;

  const flush = () => {
    if (current) {
      blocks.push(current);
      current = null;
    }
  };

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trimEnd();

    if (line.trim() === '') {
      flush();
      continue;
    }

    const bullet = BULLET_PATTERN.exec(line);
    if (bullet) {
      if (current?.kind !== 'bullets') {
        flush();
        current = { kind: 'bullets', items: [] };
      }
      current.items.push(bullet[1]);
      continue;
    }

    const numbered = NUMBER_PATTERN.exec(line);
    if (numbered) {
      if (current?.kind !== 'numbers') {
        flush();
        current = { kind: 'numbers', items: [] };
      }
      current.items.push(numbered[1]);
      continue;
    }

    if (current?.kind !== 'paragraph') {
      flush();
      current = { kind: 'paragraph', lines: [] };
    }
    current.lines.push(line);
  }

  flush();
  return blocks;
}

/** Split on **bold** markers and return text/strong nodes. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    nodes.push(<strong key={`${keyPrefix}-b${index++}`}>{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

export function FormattedMessage({ text }: { text: string }) {
  const blocks = parseBlocks(text);

  if (blocks.length === 0) {
    return <p>{text}</p>;
  }

  return (
    <div className="ai-rich-text">
      {blocks.map((block, blockIndex) => {
        const key = `b${blockIndex}`;

        if (block.kind === 'bullets') {
          return (
            <ul key={key}>
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`}>
                  {renderInline(item, `${key}-${itemIndex}`)}
                </li>
              ))}
            </ul>
          );
        }

        if (block.kind === 'numbers') {
          return (
            <ol key={key}>
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`}>
                  {renderInline(item, `${key}-${itemIndex}`)}
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={key}>
            {block.lines.map((line, lineIndex) => (
              <Fragment key={`${key}-${lineIndex}`}>
                {lineIndex > 0 ? <br /> : null}
                {renderInline(line, `${key}-${lineIndex}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
