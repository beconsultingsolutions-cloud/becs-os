/**
 * MasterDocLayout
 *
 * Visual layout for BECS legal, contract, proposal, and onboarding documents.
 * Source of truth: Notion ⚖️ Legal & Contracts canonical templates.
 *
 * Composition (top → bottom):
 *   <MasterDocLayout>
 *     <MasterDocHero ... />
 *     <MasterDocProgress sections={...} active={...} />
 *     <MasterDocSection num={1} eyebrow="..." title="...">
 *       ... children (rich body) ...
 *     </MasterDocSection>
 *     ...
 *     <MasterDocFooter />
 *   </MasterDocLayout>
 *
 * The shell ensures Bebas Neue + DM Sans + DM Mono are loaded.
 */

import { useEffect, useMemo, useState } from "react";
import "./master-doc.css";

const GOOGLE_FONT_URL =
  "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&display=swap";

function useGoogleFonts() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const ID = "becs-master-doc-fonts";
    if (document.getElementById(ID)) return;
    const link = document.createElement("link");
    link.id = ID;
    link.rel = "stylesheet";
    link.href = GOOGLE_FONT_URL;
    document.head.appendChild(link);
  }, []);
}

interface NavTab {
  id: string;
  label: string;
  onClick?: () => void;
  active?: boolean;
}

export function MasterDocLayout({
  children,
  brandLabel = "BECS",
  tabs,
}: {
  children: React.ReactNode;
  brandLabel?: string;
  tabs?: NavTab[];
}) {
  useGoogleFonts();
  return (
    <div className="becs-master-doc" data-testid="master-doc">
      <header className="md-topnav">
        <div className="md-topnav-inner">
          <div className="md-topnav-brand">
            <span className="md-topnav-brand-mark">B</span>
            <span>{brandLabel}</span>
          </div>
          {tabs && tabs.length > 0 ? (
            <nav className="md-topnav-tabs" aria-label="Document sections">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`md-topnav-tab${t.active ? " is-active" : ""}`}
                  aria-current={t.active ? "true" : undefined}
                  onClick={t.onClick}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          ) : null}
        </div>
      </header>
      {children}
    </div>
  );
}

