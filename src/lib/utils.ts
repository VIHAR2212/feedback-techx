import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Escape a single value for RFC-4180-compliant CSV output: quotes the cell
// whenever it contains a comma, quote, or newline, and doubles any quotes.
export function csvCell(value: unknown): string {
  const str = String(value ?? "");
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}
