import { Ticket } from "lucide-react";

export default function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-center mb-4">
        <Ticket className="w-6 h-6 text-white/15" />
      </div>
      <p className="text-white/20 text-sm">{message}</p>
    </div>
  );
}
