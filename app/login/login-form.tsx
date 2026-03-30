"use client";

import { useState } from "react";

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
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: "#A7C838" }}
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-semibold text-white mb-1">Check your inbox</p>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
          We sent a magic link to{" "}
          <span className="font-medium text-white">{email}</span>.
          <br />
          It expires in 15 minutes.
        </p>
        <button
          onClick={() => { setState("idle"); setEmail(""); }}
          className="mt-4 text-xs underline hover:opacity-80"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="email" className="block text-xs font-medium mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>
          Email address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@limely.co.uk"
          required
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors text-white"
          style={{
            backgroundColor: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        />
      </div>

      {(state === "error" || errorMsg) && (
        <p className="text-xs text-red-400 -mt-2">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={state === "loading"}
        className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        style={{ backgroundColor: "#A7C838" }}
      >
        {state === "loading" ? "Sending…" : "Send magic link"}
      </button>
    </form>
  );
}
