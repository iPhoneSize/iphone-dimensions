// RFC 4180 parser. Separators are literal characters, not patterns.

export function parseCsv(text) {
  if (typeof text !== 'string') {
    throw new Error('CSV text must be a string');
  }

  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let afterQuote = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
          continue;
        }
        inQuotes = false;
        afterQuote = true;
        continue;
      }
      field += char;
      continue;
    }

    if (char === '"') {
      if (field.length !== 0 || afterQuote) {
        throw new Error('Unexpected quote in CSV field');
      }
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      row.push(field);
      field = '';
      afterQuote = false;
      continue;
    }

    if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') {
        i += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      afterQuote = false;
      continue;
    }

    if (afterQuote) {
      throw new Error('Unexpected character after a closing CSV quote');
    }
    field += char;
  }

  if (inQuotes) {
    throw new Error('Unclosed quote in CSV');
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}
