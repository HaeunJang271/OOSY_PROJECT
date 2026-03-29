import { AdminDashboard } from "@/components/AdminDashboard";

export default function AdminPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl flex-1 px-4 py-8">
      <h1 className="mb-2 text-xl font-semibold text-zinc-950">관리자</h1>
      <p className="mb-6 text-sm text-zinc-800">
        승인 대기 글을 공개하거나, 글·댓글을 삭제할 수 있습니다.
      </p>
      <AdminDashboard />
    </div>
  );
}
