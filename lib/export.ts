export function buildCsv(headers: string[], rows: Array<Array<string | number>>) {
  const escapeCell = (value: string | number) => {
    const stringValue = String(value ?? '')
    const escaped = stringValue.replace(/"/g, '""')
    return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped
  }

  return [headers, ...rows]
    .map((row) => row.map((cell) => escapeCell(cell)).join(','))
    .join('\n')
}
