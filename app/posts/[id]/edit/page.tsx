"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { WritePostForm } from "@/components/WritePostForm";
import { fetchPostById } from "@/lib/posts";
import { useAuth } from "@/providers/AuthProvider";
import type { Post } from "@/lib/types";

export default function EditPostPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!id || !user) {
      if (!authLoading && !user) setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const p = await fetchPostById(id);
        if (cancelled) return;
        if (!p) {
          setError("글을 찾을 수 없습니다.");
          setPost(null);
          return;
        }
        if (p.authorId !== user.uid) {
          setError("본인이 작성한 글만 수정할 수 있습니다.");
          setPost(null);
          return;
        }
        if (p.status !== "pending") {
          setError("승인 대기 중인 글만 수정할 수 있습니다.");
          setPost(null);
          return;
        }
        setPost(p);
      } catch {
        if (!cancelled) {
          setError("불러오지 못했습니다.");
          setPost(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="page-shell">
        <p className="text-sm text-muted">불러오는 중…</p>
      </div>
    );
  }
  if (!user) {
    return null;
  }
  if (error || !post) {
    return (
      <div className="page-shell">
        <p className="text-sm text-red-600">{error ?? "글을 불러올 수 없습니다."}</p>
        <Link
          href={id ? `/posts/${id}` : "/"}
          className="link-inline mt-4 inline-block text-sm"
        >
          {id ? "글 보기" : "홈으로"}
        </Link>
      </div>
    );
  }

  return (
    <div className="page-shell pb-16">
      <Link
        href={`/posts/${id}`}
        className="mb-8 inline-block text-sm font-medium text-muted hover:text-foreground"
      >
        ← 글 보기
      </Link>
      <div className="page-header">
        <h1 className="page-title">글 수정</h1>
        <p className="page-lead">승인 대기 중인 글만 수정할 수 있습니다.</p>
      </div>
      <WritePostForm mode="edit" initialPost={post} />
    </div>
  );
}
