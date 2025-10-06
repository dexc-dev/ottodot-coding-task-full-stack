/**
 * Utility functions for rendering markdown content in React components
 */

export interface TableData {
  headers: string[]
  rows: string[][]
}

/**
 * Parse markdown table string into structured data
 */
export function parseMarkdownTable(tableText: string): TableData | null {
  const lines = tableText.trim().split('\n').filter(line => line.trim())
  
  if (lines.length < 3) return null // Need at least header, separator, and one row
  
  // Find table start and end
  let tableStart = -1
  let tableEnd = -1
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('|') && lines[i].trim().startsWith('|')) {
      if (tableStart === -1) tableStart = i
      tableEnd = i
    }
  }
  
  if (tableStart === -1 || tableEnd === -1) return null
  
  const tableLines = lines.slice(tableStart, tableEnd + 1)
  
  // Parse headers (first line)
  const headerLine = tableLines[0]
  const headers = headerLine.split('|')
    .map(cell => cell.trim())
    .filter(cell => cell.length > 0)
  
  // Skip separator line (second line)
  const dataLines = tableLines.slice(2)
  
  // Parse data rows
  const rows = dataLines.map(line => {
    return line.split('|')
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0)
  }).filter(row => row.length > 0)
  
  return { headers, rows }
}

/**
 * Check if text contains a markdown table
 */
export function containsMarkdownTable(text: string): boolean {
  const lines = text.split('\n')
  let hasTableStructure = false
  
  for (let i = 0; i < lines.length - 2; i++) {
    const line1 = lines[i].trim()
    const line2 = lines[i + 1].trim()
    const line3 = lines[i + 2].trim()
    
    if (line1.includes('|') && line2.includes('|') && line3.includes('|') &&
        line1.startsWith('|') && line2.startsWith('|') && line3.startsWith('|')) {
      hasTableStructure = true
      break
    }
  }
  
  return hasTableStructure
}

/**
 * Clean step text by removing redundant numbering
 */
export function cleanStepText(stepText: string): string {
  // Remove patterns like "Step 1:", "Step 2:", etc. when they appear at the beginning
  return stepText.replace(/^Step\s+\d+:\s*/, '')
}
