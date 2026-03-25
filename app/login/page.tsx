import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md flex-1 px-4 py-10">
      <h1 className="mb-6 text-xl font-semibold text-zinc-900">로그인</h1>
      <LoginForm />
    </div>
  );
}
