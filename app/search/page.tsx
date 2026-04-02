import { Suspense } from "react";
import { SearchPageContent } from "@/components/SearchPageContent";

export default function SearchPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl flex-1 px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-950">검색</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-800">
          승인된 글의 제목과 본문에서 검색합니다.
        </p>
      </div>
      <Suspense
        fallback={<p className="text-sm text-neutral-700">불러오는 중…</p>}
      >
        <SearchPageContent />
      </Suspense>
    </div>
  );
}
