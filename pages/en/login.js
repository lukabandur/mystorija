import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabase";

const C = {
  accent: "#C4622D", accentBg: "#FFF0E8", text: "#1A1A1A",
  muted: "#888", bg: "#F8F5F0", card: "#FFFFFF", border: "#EDE8DF",
  green: "#3A7A56", greenBg: "#EDF5F1",
};

export default function LoginEN() {
  const router = useRouter();
  const [mode, setMode] = useState("login"); // login | signup | reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function handleSubmit() {
    setLoading(true); setError(null); setSuccess(null);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      router.push("/en/app");

    } else if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: "https://mystorija.com/en/app" }
      });
      if (error) { setError(error.message); setLoading(false); return; }
      setSuccess("Confirmation email sent! Please check your inbox.");

    } else if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://mystorija.com/en/login?mode=newpassword"
      });
      if (error) { setError(error.message); setLoading(false); return; }
      setSuccess("Password reset email sent!");
    }
    setLoading(false);
  }

  return (
    <>
      <Head>
        <title>Sign In – Mystorija</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: ${C.bg}; color: ${C.text}; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        input { outline: none; }
        input:focus { border-color: ${C.accent} !important; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <a href="/en" style={{ textDecoration: "none" }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: C.text }}>
              My<span style={{ color: C.accent }}>storija</span>
            </span>
          </a>
          <p style={{ fontSize: 14, color: C.muted, marginTop: 6 }}>AI renovation for your home</p>
        </div>

        {/* Card */}
        <div style={{ background: C.card, borderRadius: 20, padding: 32, border: `1px solid ${C.border}`, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 6 }}>
            {mode === "login" ? "Welcome back" : mode === "signup" ? "Create account" : "Reset password"}
          </h2>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>
            {mode === "login" ? "Sign in to continue" : mode === "signup" ? "Create your Mystorija account" : "We'll send you a reset link"}
          </p>

          {/* Error / Success */}
          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#B91C1C" }}>
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div style={{ background: C.greenBg, border: `1px solid ${C.green}33`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: C.green }}>
              ✅ {success}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>EMAIL</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 15, fontFamily: "'DM Sans', sans-serif", background: C.bg }}
            />
          </div>

          {/* Password */}
          {mode !== "reset" && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>PASSWORD</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 15, fontFamily: "'DM Sans', sans-serif", background: C.bg }}
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit} disabled={loading}
            style={{ width: "100%", padding: 14, borderRadius: 50, border: "none", background: loading ? "#DDD" : C.accent, color: "white", fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer", fontFamily: "'DM Sans', sans-serif", marginBottom: 16 }}
          >
            {loading ? "Loading..." : mode === "login" ? "Sign in →" : mode === "signup" ? "Create account →" : "Send reset link →"}
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 12, color: C.muted }}>or</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          {/* Mode switches */}
          {mode === "login" && (
            <div style={{ textAlign: "center" }}>
              <button onClick={() => { setMode("signup"); setError(null); setSuccess(null); }} style={{ background: "none", border: "none", color: C.accent, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                No account yet? Register now
              </button>
              <br />
              <button onClick={() => { setMode("reset"); setError(null); setSuccess(null); }} style={{ background: "none", border: "none", color: C.muted, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 8 }}>
                Forgot password?
              </button>
            </div>
          )}
          {mode === "signup" && (
            <div style={{ textAlign: "center" }}>
              <button onClick={() => { setMode("login"); setError(null); setSuccess(null); }} style={{ background: "none", border: "none", color: C.accent, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                Already have an account? Sign in
              </button>
            </div>
          )}
          {mode === "reset" && (
            <div style={{ textAlign: "center" }}>
              <button onClick={() => { setMode("login"); setError(null); setSuccess(null); }} style={{ background: "none", border: "none", color: C.accent, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                ← Back to sign in
              </button>
            </div>
          )}
        </div>

        {/* Guest link */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <a href="/en/app" style={{ fontSize: 13, color: C.muted, textDecoration: "none" }}>
            Continue without account (limited) →
          </a>
        </div>
      </div>
    </>
  );
}
