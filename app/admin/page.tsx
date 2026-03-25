import { AdminPending } from "@/components/AdminPending";

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-2xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold text-zinc-900">승인 대기 글</h1>
      <AdminPending />
    </div>
  );
}
