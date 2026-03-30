"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

type State = "idle" | "loading" | "sent" | "error";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState(initialError ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setState("error");
      } else {
        setState("sent");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="text-center py-2">
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-medium text-white mb-1">Check your inbox</p>
        <p className="text-xs text-white/40 leading-relaxed">
          We sent a magic link to{" "}
          <span className="text-white/70">{email}</span>.
          <br />
          It expires in 15 minutes.
        </p>
        <button
          onClick={() => { setState("idle"); setEmail(""); }}
          className="mt-5 text-xs text-white/25 hover:text-white/50 transition-colors underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="email" className="block text-xs text-white/40 mb-1.5">
          Email address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@limely.co.uk"
          required
          className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-md px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors"
        />
      </div>

      {(state === "error" || errorMsg) && (
        <p className="text-xs text-red-400 -mt-2">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={state === "loading"}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium bg-white text-black hover:bg-white/90 disabled:opacity-50 transition-colors"
      >
        {state === "loading" ? (
          <><Loader2 size={14} className="animate-spin" /> Sending…</>
        ) : (
          "Send magic link"
        )}
      </button>
    </form>
  );
}
