import { Suspense } from "react";
import { HomePosts } from "@/components/HomePosts";

export default function HomePage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl flex-1 px-4 py-8">
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] leading-[1.14] text-[#1d1d1f]">
          학교 밖 청소년<br />정보·강좌
        </h1>
        <p className="mt-3 text-[15px] leading-[1.47] tracking-[-0.016em] text-[#1d1d1f]/60">
          짧은 글과 질문을 나누는 공간입니다.<br />
          글은 관리자 승인 후 목록에 보입니다.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-[#1d1d1f]/50">불러오는 중…</p>}>
        <HomePosts />
      </Suspense>
    </div>
  );
}
