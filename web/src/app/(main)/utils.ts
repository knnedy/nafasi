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
