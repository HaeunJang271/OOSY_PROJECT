import Link from "next/link";
import { PostDetail } from "@/components/PostDetail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PostPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="page-shell">
      <Link
        href="/"
        className="mb-8 inline-block text-sm font-medium text-muted hover:text-foreground"
      >
        ← 목록
      </Link>
      <PostDetail postId={id} />
    </div>
  );
}
