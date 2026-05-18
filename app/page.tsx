import { Suspense } from "react";
import { HomePosts } from "@/components/HomePosts";

export default function HomePage() {
  return (
    <div className="page-shell">
      <div className="page-header">
        <h1 className="page-title">
          학교 밖 청소년<br />정보·강좌
        </h1>
        <p className="page-lead">
          짧은 글과 질문을 나누는 공간입니다.<br />
          글은 관리자 승인 후 목록에 보입니다.
        </p>
      </div>
      <Suspense fallback={<p className="text-[15px] text-[color:var(--text-tertiary)]">불러오는 중…</p>}>
        <HomePosts />
      </Suspense>
    </div>
  );
}
