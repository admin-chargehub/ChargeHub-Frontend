import { type FormEvent, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";
import { homeFor } from "@/auth/home";
import AppHeader from "@/components/AppHeader";
import SplashScreen from "@/components/SplashScreen";

export default function LoginPage() {
  const { user, loading, login, register } = useAuth();
  const [params] = useSearchParams();

  // "Get Started" on onboarding links here with ?new=1.
  const [mode, setMode] = useState<"login" | "register">(
    params.get("new") === "1" ? "register" : "login",
  );
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <SplashScreen />;
  // Operators land in the console, not the customer app.
  if (user) return <Navigate to={homeFor(user)} replace />;

  const registering = mode === "register";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (registering) await register(email, fullName, password);
      else await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <AppHeader backTo="/onboarding" />

      <form className="screen auth" onSubmit={onSubmit}>
        <div className="auth-intro">
          <h1>{registering ? "Create your account" : "Welcome back"}</h1>
          <p className="muted">
            {registering
              ? "A few details and you’re set."
              : "Sign in to book an outlet."}
          </p>
        </div>

        <div className="stack">
          {registering && (
            <label className="field">
              <span>Full name</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
                autoCapitalize="words"
              />
            </label>
          )}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={registering ? "new-password" : "current-password"}
            />
          </label>

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Please wait…" : registering ? "Create account" : "Sign in"}
          </button>

          <button
            type="button"
            className="btn btn-quiet btn-block"
            onClick={() => {
              setMode(registering ? "login" : "register");
              setError(null);
            }}
          >
            {registering ? "Already have an account? Sign in" : "Need an account? Register"}
          </button>
        </div>
      </form>
    </>
  );
}
