import type { Metadata } from "next";

const fallback: Metadata = {
  title: "Event",
  description: "Book tickets and get details for this event on NAFASI.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/slug/${slug}`,
      { next: { revalidate: 120 } },
    );

    if (!res.ok) return fallback;

    const json = await res.json();
    const event = json.data;

    if (!event) return fallback;

    return {
      title: event.title,
      description:
        event.description ?? `Book tickets for ${event.title} on NAFASI.`,
      openGraph: {
        title: event.title,
        description:
          event.description ?? `Book tickets for ${event.title} on NAFASI.`,
        images: event.banner_url ? [event.banner_url] : [],
      },
    };
  } catch {
    return fallback;
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
