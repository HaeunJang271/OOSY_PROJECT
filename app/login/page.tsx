import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl flex-1 px-4 py-8">
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] leading-[1.14] text-[#1d1d1f]">
          로그인
        </h1>
        <p className="mt-3 text-[15px] leading-[1.47] tracking-[-0.016em] text-[#1d1d1f]/60">
          카카오 계정으로 로그인할 수 있습니다.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
