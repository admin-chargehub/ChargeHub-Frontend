import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";
import { MobileShell, TabbedShell } from "@/components/MobileShell";
import SplashScreen from "@/components/SplashScreen";
import ActiveSessionPage from "@/pages/ActiveSessionPage";
import BookingConfirmedPage from "@/pages/BookingConfirmedPage";
import BookingsPage from "@/pages/BookingsPage";
import ConfirmBookingPage from "@/pages/ConfirmBookingPage";
import HomePage from "@/pages/HomePage";
import HubDetailPage from "@/pages/HubDetailPage";
import LoginPage from "@/pages/LoginPage";
import OnboardingPage from "@/pages/OnboardingPage";
import OpsAuditPage from "@/ops/OpsAuditPage";
import OpsDashboardPage from "@/ops/OpsDashboardPage";
import OpsReportsPage from "@/ops/OpsReportsPage";
import OpsSessionsPage from "@/ops/OpsSessionsPage";
import OpsShell from "@/ops/OpsShell";
import OpsStationDetailPage from "@/ops/OpsStationDetailPage";
import OpsStationsPage from "@/ops/OpsStationsPage";
import ProfilePage from "@/pages/ProfilePage";
import SessionEndedPage from "@/pages/SessionEndedPage";
import WalletPage from "@/pages/WalletPage";

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  // Splash is this state, not a route — see components/SplashScreen.tsx.
  if (loading) return <SplashScreen />;
  if (!user) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

/**
 * Role gate for the operator console.
 *
 * Convenience only — every /ops endpoint enforces the same rule server-side,
 * and must, because hiding a route hides nothing from anyone with a token and
 * curl. This exists so a customer who follows a link sees their own app
 * instead of a wall of failed requests.
 */
function RequireOperator({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <SplashScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "operator" && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public. Phone column, no tab bar. */}
      <Route element={<MobileShell />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* The four top-level destinations. */}
      <Route
        element={
          <RequireAuth>
            <TabbedShell />
          </RequireAuth>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Booking funnel. No tab bar: wandering off mid-checkout would leave a
          pending booking holding an outlet. */}
      <Route
        element={
          <RequireAuth>
            <MobileShell />
          </RequireAuth>
        }
      >
        <Route path="/hubs/:stationId" element={<HubDetailPage />} />
        <Route path="/book/confirm" element={<ConfirmBookingPage />} />
        <Route path="/bookings/:bookingId/confirmed" element={<BookingConfirmedPage />} />
        <Route path="/sessions/:sessionId" element={<ActiveSessionPage />} />
        <Route path="/sessions/:sessionId/ended" element={<SessionEndedPage />} />
      </Route>

      {/* Operator console. Its own shell: different navigation, different
          density, and actions that cut mains power to a socket. */}
      <Route
        path="/ops"
        element={
          <RequireOperator>
            <OpsShell />
          </RequireOperator>
        }
      >
        <Route index element={<OpsDashboardPage />} />
        <Route path="stations" element={<OpsStationsPage />} />
        <Route path="stations/:stationId" element={<OpsStationDetailPage />} />
        <Route path="sessions" element={<OpsSessionsPage />} />
        <Route path="reports" element={<OpsReportsPage />} />
        <Route path="audit" element={<OpsAuditPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
