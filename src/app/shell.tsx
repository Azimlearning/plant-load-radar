import type { ReactNode } from "react";
import Link from "next/link";

interface NavItem {
  href: string;
  label: string;
}
interface NavGroup {
  label: string | null;
  items: readonly NavItem[];
}

// Slide 9's sidebar (Board, Orders inbox, Decisions, Ledger, Ask the board), grouped by who uses it (slide 6) and
// followed by the proof pages (slides 11, 12, 15).
const GROUPS = [
  { label: null, items: [{ href: "/", label: "Overview" }] },
  {
    label: "Daily, at the plant",
    items: [
      { href: "/board", label: "Board" },
      { href: "/inbox", label: "Orders inbox" },
      { href: "/inbox/try", label: "Try it" },
      { href: "/decisions", label: "Decisions" },
    ],
  },
  {
    label: "The five people",
    items: [
      { href: "/huddle", label: "Weekly huddle" },
      { href: "/ask", label: "Ask the board" },
      { href: "/calloffs", label: "Call-offs" },
      { href: "/outbox", label: "Outbox" },
      { href: "/ledger", label: "Ledger" },
      { href: "/finance", label: "Finance" },
    ],
  },
  {
    label: "Proof",
    items: [
      { href: "/value", label: "Cost of today" },
      { href: "/pilot", label: "Pilot scorecard" },
      { href: "/sources", label: "Sources" },
    ],
  },
] as const satisfies readonly NavGroup[];

export type PageHref = (typeof GROUPS)[number]["items"][number]["href"];

/** Counts shown beside a nav item, as slide 9 shows "Orders inbox (3)". Strings come from the view-model, never computed here. */
export type NavCounts = Partial<Record<PageHref, string>>;

/**
 * The frame every screen shares: the synthetic-data notice first (it must be the first thing a reader meets),
 * then a top bar, a left navigation rail and the page canvas. Layout only: it prints the strings it is given.
 */
export function Shell({ current, banner, title, lede, kicker, counts, hero, children }: { current: PageHref; banner: string; title: string; lede?: ReactNode; kicker?: string; counts?: NavCounts; hero?: ReactNode; children: ReactNode }) {
  return (
    <div className="app">
      <div className="banner" role="note">
        {banner}
      </div>
      <header className="topbar">
        <span className="brand">
          <span className="brand-mark" aria-hidden="true" />
          Plant Load Radar
        </span>
        <span className="pill">Synthetic demo</span>
      </header>
      <div className="frame">
        <nav className="sidenav" aria-label="Pages">
          {GROUPS.map((g) => (
            <div key={g.label ?? "top"} className="sidenav-group">
              {g.label ? <span className="sidenav-label">{g.label}</span> : null}
              {g.items.map((p) => (
                <Link key={p.href} href={p.href} aria-current={p.href === current ? "page" : undefined}>
                  {p.label}
                  {counts?.[p.href as PageHref] ? <span className="nav-count"> ({counts[p.href as PageHref]})</span> : null}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <main className="content">
          {hero ?? (
            <div className="page-head">
              {kicker ? <p className="kicker">{kicker}</p> : null}
              <h1 className="title">{title}</h1>
              {lede ? <div className="lede">{lede}</div> : null}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
