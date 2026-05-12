// Types
export interface EventResponse {
  id: string;
  organiser_id: string;
  category_id: string;
  title: string;
  slug: string;
  description?: string;
  location?: string;
  venue?: string;
  banner_url?: string;
  starts_at: string;
  ends_at: string;
  status: string;
  is_online: boolean;
  online_url?: string;
  created_at: string;
  updated_at: string;
}

export interface EventCategoryResponse {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

// Mock data
export const MOCK_CATEGORIES: EventCategoryResponse[] = [
  { id: "1", name: "Music", description: "", created_at: "", updated_at: "" },
  {
    id: "2",
    name: "Conference",
    description: "",
    created_at: "",
    updated_at: "",
  },
  { id: "3", name: "Comedy", description: "", created_at: "", updated_at: "" },
  { id: "4", name: "Sports", description: "", created_at: "", updated_at: "" },
  { id: "5", name: "Arts", description: "", created_at: "", updated_at: "" },
];

export const MOCK_PUBLISHED: EventResponse[] = [
  {
    id: "1",
    organiser_id: "o1",
    category_id: "1",
    title: "Afropunk Nairobi 2026",
    slug: "afropunk-nairobi-2026",
    description:
      "The biggest Afropunk festival hits Nairobi with a lineup of world-class artists celebrating African culture and music.",
    location: "Nairobi",
    venue: "Uhuru Gardens",
    banner_url: "",
    starts_at: "2026-06-14T18:00:00Z",
    ends_at: "2026-06-14T23:00:00Z",
    status: "PUBLISHED",
    is_online: false,
    created_at: "",
    updated_at: "",
  },
  {
    id: "2",
    organiser_id: "o2",
    category_id: "2",
    title: "Tech Summit East Africa",
    slug: "tech-summit-east-africa",
    description:
      "East Africa's premier technology conference bringing together innovators, founders, and investors from across the continent.",
    location: "Nairobi",
    venue: "KICC, Nairobi",
    banner_url: "",
    starts_at: "2026-06-25T08:00:00Z",
    ends_at: "2026-06-25T18:00:00Z",
    status: "PUBLISHED",
    is_online: false,
    created_at: "",
    updated_at: "",
  },
  {
    id: "3",
    organiser_id: "o3",
    category_id: "1",
    title: "Nairobi Jazz Festival",
    slug: "nairobi-jazz-festival",
    description:
      "Three days of world-class jazz performances featuring local legends and international artists at the iconic Village Market.",
    location: "Nairobi",
    venue: "Village Market",
    banner_url: "",
    starts_at: "2026-07-04T17:00:00Z",
    ends_at: "2026-07-06T22:00:00Z",
    status: "PUBLISHED",
    is_online: false,
    created_at: "",
    updated_at: "",
  },
  {
    id: "4",
    organiser_id: "o4",
    category_id: "3",
    title: "Churchill Show Live",
    slug: "churchill-show-live",
    description:
      "Kenya's most popular comedy show returns live with a star-studded cast of the country's funniest comedians.",
    location: "Nairobi",
    venue: "Carnivore Grounds",
    banner_url: "",
    starts_at: "2026-06-20T19:00:00Z",
    ends_at: "2026-06-20T22:00:00Z",
    status: "PUBLISHED",
    is_online: false,
    created_at: "",
    updated_at: "",
  },
  {
    id: "5",
    organiser_id: "o5",
    category_id: "2",
    title: "Women in Tech Kenya",
    slug: "women-in-tech-kenya",
    description:
      "A full-day conference celebrating and empowering women in technology across Kenya and East Africa.",
    location: "Nairobi",
    venue: "Radisson Blu Hotel",
    banner_url: "",
    starts_at: "2026-07-10T09:00:00Z",
    ends_at: "2026-07-10T17:00:00Z",
    status: "PUBLISHED",
    is_online: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "6",
    organiser_id: "o6",
    category_id: "5",
    title: "Nairobi Design Week",
    slug: "nairobi-design-week",
    description:
      "A celebration of African design, art and creativity featuring exhibitions, workshops and talks from leading creatives.",
    location: "Nairobi",
    venue: "The Alchemist",
    banner_url: "",
    starts_at: "2026-07-15T10:00:00Z",
    ends_at: "2026-07-20T20:00:00Z",
    status: "PUBLISHED",
    is_online: false,
    created_at: "",
    updated_at: "",
  },
];

export const MOCK_UPCOMING: EventResponse[] = [
  {
    id: "7",
    organiser_id: "o7",
    category_id: "4",
    title: "Nairobi City Marathon",
    slug: "nairobi-city-marathon",
    description: "",
    location: "Nairobi",
    venue: "Uhuru Highway",
    banner_url: "",
    starts_at: "2026-08-02T06:00:00Z",
    ends_at: "2026-08-02T14:00:00Z",
    status: "PUBLISHED",
    is_online: false,
    created_at: "",
    updated_at: "",
  },
  {
    id: "8",
    organiser_id: "o8",
    category_id: "1",
    title: "Blankets & Wine",
    slug: "blankets-and-wine",
    description: "",
    location: "Nairobi",
    venue: "Ngong Racecourse",
    banner_url: "",
    starts_at: "2026-08-09T14:00:00Z",
    ends_at: "2026-08-09T21:00:00Z",
    status: "PUBLISHED",
    is_online: false,
    created_at: "",
    updated_at: "",
  },
  {
    id: "9",
    organiser_id: "o9",
    category_id: "2",
    title: "Africa Fintech Summit",
    slug: "africa-fintech-summit",
    description: "",
    location: "Nairobi",
    venue: "Sarit Expo Centre",
    banner_url: "",
    starts_at: "2026-08-18T08:00:00Z",
    ends_at: "2026-08-19T18:00:00Z",
    status: "PUBLISHED",
    is_online: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "10",
    organiser_id: "o10",
    category_id: "3",
    title: "Laugh Festival Nairobi",
    slug: "laugh-festival-nairobi",
    description: "",
    location: "Nairobi",
    venue: "Kenya National Theatre",
    banner_url: "",
    starts_at: "2026-09-05T19:00:00Z",
    ends_at: "2026-09-05T22:00:00Z",
    status: "PUBLISHED",
    is_online: false,
    created_at: "",
    updated_at: "",
  },
  {
    id: "11",
    organiser_id: "o11",
    category_id: "1",
    title: "Coke Studio Africa Live",
    slug: "coke-studio-africa-live",
    description: "",
    location: "Nairobi",
    venue: "Kasarani Stadium",
    banner_url: "",
    starts_at: "2026-09-12T17:00:00Z",
    ends_at: "2026-09-12T23:00:00Z",
    status: "PUBLISHED",
    is_online: false,
    created_at: "",
    updated_at: "",
  },
  {
    id: "12",
    organiser_id: "o12",
    category_id: "5",
    title: "Nairobi Film Festival",
    slug: "nairobi-film-festival",
    description: "",
    location: "Nairobi",
    venue: "20th Century Fox Cinema",
    banner_url: "",
    starts_at: "2026-09-20T10:00:00Z",
    ends_at: "2026-09-25T22:00:00Z",
    status: "PUBLISHED",
    is_online: false,
    created_at: "",
    updated_at: "",
  },
];
