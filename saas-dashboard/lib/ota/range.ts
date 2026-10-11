export function parseHttpByteRange(
  rangeHeader: string,
  totalSize: number
): { start: number; end: number } | null {
  if (!rangeHeader || !rangeHeader.startsWith("bytes=")) {
    return null;
  }

  const rangePart = rangeHeader.replace("bytes=", "").trim();
  const [startStr, endStr] = rangePart.split("-");

  let start = parseInt(startStr, 10);
  let end = endStr ? parseInt(endStr, 10) : totalSize - 1;

  if (isNaN(start)) {
    // Suffix byte range: bytes=-500 (last 500 bytes)
    const suffix = parseInt(endStr, 10);
    if (isNaN(suffix)) return null;
    start = Math.max(0, totalSize - suffix);
    end = totalSize - 1;
  }

  if (start < 0 || start >= totalSize || end < start) {
    return null;
  }

  end = Math.min(end, totalSize - 1);

  return { start, end };
}
