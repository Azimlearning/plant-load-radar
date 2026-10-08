import Link from "next/link";

const PAGES = [
  { href: "/", label: "Board" },
  { href: "/inbox", label: "Orders inbox" },
  { href: "/decisions", label: "Decisions" },
  { href: "/ledger", label: "Ledger" },
  { href: "/ask", label: "Ask the board" },
  { href: "/value", label: "Cost of today" },
] as const;

/** The same page list on every screen. `current` marks the page being shown. */
export function Nav({ current }: { current: (typeof PAGES)[number]["href"] }) {
  return (
    <nav className="nav" aria-label="Pages">
      {PAGES.map((p) => (
        <Link key={p.href} href={p.href} aria-current={p.href === current ? "page" : undefined}>
          {p.label}
        </Link>
      ))}
    </nav>
  );
}
