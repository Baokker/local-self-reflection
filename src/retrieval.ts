export type IndexedMaterial = {
  sourceName: string;
  storedName: string;
  text: string;
};

export type MaterialChunk = {
  id: string;
  sourceName: string;
  storedName: string;
  text: string;
  terms: string[];
};

export type MaterialIndex = {
  version: 1;
  updatedAt: string;
  chunks: MaterialChunk[];
};

export type RetrievedChunk = MaterialChunk & {
  score: number;
};

export const emptyMaterialIndex = (): MaterialIndex => ({
  version: 1,
  updatedAt: new Date(0).toISOString(),
  chunks: []
});

export function indexMaterial(material: IndexedMaterial, maxChunkChars = 600): MaterialChunk[] {
  return splitText(material.text, maxChunkChars).map((text, index) => ({
    id: `${material.storedName}:${index + 1}`,
    sourceName: material.sourceName,
    storedName: material.storedName,
    text,
    terms: tokenize(text)
  }));
}

export function retrieveRelevantChunks(
  index: MaterialIndex,
  query: string,
  options: { limit?: number; maxTotalChars?: number } = {}
): RetrievedChunk[] {
  const limit = options.limit ?? 3;
  const maxTotalChars = options.maxTotalChars ?? 1800;
  const queryTerms = new Set(tokenize(query));
  if (!queryTerms.size) return [];

  const ranked = index.chunks
    .map((chunk) => ({
      ...chunk,
      score: chunk.terms.reduce((total, term) => total + (queryTerms.has(term) ? term.length : 0), 0)
    }))
    .filter((chunk) => chunk.score > 0)
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id));

  const selected: RetrievedChunk[] = [];
  let totalChars = 0;
  for (const chunk of ranked) {
    if (selected.length >= limit) break;
    const remaining = maxTotalChars - totalChars;
    if (remaining <= 0) break;
    selected.push({ ...chunk, text: chunk.text.slice(0, remaining) });
    totalChars += Math.min(chunk.text.length, remaining);
  }
  return selected;
}

function splitText(text: string, maxChunkChars: number) {
  const normalized = text.replace(/\r\n?/g, '\n').trim();
  if (!normalized) return [];

  const paragraphs = normalized.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = '';

  for (const paragraph of paragraphs) {
    if (paragraph.length > maxChunkChars) {
      if (current) {
        chunks.push(current);
        current = '';
      }
      for (let start = 0; start < paragraph.length; start += maxChunkChars) {
        chunks.push(paragraph.slice(start, start + maxChunkChars));
      }
      continue;
    }

    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length <= maxChunkChars) {
      current = candidate;
    } else {
      chunks.push(current);
      current = paragraph;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function tokenize(value: string) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, ' ');
  const terms = new Set<string>();

  for (const word of normalized.match(/[a-z0-9]+/g) ?? []) {
    if (word.length > 1) terms.add(word);
  }
  for (const sequence of normalized.match(/[\u4e00-\u9fff]+/g) ?? []) {
    if (sequence.length === 1) terms.add(sequence);
    for (let index = 0; index < sequence.length - 1; index += 1) {
      terms.add(sequence.slice(index, index + 2));
    }
  }
  return [...terms];
}
