import { MOCK_CATEGORIES } from "./mock_events";

// Helpers
export function formatDateShort(iso: string) {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString("en-KE", { weekday: "short" }).toUpperCase(),
    date: d.getDate(),
    month: d.toLocaleDateString("en-KE", { month: "short" }).toUpperCase(),
  };
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDuration(start: string, end: string) {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export const ACCENTS = [
  "#F97316",
  "#8B5CF6",
  "#0EA5E9",
  "#10B981",
  "#EC4899",
  "#F59E0B",
];

export function accentForId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++)
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return ACCENTS[Math.abs(hash) % ACCENTS.length];
}

export function categoryName(categoryId: string) {
  return MOCK_CATEGORIES.find((c) => c.id === categoryId)?.name ?? "";
}
