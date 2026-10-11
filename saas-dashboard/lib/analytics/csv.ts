export function generateRfc4180Csv(rows: Record<string, any>[]): string {
  if (!rows || rows.length === 0) return "";

  const headers = Object.keys(rows[0]);
  const lines: string[] = [];

  // Header line
  lines.push(headers.join(","));

  for (const row of rows) {
    const fields = headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return "";
      const str = String(val);

      // Check if field contains commas, double quotes, or newlines
      if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        // Escape double quotes by doubling them
        const escaped = str.replace(/"/g, '""');
        return `"${escaped}"`;
      }
      return str;
    });
    lines.push(fields.join(","));
  }

  return lines.join("\r\n");
}
