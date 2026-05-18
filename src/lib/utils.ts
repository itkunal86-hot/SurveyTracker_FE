import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format column header name by replacing underscores with spaces and converting to uppercase
 * Examples: "se_id" -> "SE ID", "created_date" -> "CREATED DATE"
 */
export function formatColumnHeader(columnName: string): string {
  return columnName
    .replace(/_/g, " ") // Replace underscores with spaces
    .toUpperCase() // Convert to uppercase
}

/**
 * Format date value to DD/MM/YYYY HH:MM format
 * Handles various date formats and null values
 */
export function formatDateCell(value: any): string {
  if (!value || value === "" || value === null || value === undefined) {
    return "-"
  }

  try {
    let date: Date

    if (typeof value === 'string') {
      // Handle ISO 8601 date strings and other common formats
      date = new Date(value)
    } else if (value instanceof Date) {
      date = value
    } else if (typeof value === 'number') {
      // Timestamp in milliseconds
      date = new Date(value)
    } else {
      return String(value)
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return String(value)
    }

    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")

    return `${day}/${month}/${year} ${hours}:${minutes}`
  } catch (error) {
    return String(value)
  }
}

/**
 * Check if a column name appears to be a date field based on common naming patterns
 */
export function isDateColumn(columnName: string): boolean {
  if (!columnName || typeof columnName !== 'string') return false

  const dateKeywords = [
    "date",
    "time",
    "timestamp",
    "created",
    "updated",
    "modified",
    "entry",
    "logged",
    "recorded",
    "seen",
    "se_entry_date"
  ]

  const lowerName = columnName.toLowerCase().trim()
  return dateKeywords.some(keyword => lowerName==keyword)
}
