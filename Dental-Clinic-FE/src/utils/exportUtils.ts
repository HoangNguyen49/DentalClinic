
export function convertToCSV(data: any[], headers: string[]): string {
  if (!data || data.length === 0) return '';

  const csvRows: string[] = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Handle null/undefined
      if (value === null || value === undefined) return '';
      // Escape commas and quotes
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    });
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Add BOM for UTF-8 support (Excel compatibility)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export data to CSV with custom mapping
 */
export function exportToCSV<T>(
  data: T[],
  columnMapping: Record<string, { key: keyof T; label: string }>,
  filename: string
): void {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const headers = Object.values(columnMapping).map(col => col.label);
  const keys = Object.values(columnMapping).map(col => col.key);
  
  const mappedData = data.map(item => {
    const row: any = {};
    keys.forEach((key, index) => {
      row[headers[index]] = item[key];
    });
    return row;
  });

  const csv = convertToCSV(mappedData, headers);
  downloadCSV(csv, `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
}
