import { Link } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";
import { isOperator } from "@/auth/home";
import { ThemeSegmented } from "@/components/ThemeToggle";
import { formatWhen } from "@/lib/format";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const initials = user.full_name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

  return (
    <div className="screen screen-tabbed">
      <h1>Profile</h1>

      <section className="card">
        <div className="row profile-head">
          <span className="avatar" aria-hidden="true">
            {initials}
          </span>
          <span className="grow">
            <span className="profile-name">{user.full_name}</span>
            <span className="muted profile-email">{user.email}</span>
          </span>
        </div>
      </section>

      {/* The only route back to the console at phone width, where the desktop
          top bar is hidden. */}
      {isOperator(user) && (
        <Link to="/ops" className="card card-link row-between ops-entry">
          <span>
            <strong>Operator console</strong>
            <span className="muted small block">
              Counter, hubs, sessions and reports
            </span>
          </span>
          <span className="pill pill-ok">{user.role}</span>
        </Link>
      )}

      <section className="card">
        <h2>Appearance</h2>
        <ThemeSegmented />
      </section>

      <section className="card">
        <dl className="deflist">
          <div className="defrow">
            <dt>Phone</dt>
            <dd>{user.phone ?? <span className="faint">Not set</span>}</dd>
          </div>
          <div className="defrow">
            <dt>Account type</dt>
            <dd style={{ textTransform: "capitalize" }}>{user.role}</dd>
          </div>
          <div className="defrow">
            <dt>Member since</dt>
            <dd>{formatWhen(user.created_at)}</dd>
          </div>
        </dl>
        {/* Editing needs PATCH /auth/me, which does not exist yet — /auth/me
            is GET-only. Showing a disabled control would be worse than none. */}
      </section>

      <button type="button" className="btn btn-danger btn-block" onClick={logout}>
        Sign out
      </button>
    </div>
  );
}
