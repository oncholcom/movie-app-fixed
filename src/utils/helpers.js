export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

export const formatRuntime = (minutes) => {
  if (!minutes) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

export const formatRating = (rating) => {
  return rating ? rating.toFixed(1) : '0.0';
};

export const formatCurrency = (amount) => {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
};

export const truncateText = (text, maxLength = 150) => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

export const getGenreNames = (genres) => {
  if (!genres || !Array.isArray(genres)) return [];
  return genres.map(genre => genre.name);
};

export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// Get today's date (YYYY-MM-DD) preferring network time; fallback to device time
export async function getTodayIsoDate() {
  try {
    const response = await fetch('https://worldtimeapi.org/api/ip', { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      const iso = data?.datetime?.slice(0, 10);
      if (iso) return iso;
    }
  } catch (_) {
    // ignore and fallback
  }
  try {
    return new Date().toISOString().slice(0, 10);
  } catch (_) {
    return '2099-12-31';
  }
}

// Date helpers for recent-month filtering
export function getMonthRanges(todayIso) {
  const d = todayIso ? new Date(todayIso) : new Date()
  const year = d.getFullYear()
  const month = d.getMonth() // 0-based
  const startThis = new Date(year, month, 1)
  const endThis = new Date(year, month + 1, 0)
  const prevMonth = new Date(year, month - 1, 1)
  const startPrev = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1)
  const endPrev = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0)
  return {
    thisMonth: [startThis, endThis],
    prevMonth: [startPrev, endPrev],
  }
}

export function isWithinMonthRanges(dateIso, ranges) {
  if (!dateIso) return false
  const d = new Date(dateIso)
  const within = (range) => d >= range[0] && d <= range[1]
  return within(ranges.thisMonth) || within(ranges.prevMonth)
}

export function dayOfYearFromIso(todayIso) {
  const d = todayIso ? new Date(todayIso) : new Date()
  const start = new Date(d.getFullYear(), 0, 0)
  const diff = d - start
  const oneDay = 1000 * 60 * 60 * 24
  return Math.floor(diff / oneDay)
}
