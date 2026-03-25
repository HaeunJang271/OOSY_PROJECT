import Link from "next/link";
import { PostDetail } from "@/components/PostDetail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PostPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-2xl flex-1 px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-zinc-600 hover:text-zinc-900"
      >
        ← 목록
      </Link>
      <PostDetail postId={id} />
    </div>
  );
}
