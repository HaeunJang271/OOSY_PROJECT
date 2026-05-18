import { Suspense } from "react";
import { SearchPageContent } from "@/components/SearchPageContent";

export default function SearchPage() {
  return (
    <div className="page-shell">
      <div className="page-header">
        <h1 className="page-title">검색</h1>
        <p className="page-lead">제목·본문에서 글을 찾습니다.</p>
      </div>
      <Suspense fallback={<p className="text-[15px] text-[color:var(--text-tertiary)]">불러오는 중…</p>}>
        <SearchPageContent />
      </Suspense>
    </div>
  );
}
