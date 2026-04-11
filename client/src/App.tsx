import { Switch, Route, Router, Link, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
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

import {
  LayoutDashboard, Users, UserCheck, Briefcase, CalendarDays,
  FileText, Scale, BookOpen, Zap, Menu, X, ChevronRight,
  TrendingUp, Settings
} from "lucide-react";
import { useState } from "react";
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

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [location] = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
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
              <rect width="32" height="32" rx="8" fill="hsl(83,60%,57%)"/>
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

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
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

        {/* Bottom */}
        <div className="px-6 py-4 border-t border-white/10">
          <div className="text-white/40 text-xs">BE Consulting Solutions</div>
          <div className="text-white/20 text-xs mt-0.5">beconsultingsolutions@gmail.com</div>
        </div>
      </aside>
    </>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border px-4 lg:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-md hover:bg-muted text-muted-foreground"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block">Admin Console</span>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
              BE
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router hook={useHashLocation}>
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
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
