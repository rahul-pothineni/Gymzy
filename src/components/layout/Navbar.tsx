import { Dumbbell } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { UserButton } from "@neondatabase/neon-js/auth/react";

export default function Navbar() {
  const user = useAuth();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-[var(--color-foreground)]"
        >
          <Dumbbell className="w-5 h-5 text-[var(--color-accent)]" />
          <span className="font-semibold text-lg tracking-tight">Gymzy</span>
        </Link>

        <nav className="flex items-center gap-1">
          {user ? (
            <>
              <Link to="/profile" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm">My Plan</Button>
              </Link>
              <Link to="/tracker" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm">Tracker</Button>
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <Link to="/auth/sign-in">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/auth/sign-up">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
