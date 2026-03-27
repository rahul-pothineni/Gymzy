import { Link } from "react-router-dom";
import { Dumbbell, ArrowRight, Target, Calendar, TrendingUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";

export default function Home() {
  const { user, isLoading, plan } = useAuth();

  function getCtaLink() {
    if (!user) return "/auth/sign-up";
    if (!plan) return "/onboarding";
    return "/tracker";
  }

  function getCtaText() {
    if (!user) return "Get Started";
    if (!plan) return "Set Up Your Plan";
    return "Open Tracker";
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-4 sm:px-6 pt-24 pb-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--color-card)] mb-8">
            <Dumbbell className="w-7 h-7 text-[var(--color-accent)]" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight mb-4">
            Your training,{" "}
            <span className="text-[var(--color-muted)]">simplified.</span>
          </h1>

          <p className="text-lg text-[var(--color-muted)] leading-relaxed max-w-lg mx-auto mb-10">
            AI-powered workout plans tailored to your goals. Track every set, every rep, every session — all in one place.
          </p>

          <Link to={isLoading ? "#" : getCtaLink()}>
            <Button size="lg" className="gap-2">
              {getCtaText()}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-[var(--color-border)] px-4 sm:px-6 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--color-card)] mb-4">
              <Target className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <h3 className="font-semibold tracking-tight mb-2">AI-Generated Plans</h3>
            <p className="text-sm text-[var(--color-muted)] leading-relaxed">
              Tell us your goals, experience, and schedule. Our AI builds a complete program for you.
            </p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--color-card)] mb-4">
              <Calendar className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <h3 className="font-semibold tracking-tight mb-2">Session Tracking</h3>
            <p className="text-sm text-[var(--color-muted)] leading-relaxed">
              Log weight, reps, and notes for every set. Pick up right where you left off.
            </p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--color-card)] mb-4">
              <TrendingUp className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <h3 className="font-semibold tracking-tight mb-2">Track Progress</h3>
            <p className="text-sm text-[var(--color-muted)] leading-relaxed">
              Review past sessions and see your history. Every workout saved, always accessible.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
