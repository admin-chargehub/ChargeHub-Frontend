import { useAuth } from "@/auth/AuthContext";
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
