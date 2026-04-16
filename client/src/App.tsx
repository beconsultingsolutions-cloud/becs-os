import { Switch, Route, Router, Link, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { EntityProvider, useEntity } from "@/lib/entity-context";
import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import LeadsPage from "@/pages/leads";
import ClientsPage from "@/pages/clients";
import ClientDetailPage from "@/pages/client-detail";
import ProjectsPage from "@/pages/projects";
import MeetingsPage from "@/pages/meetings";
import ProposalsPage from "@/pages/proposals";
import LegalPage from "@/pages/legal";
import RecapsPage from "@/pages/recaps";
import AutomationPage from "@/pages/automation";
import NotFound from "@/pages/not-found";
import { ENTITY_LABELS, type EntityId } from "@shared/schema";

import {
  LayoutDashboard, Users, UserCheck, Briefcase, CalendarDays,
  FileText, Scale, BookOpen, Zap, Menu, X, ChevronRight,
  TrendingUp, LogOut, ChevronDown, Building2, Check, Loader2,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: TrendingUp },
  { href: "/clients", label: "Clients", icon: UserCheck },
  { href: "/projects", label: "Projects", icon: Briefcase },
  { href: "/meetings", label: "Meetings", icon: CalendarDays },
  { href: "/proposals", label: "Proposals", icon: FileText },
  { href: "/legal", label: "Legal & Docs", icon: Scale },
  { href: "/recaps", label: "Recaps", icon: BookOpen },
  { href: "/automation", label: "Automation Log", icon: Zap },
];

// ─── Unauthorized Screen ────────────────────────────────────────────────────
function UnauthorizedScreen({ email }: { email: string }) {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(232,45%,12%)] p-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <svg viewBox="0 0 48 48" width="48" height="48" fill="none" aria-label="BECS OS" className="mx-auto">
          <rect width="48" height="48" rx="12" fill="hsl(83,60%,57%)" />
          <text x="6" y="33" fontFamily="'Cabinet Grotesk', sans-serif" fontWeight="800" fontSize="24" fill="hsl(232,45%,18%)">BE</text>
        </svg>
        <div>
          <h1 className="text-xl font-bold text-white">Access Denied</h1>
          <p className="text-white/50 text-sm mt-2">
            <span className="text-white/70 font-medium">{email}</span> is not authorized for BECS OS.
          </p>
          <p className="text-white/40 text-xs mt-1">Contact your administrator to request access.</p>
        </div>
        <button
          onClick={signOut}
          className="text-sm text-white/50 hover:text-white underline underline-offset-2 transition-colors"
          data-testid="button-signout-unauthorized"
        >
          Sign out and try a different account
        </button>
      </div>
    </div>
  );
}

