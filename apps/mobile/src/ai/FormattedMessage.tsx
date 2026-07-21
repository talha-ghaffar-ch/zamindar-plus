import React from 'react';
import {StyleSheet, View} from 'react-native';
import {AppText} from '../components/AppText';

/**
 * Renders the light markdown the agent is allowed to use — paragraphs, bullet
 * and numbered lists, and **bold** — using Text nodes. Model output is parsed
 * into components, never interpreted as markup.
 */

type Block =
  | {kind: 'paragraph'; lines: string[]}
  | {kind: 'bullets'; items: string[]}
  | {kind: 'numbers'; items: string[]};

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
        current = {kind: 'bullets', items: []};
      }
      current.items.push(bullet[1]);
      continue;
    }

    const numbered = NUMBER_PATTERN.exec(line);
    if (numbered) {
      if (current?.kind !== 'numbers') {
        flush();
        current = {kind: 'numbers', items: []};
      }
      current.items.push(numbered[1]);
      continue;
    }

    if (current?.kind !== 'paragraph') {
      flush();
      current = {kind: 'paragraph', lines: []};
    }
    current.lines.push(line);
  }

  flush();
  return blocks;
}

/** Split on **bold** markers into plain and bold Text runs. */
function renderInline(text: string, keyPrefix: string) {
  const nodes: React.ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    nodes.push(
      <AppText key={`${keyPrefix}-b${index++}`} style={styles.bold}>
        {match[1]}
      </AppText>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

export function FormattedMessage({
  text,
  color,
}: {
  text: string;
  color?: string;
}) {
  const blocks = parseBlocks(text);
  const textStyle = color ? [styles.text, {color}] : styles.text;

  if (blocks.length === 0) {
    return <AppText style={textStyle}>{text}</AppText>;
  }

  return (
    <View style={styles.container}>
      {blocks.map((block, blockIndex) => {
        const key = `b${blockIndex}`;

        if (block.kind === 'bullets' || block.kind === 'numbers') {
          return (
            <View key={key} style={styles.list}>
              {block.items.map((item, itemIndex) => (
                <View key={`${key}-${itemIndex}`} style={styles.listRow}>
                  <AppText style={textStyle}>
                    {block.kind === 'bullets' ? '•  ' : `${itemIndex + 1}.  `}
                  </AppText>
                  <AppText style={[textStyle, styles.listText]}>
                    {renderInline(item, `${key}-${itemIndex}`)}
                  </AppText>
                </View>
              ))}
            </View>
          );
        }

        return (
          <AppText key={key} style={textStyle}>
            {block.lines.map((line, lineIndex) => (
              <AppText key={`${key}-${lineIndex}`}>
                {lineIndex > 0 ? '\n' : ''}
                {renderInline(line, `${key}-${lineIndex}`)}
              </AppText>
            ))}
          </AppText>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {gap: 8},
  text: {lineHeight: 21},
  bold: {fontWeight: '800'},
  list: {gap: 4},
  listRow: {flexDirection: 'row', alignItems: 'flex-start'},
  listText: {flex: 1},
});
