import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in — Content Hub" };

const ERROR_MESSAGES: Record<string, string> = {
  expired: "Your magic link has expired. Please request a new one.",
  invalid: "Invalid magic link. Please request a new one.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMsg = error ? (ERROR_MESSAGES[error] ?? "Something went wrong.") : undefined;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-white tracking-tight">Content Hub</h1>
          <p className="text-sm text-white/30 mt-1">Sign in to continue</p>
        </div>
        <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6">
          <LoginForm initialError={errorMsg} />
        </div>
      </div>
    </div>
  );
}
