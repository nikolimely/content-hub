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
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="rounded-2xl p-8 w-full max-w-sm shadow-2xl" style={{ backgroundColor: "#2a2f3f" }}>
        <div className="flex justify-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://imagely.limely.co.uk/wp-content/uploads/logo.svg"
            alt="Limely"
            style={{ height: 36, width: "auto" }}
          />
        </div>
        <h1 className="text-lg font-semibold text-center text-white mb-1">
          Content Hub
        </h1>
        <p className="text-sm text-center mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
          Enter your Limely email to sign in.
        </p>
        <LoginForm initialError={errorMsg} />
      </div>
    </div>
  );
}
