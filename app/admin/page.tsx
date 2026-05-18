import { AdminDashboard } from "@/components/AdminDashboard";

export default function AdminPage() {
  return (
    <div className="page-shell">
      <div className="page-header">
        <h1 className="page-title">관리자</h1>
        <p className="page-lead">
          승인 대기 글을 공개하거나, 글·댓글을 삭제할 수 있습니다.
        </p>
      </div>
      <AdminDashboard />
    </div>
  );
}
