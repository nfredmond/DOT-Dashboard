import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges class names using clsx and tailwind-merge
 * Useful for combining conditional class names with tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date into a localized string
 * Accepts date options for customized formatting
 */
export function formatDate(date: Date | string, options: Intl.DateTimeFormatOptions = {}) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  return dateObj.toLocaleDateString(undefined, { ...defaultOptions, ...options });
}

/**
 * Format a date object or ISO string as a datetime with time.
 */
export function formatDateTime(input: string | Date): string {
  const date = input instanceof Date ? input : new Date(input);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats a currency value
 */
export function formatCurrency(amount: number, options: Intl.NumberFormatOptions = {}) {
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  };
  
  return new Intl.NumberFormat(undefined, { ...defaultOptions, ...options }).format(amount);
}

/**
 * Truncates text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Debounces a function call
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  ms = 300
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return function(...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Gets initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Generates a random color based on a string
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 40%)`;
}

/**
 * Format a number with commas and optional decimal places
 */
export function formatNumber(value: number, decimals = 0): string {
  if (value === undefined || value === null) return '';
  
  // Format with commas and correct decimal places
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Format a number as a percentage with optional decimal places
 */
export function formatPercentage(value: number, decimals = 1): string {
  if (value === undefined || value === null) return '';
  
  // Format with correct decimal places
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    style: 'percent'
  }).format(value);
}

/**
 * Format a duration flexibly - can handle minutes or milliseconds
 * If the value is larger than 1000, it's assumed to be milliseconds
 * Otherwise, it's treated as minutes
 */
export function formatDuration(value: number): string {
  if (value === undefined || value === null) return '';
  
  // Handle milliseconds if the value is large (assume it's in ms if > 1000)
  if (value > 1000) {
    const seconds = Math.floor(value / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
  
  // Handle minutes (original behavior)
  const minutes = value;
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  
  return `${hours} hr ${remainingMinutes} min`;
}

/**
 * Format a distance in meters to a more readable format
 */
export function formatDistance(meters: number): string {
  if (meters === undefined || meters === null) return '';
  
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  
  const kilometers = meters / 1000;
  
  if (kilometers < 10) {
    // Up to 2 decimal places for short distances
    return `${kilometers.toFixed(2)} km`;
  }
  
  // Round to nearest 0.1 km for longer distances
  return `${kilometers.toFixed(1)} km`;
}

/**
 * Convert a value to title case (capitalize first letter of each word)
 */
export function toTitleCase(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
