import { Suspense } from "react";
import { HomePosts } from "@/components/HomePosts";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-2xl flex-1 px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">
          학교 밖 청소년 정보·강좌
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          짧은 글과 질문을 나누는 공간입니다. 글은 관리자 승인 후 목록에 보입니다.
        </p>
      </div>
      <Suspense
        fallback={<p className="text-sm text-zinc-500">불러오는 중…</p>}
      >
        <HomePosts />
      </Suspense>
    </div>
  );
}
