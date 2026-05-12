import Navbar from "./navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0C0A09] font-sans">
      {/* grain overlay */}
      <div
        className="fixed inset-0 opacity-[0.035] pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      <div
        className="fixed top-[-30%] left-[-15%] w-[70%] h-[70%] rounded-full pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(251,146,60,0.06) 0%, transparent 70%)",
        }}
      />
      <div
        className="fixed bottom-[-20%] right-[-10%] w-[55%] h-[55%] rounded-full pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(139,92,246,0.05) 0%, transparent 70%)",
        }}
      />

      <Navbar />
    </div>
  );
}
