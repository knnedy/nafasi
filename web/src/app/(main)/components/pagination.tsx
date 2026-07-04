"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface PaginationProps {
  currentPage: number;
  hasMore: boolean;
}

export default function Pagination({ currentPage, hasMore }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Preserves existing filters (like category) while updating the page
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams],
  );

  const handlePageChange = (newPage: number) => {
    router.push(
      `${pathname}?${createQueryString("page", newPage.toString())}`,
      { scroll: true },
    );
  };

  return (
    <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/6">
      <p className="text-white/25 text-xs font-semibold">Page {currentPage}</p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-9 px-4 rounded-lg text-xs font-bold text-white/40 hover:text-white border border-white/8 hover:bg-white/4 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200">
          Prev
        </button>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={!hasMore}
          className="h-9 px-4 rounded-lg text-xs font-bold text-white/40 hover:text-white border border-white/8 hover:bg-white/4 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200">
          Next
        </button>
      </div>
    </div>
  );
}
