"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}`,
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the login link.");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#050505] text-[#E7D6C2] px-6">

      <div className="w-full max-w-sm space-y-8">

        {/* HEADER */}
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-serif tracking-wide">
            Musashi
          </h1>
          <p className="text-xs text-zinc-500 font-mono">
            Enter the dojo
          </p>
        </div>

        {/* FORM */}
        <div className="space-y-4">

          <input
            className="
              w-full px-4 py-3
              bg-transparent
              border border-white/10
              text-sm
              outline-none
              focus:border-red-900/60
              transition
            "
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            className="
              w-full py-3
              bg-red-900/80
              hover:bg-red-900
              transition
              text-sm
              font-medium
              text-white
              tracking-wide
            "
          >
            {loading ? "Sending link..." : "Send login link"}
          </button>

          {message && (
            <p className="text-xs text-zinc-500 text-center">
              {message}
            </p>
          )}

        </div>

        {/* FOOTER NOTE */}
        <p className="text-[10px] text-zinc-600 text-center leading-relaxed">
          A quiet system for deliberate practice.
        </p>

      </div>
    </main>
  );
}