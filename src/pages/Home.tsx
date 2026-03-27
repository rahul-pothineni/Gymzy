import { Navigate } from "react-router-dom";
import { RefreshCcw } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, isLoading, plan } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCcw className="w-6 h-6 animate-spin text-[var(--color-muted)]" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  if (!plan) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Navigate to="/tracker" replace />;
}
