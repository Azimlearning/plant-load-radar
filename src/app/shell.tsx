import type { ReactNode } from "react";
import Link from "next/link";

const PAGES = [
  { href: "/", label: "Board" },
  { href: "/inbox", label: "Orders inbox" },
  { href: "/decisions", label: "Decisions" },
  { href: "/ledger", label: "Ledger" },
  { href: "/ask", label: "Ask the board" },
  { href: "/value", label: "Cost of today" },
] as const;

export type PageHref = (typeof PAGES)[number]["href"];

/**
 * The frame every screen shares: the synthetic-data notice first (it must be the first thing a reader meets),
 * then a top bar, a left navigation rail and the page canvas. Layout only: it prints the strings it is given.
 */
export function Shell({ current, banner, title, lede, children }: { current: PageHref; banner: string; title: string; lede?: ReactNode; children: ReactNode }) {
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
          <span className="sidenav-label">Workspace</span>
          {PAGES.map((p) => (
            <Link key={p.href} href={p.href} aria-current={p.href === current ? "page" : undefined}>
              {p.label}
            </Link>
          ))}
        </nav>
        <main className="content">
          <div className="page-head">
            <h1 className="title">{title}</h1>
            {lede ? <div className="lede">{lede}</div> : null}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
