import Link from "next/link";
import { PostDetail } from "@/components/PostDetail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PostPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl flex-1 px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-block text-sm font-semibold text-neutral-800 hover:text-neutral-950"
      >
        ← 목록
      </Link>
      <PostDetail postId={id} />
    </div>
  );
}
