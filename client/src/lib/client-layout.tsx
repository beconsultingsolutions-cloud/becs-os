import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  MessagesSquare,
  FolderOpen,
  GraduationCap,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const portalNav = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/projects", label: "Projects", icon: Briefcase },
  { href: "/portal/messages", label: "Messages", icon: MessagesSquare },
  { href: "/portal/documents", label: "Documents", icon: FolderOpen },
  { href: "/portal/learn", label: "Program", icon: GraduationCap },
];

/** Lighter, marketing-style header shared across the client portal. */
export function ClientHeader({ showNav = true }: { showNav?: boolean }) {
  const [location] = useLocation();
  const { becsUser, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href={becsUser ? "/portal" : "/intake"}>
          <a className="flex items-center gap-2.5" data-testid="portal-logo">
            <svg viewBox="0 0 32 32" width="28" height="28" fill="none" aria-label="BECS">
              <rect width="32" height="32" rx="8" fill="hsl(83,60%,57%)" />
              <text
                x="4"
                y="22"
                fontFamily="'Cabinet Grotesk', sans-serif"
                fontWeight="800"
                fontSize="16"
                fill="hsl(232,45%,18%)"
              >
                BE
              </text>
            </svg>
            <div className="leading-none">
              <div className="font-bold text-sm text-slate-900 tracking-wide">
                BE Consulting
              </div>
              <div className="text-slate-500 text-[10px] mt-0.5">Plan. Evolve. Succeed.</div>
            </div>
          </a>
        </Link>

        {/* Desktop nav */}
        {showNav && becsUser && (
          <nav className="hidden md:flex items-center gap-1">
            {portalNav.map(({ href, label, icon: Icon }) => {
              const active = href === "/portal" ? location === "/portal" : location.startsWith(href);
              return (
                <Link key={href} href={href}>
                  <a
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      active
                        ? "text-[hsl(232,45%,18%)] bg-[hsl(83,60%,57%)]/15"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    )}
                    data-testid={`portal-nav-${label.toLowerCase()}`}
                  >
                    <Icon size={15} />
                    {label}
                  </a>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {becsUser ? (
            <>
              <div className="hidden sm:block text-right">
                <div className="text-xs font-semibold text-slate-900 leading-tight">
                  {becsUser.displayName}
                </div>
                <div className="text-[10px] text-slate-500">{becsUser.email}</div>
              </div>
              <button
                onClick={signOut}
                className="p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Sign out"
                data-testid="portal-signout"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link href="/login">
              <a className="text-sm font-medium text-slate-700 hover:text-slate-900" data-testid="portal-signin-link">
                Sign in
              </a>
            </Link>
          )}

          {/* Mobile menu toggle */}
          {showNav && becsUser && (
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      {showNav && becsUser && mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <nav className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1">
            {portalNav.map(({ href, label, icon: Icon }) => {
              const active = href === "/portal" ? location === "/portal" : location.startsWith(href);
              return (
                <Link key={href} href={href}>
                  <a
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium",
                      active
                        ? "text-[hsl(232,45%,18%)] bg-[hsl(83,60%,57%)]/15"
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    <Icon size={16} />
                    {label}
                  </a>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}

/** Full-width footer for public (intake / proposal review) pages. */
export function ClientFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>© {new Date().getFullYear()} BE Consulting Solutions</div>
        <div className="flex items-center gap-4">
          <a href="mailto:beconsultingsolutions@gmail.com" className="hover:text-slate-900">
            beconsultingsolutions@gmail.com
          </a>
        </div>
      </div>
    </footer>
  );
}

/** Wraps a public (no-auth) page with the marketing-style layout. */
export function PublicPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <ClientHeader showNav={false} />
      <main className="flex-1">{children}</main>
      <ClientFooter />
    </div>
  );
}

/** Wraps an authenticated portal page with the nav-enabled header. */
export function PortalPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <ClientHeader showNav />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 lg:px-6 py-6 lg:py-8">
        {children}
      </main>
      <ClientFooter />
    </div>
  );
}
