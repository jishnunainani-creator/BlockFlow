/**
 * CSV Import & Export Utilities for Custom Planner Tables
 * Strictly follows RFC 4180 standard for escaping and line breaks.
 */

import { PlannerColumn, PlannerRow, CustomPlanner } from '../types/customPlanner';

/**
 * Escapes a single cell value for CSV output according to RFC 4180.
 */
function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts a planner table's columns and rows into RFC 4180 compliant CSV string.
 */
export function exportPlannerToCsv(planner: CustomPlanner, rows: PlannerRow[]): string {
  const visibleColumns = [...planner.columns]
    .filter((c) => c.visible)
    .sort((a, b) => a.order - b.order);

  const headerRow = visibleColumns.map((c) => escapeCsvCell(c.name)).join(',');

  const dataRows = rows.map((r) => {
    return visibleColumns
      .map((col) => {
        const val = r.values[col.id];
        return escapeCsvCell(val);
      })
      .join(',');
  });

  return [headerRow, ...dataRows].join('\r\n');
}

/**
 * Robust RFC 4180 CSV parser that properly handles quoted cells,
 * escaped quotes (""), and internal newlines.
 */
export function parseCsv(csvText: string): string[][] {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  const text = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentCell += '"';
          i++; // Skip the second quote
        } else {
          // Closing quote
          insideQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\n') {
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c !== '')) {
          lines.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
  }

  // Push last remaining cell and row if non-empty
  if (currentCell !== '' || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c !== '')) {
      lines.push(currentRow);
    }
  }

  return lines;
}

export interface CsvPreviewResult {
  headers: string[];
  totalRows: number;
  previewRows: Array<Record<string, string>>;
  rawRows: Array<Record<string, string>>;
}

/**
 * Parses raw CSV content and returns structured preview with detected headers and rows.
 */
export function getCsvPreview(csvText: string): CsvPreviewResult {
  const parsed = parseCsv(csvText);
  if (parsed.length === 0) {
    return { headers: [], totalRows: 0, previewRows: [], rawRows: [] };
  }

  const headers = parsed[0].map((h, i) => h || `Column ${i + 1}`);
  const dataRows = parsed.slice(1);

  const rawRows: Array<Record<string, string>> = dataRows.map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = row[index] || '';
    });
    return record;
  });

  return {
    headers,
    totalRows: rawRows.length,
    previewRows: rawRows.slice(0, 5),
    rawRows,
  };
}

/**
 * Maps parsed CSV row objects into native PlannerRow items based on column header matching.
 */
export function mapCsvToPlannerRows(
  rawRows: Array<Record<string, string>>,
  columns: PlannerColumn[],
  plannerId: string,
  columnMapping?: Record<string, string> // csvHeader -> columnId
): PlannerRow[] {
  const now = Date.now();

  return rawRows.map((raw, idx) => {
    const values: Record<string, any> = {};

    columns.forEach((col) => {
      // Find matching CSV header
      let matchingCsvHeader: string | undefined;

      if (columnMapping && Object.values(columnMapping).includes(col.id)) {
        matchingCsvHeader = Object.keys(columnMapping).find((k) => columnMapping[k] === col.id);
      } else {
        // Automatic fuzzy match by column name
        matchingCsvHeader = Object.keys(raw).find(
          (k) => k.toLowerCase().trim() === col.name.toLowerCase().trim()
        );
      }

      if (matchingCsvHeader && raw[matchingCsvHeader] !== undefined) {
        let val: any = raw[matchingCsvHeader].trim();

        if (col.type === 'number') {
          const num = Number(val);
          val = isNaN(num) ? 0 : num;
        } else if (col.type === 'checkbox') {
          val = val.toLowerCase() === 'true' || val === '1' || val.toLowerCase() === 'yes';
        }

        values[col.id] = val;
      } else if (col.defaultValue !== undefined) {
        values[col.id] = col.defaultValue;
      }
    });

    return {
      id: `row_imported_${now}_${idx}`,
      plannerId,
      order: idx,
      values,
      createdAt: now + idx,
      updatedAt: now + idx,
    };
  });
}

/**
 * Triggers a browser file download of CSV content.
 */
export function downloadCsvFile(filename: string, content: string): void {
  if (typeof window === 'undefined') return;

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