export function MasterDocHero({
  eyebrow,
  headline,
  subline,
  meta,
  watermark = "B",
}: {
  /** Small uppercase label above the headline. */
  eyebrow?: string;
  /** Headline (may include <em>…</em> for lime highlight). */
  headline: React.ReactNode;
  subline?: React.ReactNode;
  /** Key/value pairs shown under the headline. */
  meta?: { label: string; value: React.ReactNode }[];
  watermark?: string;
}) {
  return (
    <section className="md-hero" data-testid="md-hero">
      <div className="md-hero-watermark" aria-hidden>
        {watermark}
      </div>
      <div className="md-hero-inner">
        {eyebrow ? <div className="md-hero-eyebrow">{eyebrow}</div> : null}
        <h1 className="md-hero-headline">{headline}</h1>
        {subline ? <p className="md-hero-subline">{subline}</p> : null}
        {meta && meta.length > 0 ? (
          <div className="md-hero-meta">
            {meta.map((m, i) => (
              <div key={i}>
                <b>{m.label}: </b>
                {m.value}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export interface ProgressItem {
  id: string;
  label: string;
  /** Optional jump-to handler. */
  onSelect?: () => void;
  /** Marked as complete (teal) — for read-along progress. */
  done?: boolean;
}

export function MasterDocProgress({
  items,
  activeId,
}: {
  items: ProgressItem[];
  activeId?: string;
}) {
  return (
    <nav className="md-progress" aria-label="Document progress">
      <div className="md-progress-inner">
        {items.map((item, i) => {
          const active = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`md-prog-step${active ? " is-active" : ""}${item.done ? " is-done" : ""}`}
              aria-current={active ? "step" : undefined}
              onClick={item.onSelect}
            >
              <span className="md-prog-step-num">{i + 1}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function MasterDocWrap({ children }: { children: React.ReactNode }) {
  return <main className="md-wrap">{children}</main>;
}

export function MasterDocSection({
  id,
  num,
  eyebrow,
  title,
  badgeTone = "purple",
  children,
}: {
  id?: string;
  num: number | string;
  eyebrow?: string;
  title: React.ReactNode;
  badgeTone?: "purple" | "teal";
  children: React.ReactNode;
}) {
  return (
    <section
      className="md-section"
      id={id}
      data-testid={id ? `md-section-${id}` : undefined}
    >
      <header className="md-section-head">
        <div className={`md-section-num-badge${badgeTone === "teal" ? " teal" : ""}`}>
          {typeof num === "number" ? String(num).padStart(2, "0") : num}
        </div>
        <div className="md-section-titles">
          {eyebrow ? <div className="md-section-eyebrow">{eyebrow}</div> : null}
          <h2 className="md-section-title">{title}</h2>
        </div>
      </header>
      <div className="md-section-body">{children}</div>
    </section>
  );
}

export function MasterDocStep({
  step,
  tags,
  title,
  children,
}: {
  step: number | string;
  tags?: ("action" | "copy" | "system")[];
  title: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <article className="md-step-card">
      <div className="md-step-head">
        <span className="md-step-chip">STEP {step}</span>
        {tags && tags.length > 0 ? (
          <div className="md-step-tags">
            {tags.map((t) => (
              <span key={t} className={`md-step-tag ${t}`}>
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <h3 className="md-step-title">{title}</h3>
      {children ? <div className="md-step-body">{children}</div> : null}
    </article>
  );
}

export function MasterDocCopyBlock({
  label,
  body,
}: {
  label: string;
  body: string;
}) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="md-copy-block">
      <div className="md-copy-head">
        <span>{label}</span>
        <button type="button" className="md-copy-btn" onClick={onCopy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="md-copy-body">{body}</pre>
    </div>
  );
}

export function MasterDocFieldTable({
  rows,
}: {
  rows: { label: string; value: React.ReactNode }[];
}) {
  return (
    <table className="md-field-table">
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <th scope="row">{r.label}</th>
            <td>{r.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function MasterDocCallout({
  tone = "info",
  children,
}: {
  tone?: "info" | "warn" | "default";
  children: React.ReactNode;
}) {
  const cls =
    tone === "warn" ? "md-callout warn" : tone === "info" ? "md-callout info" : "md-callout";
  return <div className={cls}>{children}</div>;
}

export function MasterDocFooter({ children }: { children?: React.ReactNode }) {
  return (
    <footer className="md-footer">
      {children || (
        <>
          <b>BE Consulting Solutions</b> — Houston, TX · beconsultingsolutions@gmail.com
          <br />
          This document is a template. Not legal advice.
        </>
      )}
    </footer>
  );
}

/**
 * useScrollSpy — observes section ids and returns the currently-visible one.
 * Used to drive MasterDocProgress activeId without manual wiring.
 */
export function useScrollSpy(ids: string[], rootMargin = "-30% 0px -55% 0px"): string | undefined {
  const [active, setActive] = useState<string | undefined>(ids[0]);
  useEffect(() => {
    if (typeof window === "undefined" || ids.length === 0) return;
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (elements.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin, threshold: [0, 1] }
    );
    elements.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [ids.join("|"), rootMargin]);
  return active;
}

/**
 * scrollToId — smooth-scroll helper used by progress + topnav tabs.
 */
export function scrollToId(id: string) {
  if (typeof document === "undefined") return;
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Compose a default tabs array from registered section ids/labels for the topnav.
 */
export function tabsFromSections(
  sections: { id: string; navLabel?: string; title: string }[],
  activeId?: string
): NavTab[] {
  return sections.map((s) => ({
    id: s.id,
    label: s.navLabel || s.title,
    active: activeId === s.id,
    onClick: () => scrollToId(s.id),
  }));
}

/* Re-export named pieces for ergonomic imports. */
export const MasterDoc = {
  Layout: MasterDocLayout,
  Hero: MasterDocHero,
  Progress: MasterDocProgress,
  Wrap: MasterDocWrap,
  Section: MasterDocSection,
  Step: MasterDocStep,
  CopyBlock: MasterDocCopyBlock,
  FieldTable: MasterDocFieldTable,
  Callout: MasterDocCallout,
  Footer: MasterDocFooter,
};

export default MasterDocLayout;
export type { NavTab };
