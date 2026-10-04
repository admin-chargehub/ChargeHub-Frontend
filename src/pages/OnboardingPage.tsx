import { Link, Navigate } from "react-router-dom";

import { BoltIcon } from "@/components/icons";
import SplashScreen from "@/components/SplashScreen";
import { useAuth } from "@/auth/AuthContext";

export default function OnboardingPage() {
  const { user, loading } = useAuth();

  if (loading) return <SplashScreen />;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="screen onboard">
      <div className="onboard-art" aria-hidden="true">
        <BoltIcon />
      </div>

      <div className="onboard-copy">
        <h1>Power when you need it</h1>
        <p className="muted">Book smart outlets at charging hubs near you.</p>
      </div>

      <div className="stack">
        <Link to="/login?new=1" className="btn btn-primary btn-block">
          Get Started
        </Link>
        <Link to="/login" className="btn btn-ghost btn-block">
          Log In
        </Link>
      </div>
    </div>
  );
}
