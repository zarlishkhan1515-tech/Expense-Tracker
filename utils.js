/**
 * ApexFinance - Utility Functions Module (utils.js)
 * Demonstrating Closures, Higher-Order Functions, Arrow Functions, & Formatting helpers
 */

// Exchange rates relative to USD (Simulation)
export const EXCHANGE_RATES = {
  USD: { symbol: '$', rate: 1.0 },
  EUR: { symbol: '€', rate: 0.92 },
  GBP: { symbol: '£', rate: 0.78 },
  PKR: { symbol: 'Rs', rate: 278.50 },
  INR: { symbol: '₹', rate: 83.40 },
  CAD: { symbol: '$', rate: 1.36 }
};

/**
 * Closure-based Debounce Function (Higher-Order Function)
 * Prevents rapid execution during live search typing
 * @param {Function} fn - Function to delay
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced closure function
 */
export function debounce(fn, delay = 300) {
  let timerId = null;
  return function (...args) {
    const context = this;
    if (timerId) clearTimeout(timerId);
    timerId = setTimeout(() => {
      fn.apply(context, args);
      timerId = null;
    }, delay);
  };
}

/**
 * Closure-based Throttle Function (Higher-Order Function)
 * Limits rate of execution (e.g. scroll, window resize)
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Throttle interval in milliseconds
 * @returns {Function} Throttled closure function
 */
export function throttle(fn, limit = 200) {
  let inThrottle = false;
  return function (...args) {
    const context = this;
    if (!inThrottle) {
      fn.apply(context, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Formats a numeric amount into a localized currency string with exchange rate conversion
 * @param {number} amount - Amount in base USD
 * @param {string} currencyCode - Target currency code (USD, EUR, etc.)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currencyCode = 'USD') {
  const num = Number(amount) || 0;
  const config = EXCHANGE_RATES[currencyCode] || EXCHANGE_RATES.USD;
  const converted = num * config.rate;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode === 'PKR' || currencyCode === 'INR' ? 'USD' : currencyCode, // fallback formatting
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(converted).replace(/[A-Z]{3}/, config.symbol);
}

/**
 * Generate a unique ID using crypto.randomUUID or fallback timestamp + random string
 * @returns {string} Unique transaction ID
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'tx_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

/**
 * Formats ISO date string (YYYY-MM-DD) into readable format (e.g. Jul 24, 2026)
 * @param {string} dateString 
 * @returns {string}
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

/**
 * Returns current date in YYYY-MM-DD format for date picker inputs
 * @returns {string}
 */
export function getTodayInputDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate percentage of a part relative to total
 * @param {number} part 
 * @param {number} total 
 * @returns {number} Percentage (0 - 100)
 */
export function calculatePercentage(part, total) {
  const p = Number(part) || 0;
  const t = Number(total) || 0;
  if (t === 0) return 0;
  return Math.min(100, Math.max(0, Math.round((p / t) * 100)));
}

/**
 * Calculate average daily expense
 * @param {number} totalExpense 
 * @param {number} daysCount 
 * @returns {number}
 */
export function calculateDailyAverage(totalExpense, daysCount = 30) {
  const exp = Number(totalExpense) || 0;
  const days = Number(daysCount) || 1;
  return (exp / days).toFixed(2);
}

/**
 * Sanitize string inputs to prevent XSS attacks
 * @param {string} str 
 * @returns {string}
 */
export function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
