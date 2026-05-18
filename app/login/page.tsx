import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="page-shell">
      <div className="page-header">
        <h1 className="page-title">로그인</h1>
        <p className="page-lead">카카오 계정으로 로그인할 수 있습니다.</p>
      </div>
      <LoginForm />
    </div>
  );
}
