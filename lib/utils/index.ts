import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Translation } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getTranslation(
  translation: Translation | string | undefined | null,
  locale: string = 'az'
): string {
  if (!translation) {
    return '';
  }
  
  if (typeof translation === 'string') {
    // Check if it's a JSON string
    try {
      const parsed = JSON.parse(translation);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed[locale as keyof Translation] || parsed.az || '';
      }
    } catch {
      // If it is not valid JSON, return the original text.
    }
    return translation;
  }
  
  return translation[locale as keyof Translation] || translation.az || '';
}

export function formatCurrency(amount: number, currency: string = 'AZN'): string {
  // Format number with thousands separator
  const formattedNumber = amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  // Return consistent format across server and client
  return `${formattedNumber} ₼`;
}

export function formatDate(date: string | Date, locale: string = 'az'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const localeMap: Record<string, string> = {
    az: 'az-AZ',
    en: 'en-US',
    ru: 'ru-RU',
  };

  return new Intl.DateTimeFormat(localeMap[locale] || 'az-AZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

export function formatShortDate(date: string | Date, locale: string = 'az'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const months: Record<string, string[]> = {
    az: ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avq', 'sen', 'okt', 'noy', 'dek'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    ru: ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  };

  const day = dateObj.getDate();
  const monthIndex = dateObj.getMonth();
  const year = dateObj.getFullYear();
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');

  return `${day} ${months[locale]?.[monthIndex] || months.az[monthIndex]} ${year}, ${hours}:${minutes}`;
}

export function formatShortDateOnly(date: string | Date, locale: string = 'az'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const months: Record<string, string[]> = {
    az: ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avq', 'sen', 'okt', 'noy', 'dek'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    ru: ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  };

  const day = dateObj.getDate();
  const monthIndex = dateObj.getMonth();
  const year = dateObj.getFullYear();

  return `${day} ${months[locale]?.[monthIndex] || months.az[monthIndex]} ${year}`;
}

export function calculateMonthlyPayment(
  amount: number,
  annualRate: number,
  months: number
): number {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) {
    return amount / months;
  }
  
  const payment = amount * (monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);
  
  return Math.round(payment);
}

export function getImageUrl(path: string | null | undefined): string {
  if (!path) return '/news-placeholder.svg';

  // If it's already a full URL, return as is
  if (path.startsWith('http')) return path;

  // If it includes /storage/, use it directly (Laravel storage symlink)
  if (path.startsWith('/storage/') || path.startsWith('storage/')) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${cleanPath}`;
  }

  // If it already includes /uploads/, don't add it again
  if (path.startsWith('/uploads/') || path.startsWith('uploads/')) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${cleanPath}`;
  }

  // For any other case, just prepend the base URL
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${cleanPath}`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}