// ─── Entity Switcher ─────────────────────────────────────────────────────────
function EntitySwitcher() {
  const { currentEntity, setCurrentEntity, availableEntities } = useEntity();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (availableEntities.length <= 1) {
    return (
      <div className="mx-3 mb-3 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center gap-2">
          <Building2 size={14} className="text-[hsl(83,60%,57%)]" />
          <span className="text-sm font-semibold text-white">
            {ENTITY_LABELS[currentEntity]}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="mx-3 mb-3 relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        data-testid="entity-switcher"
      >
        <div className="flex items-center gap-2">
          <Building2 size={14} className="text-[hsl(83,60%,57%)]" />
          <span className="text-sm font-semibold text-white">
            {ENTITY_LABELS[currentEntity]}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={cn("text-white/50 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 rounded-lg bg-[hsl(232,45%,22%)] border border-white/10 shadow-xl z-50 overflow-hidden">
          {availableEntities.map((eid) => (
            <button
              key={eid}
              onClick={() => {
                setCurrentEntity(eid as EntityId);
                setOpen(false);
                // Invalidate all queries so they re-fetch with the new entity
                queryClient.invalidateQueries();
              }}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors",
                eid === currentEntity
                  ? "bg-[hsl(83,60%,57%)]/10 text-[hsl(83,60%,57%)]"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
              data-testid={`entity-option-${eid}`}
            >
              <span className="font-medium">{ENTITY_LABELS[eid as EntityId]}</span>
              {eid === currentEntity && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [location] = useLocation();
  const { becsUser, signOut } = useAuth();

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 z-50 flex flex-col",
          "bg-[hsl(232,45%,18%)] text-white",
          "transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 32 32" width="32" height="32" fill="none" aria-label="BECS OS">
              <rect width="32" height="32" rx="8" fill="hsl(83,60%,57%)" />
              <text x="4" y="22" fontFamily="'Cabinet Grotesk', sans-serif" fontWeight="800" fontSize="16" fill="hsl(232,45%,18%)">BE</text>
            </svg>
            <div>
              <div className="font-bold text-sm leading-none tracking-wide">BECS OS</div>
              <div className="text-white/50 text-xs mt-0.5">Plan. Evolve. Succeed.</div>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/60 hover:text-white" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        {/* Entity Switcher */}
        <div className="pt-4">
          <EntitySwitcher />
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          <div className="px-3 mb-2">
            <span className="text-white/30 text-xs uppercase tracking-widest font-semibold px-3">Operations</span>
          </div>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 mx-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-all",
                  active
                    ? "bg-[hsl(83,60%,57%)] text-[hsl(232,45%,18%)]"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
                data-testid={`nav-${label.toLowerCase().replace(/\s/g, "-")}`}
              >
                <Icon size={16} />
                {label}
                {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom — User info + Sign out */}
        <div className="px-4 py-4 border-t border-white/10">
          {becsUser ? (
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-white/80 text-xs font-medium truncate">
                  {becsUser.displayName}
                </div>
                <div className="text-white/30 text-xs truncate">{becsUser.email}</div>
              </div>
              <button
                onClick={signOut}
                className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                aria-label="Sign out"
                data-testid="button-signout"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div>
              <div className="text-white/40 text-xs">BE Consulting Solutions</div>
              <div className="text-white/20 text-xs mt-0.5">beconsultingsolutions@gmail.com</div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

// ─── Layout ──────────────────────────────────────────────────────────────────
function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { becsUser } = useAuth();
  const { entityLabel } = useEntity();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border px-4 lg:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-md hover:bg-muted text-muted-foreground"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">{entityLabel}</span>
            <span className="text-muted-foreground/30">|</span>
            <span className="text-xs text-muted-foreground">Admin Console</span>
          </div>
          <div className="flex items-center gap-3">
            {becsUser && (
              <span className="text-xs text-muted-foreground hidden sm:block">
                {becsUser.displayName}
              </span>
            )}
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
              {becsUser?.displayName?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "BE"}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

// ─── Auth Guard ──────────────────────────────────────────────────────────────
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, becsUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // Not logged in at all — show login page
  if (!session) {
    return <LoginPage />;
  }

  // Logged in via Google but no BECS user record — unauthorized
  if (!becsUser) {
    return <UnauthorizedScreen email={session.user.email || ""} />;
  }

  return <>{children}</>;
}

// ─── App ─────────────────────────────────────────────────────────────────────
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router hook={useHashLocation}>
        <AuthProvider>
          <AuthGuard>
            <EntityProvider>
              <Layout>
                <Switch>
                  <Route path="/" component={Dashboard} />
                  <Route path="/leads" component={LeadsPage} />
                  <Route path="/clients" component={ClientsPage} />
                  <Route path="/clients/:id" component={ClientDetailPage} />
                  <Route path="/projects" component={ProjectsPage} />
                  <Route path="/meetings" component={MeetingsPage} />
                  <Route path="/proposals" component={ProposalsPage} />
                  <Route path="/legal" component={LegalPage} />
                  <Route path="/recaps" component={RecapsPage} />
                  <Route path="/automation" component={AutomationPage} />
                  <Route component={NotFound} />
                </Switch>
              </Layout>
            </EntityProvider>
          </AuthGuard>
        </AuthProvider>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
