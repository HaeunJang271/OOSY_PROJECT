import { Suspense } from "react";
import { SearchPageContent } from "@/components/SearchPageContent";

export default function SearchPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl flex-1 px-4 py-8">
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] leading-[1.14] text-[#1d1d1f]">
          검색
        </h1>
        <p className="mt-3 text-[15px] leading-[1.47] tracking-[-0.016em] text-[#1d1d1f]/60">
          승인된 글의 제목과 본문에서 검색합니다.
        </p>
      </div>
      <Suspense fallback={<p className="text-[15px] text-[#1d1d1f]/50">불러오는 중…</p>}>
        <SearchPageContent />
      </Suspense>
    </div>
  );
}
