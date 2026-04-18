import { Link } from "wouter";
import { PublicPageShell } from "@/lib/client-layout";
import { Button } from "@/components/ui/button";
import {
  Target,
  Sparkles,
  Rocket,
  ArrowRight,
  CheckCircle2,
  Briefcase,
  Users,
  TrendingUp,
} from "lucide-react";

const services = [
  {
    icon: Target,
    title: "P.E.S. Reality Check",
    description:
      "A 90-minute deep dive into where you are, what's working, and the biggest lever you should pull next.",
  },
  {
    icon: Sparkles,
    title: "Foundation Builder",
    description:
      "Get the legal, operational, and brand basics in place so you can grow without breaking later.",
  },
  {
    icon: Rocket,
    title: "P.E.S. Business Launch",
    description:
      "A guided 60-day launch track: entity + compliance, brand identity, offer design, and go-to-market.",
  },
  {
    icon: Briefcase,
    title: "B.E. Accelerator",
    description:
      "A 6-month accelerator for operators ready to scale — strategy, systems, hiring, and execution.",
  },
];

const stats = [
  { label: "Years of operating experience", value: "10+" },
  { label: "Service lines delivered", value: "9" },
  { label: "Client success rate", value: "98%" },
];

export default function IntakeLandingPage() {
  return (
    <PublicPageShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-[hsl(83,60%,57%)]/5" aria-hidden />
        <div className="relative max-w-6xl mx-auto px-4 lg:px-6 py-16 lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[hsl(83,60%,57%)]/15 text-[hsl(232,45%,18%)] text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full">
              <Sparkles size={12} /> Now accepting new engagements
            </div>
            <h1 className="mt-6 text-4xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
              Build a business that can
              <span className="block text-[hsl(232,45%,18%)]">
                actually run without you.
              </span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-2xl leading-relaxed">
              BE Consulting Solutions helps founders and operators plan, evolve, and succeed —
              turning scattered ideas into compliant, profitable, scalable operations.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/intake/form">
                <a>
                  <Button
                    size="lg"
                    className="bg-[hsl(232,45%,18%)] hover:bg-[hsl(232,45%,12%)] text-white px-6 h-12 text-base font-semibold"
                    data-testid="hero-cta-start"
                  >
                    Start your intake
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </a>
              </Link>
              <a href="#services">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-300 h-12 px-6 text-base font-semibold"
                >
                  Explore services
                </Button>
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-2xl">
            {stats.map((s) => (
              <div key={s.label} className="border-l-2 border-[hsl(83,60%,57%)] pl-4">
                <div className="text-3xl lg:text-4xl font-bold text-slate-900">{s.value}</div>
                <div className="text-xs text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-16 lg:py-20 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-xs font-semibold uppercase tracking-wider text-[hsl(83,60%,45%)]">
              Our services
            </div>
            <h2 className="mt-2 text-3xl lg:text-4xl font-bold text-slate-900">
              Pick the path that fits your stage.
            </h2>
            <p className="mt-4 text-slate-600">
              From a one-session reality check to a six-month accelerator, every engagement is built
              around the P.E.S. framework: Plan. Evolve. Succeed.
            </p>
          </div>

          <div className="mt-12 grid sm:grid-cols-2 gap-5">
            {services.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group p-6 bg-slate-50 border border-slate-200 rounded-xl hover:shadow-md hover:border-[hsl(83,60%,57%)] transition-all"
              >
                <div className="w-11 h-11 rounded-lg bg-[hsl(232,45%,18%)] text-[hsl(83,60%,57%)] flex items-center justify-center mb-4">
                  <Icon size={20} />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">{title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 lg:py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 lg:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-xs font-semibold uppercase tracking-wider text-[hsl(83,60%,45%)]">
              How it works
            </div>
            <h2 className="mt-2 text-3xl lg:text-4xl font-bold text-slate-900">
              Four steps from intake to impact.
            </h2>
          </div>

          <ol className="mt-12 grid md:grid-cols-4 gap-5 text-sm">
            {[
              { step: "01", title: "Share your goals", body: "Complete a short intake so we understand your stage, goals, and constraints." },
              { step: "02", title: "Book a consult", body: "Pick a time for a free 30-minute consult with Brandon." },
              { step: "03", title: "Review your proposal", body: "Receive a tiered proposal you can review, question, and accept online." },
              { step: "04", title: "Kick off the work", body: "Get access to your portal with projects, messages, and your program." },
            ].map((it) => (
              <li key={it.step} className="relative p-5 bg-white rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-[hsl(83,60%,45%)]">{it.step}</div>
                <div className="mt-2 font-bold text-slate-900">{it.title}</div>
                <p className="mt-2 text-slate-600 leading-relaxed">{it.body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-12 text-center">
            <Link href="/intake/form">
              <a>
                <Button
                  size="lg"
                  className="bg-[hsl(83,60%,57%)] hover:bg-[hsl(83,60%,50%)] text-[hsl(232,45%,18%)] font-semibold px-6 h-12"
                  data-testid="how-it-works-cta"
                >
                  Begin your intake
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </a>
            </Link>
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="py-16 lg:py-20 bg-[hsl(232,45%,18%)] text-white">
        <div className="max-w-5xl mx-auto px-4 lg:px-6 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[hsl(83,60%,57%)]">
              Why BECS
            </div>
            <h2 className="mt-2 text-3xl lg:text-4xl font-bold">Operators who've built it, not just advised it.</h2>
            <p className="mt-4 text-white/70 leading-relaxed">
              We aren't a traditional consultancy. We're operators who have built companies across
              beauty, hospitality, and B2B services — so our recommendations come from lived
              experience, not a textbook.
            </p>
          </div>
          <ul className="space-y-4">
            {[
              "Direct access to principal — no junior hand-offs",
              "Proprietary P.E.S. framework for every engagement",
              "Transparent milestones and weekly recaps",
              "Client portal: projects, messages, docs, and curriculum in one place",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-[hsl(83,60%,57%)] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-white/90">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 lg:py-20 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 lg:px-6 text-center">
          <Users className="mx-auto text-[hsl(83,60%,57%)]" size={40} />
          <h2 className="mt-4 text-3xl lg:text-4xl font-bold text-slate-900">
            Let's see if we're a fit.
          </h2>
          <p className="mt-4 text-slate-600">
            Share a bit about your business and we'll get back within one business day to schedule
            your free consult.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/intake/form">
              <a>
                <Button
                  size="lg"
                  className="bg-[hsl(232,45%,18%)] hover:bg-[hsl(232,45%,12%)] text-white px-8 h-12 text-base font-semibold"
                  data-testid="final-cta"
                >
                  <TrendingUp size={16} className="mr-2" />
                  Start your intake
                </Button>
              </a>
            </Link>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
