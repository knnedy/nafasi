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

export function formatPhoneNumber(phone: string): string {
  // trim and strip everything except digits and leading +
  phone = phone.trim().replace(/[^0-9+]/g, "");

  // normalize to 254XXXXXXXXX (no +)
  if (phone.startsWith("+254")) {
    phone = phone.slice(1);
  } else if (phone.startsWith("254")) {
    // already correct base
  } else if (phone.startsWith("0") && phone.length === 10) {
    phone = "254" + phone.slice(1);
  } else if (phone.length === 9) {
    phone = "254" + phone;
  } else {
    throw new Error("Invalid phone number format");
  }

  if (phone.length !== 12) {
    throw new Error("Invalid phone number length");
  }

  if (!phone.startsWith("2547") && !phone.startsWith("2541")) {
    throw new Error("Invalid Kenyan mobile prefix");
  }

  return phone;
}
