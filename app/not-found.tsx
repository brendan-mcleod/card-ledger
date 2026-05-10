import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="page-shell">
      <section className="hero-panel space-y-5">
        <p className="eyebrow">Not found</p>
        <h1 className="display-title text-5xl md:text-7xl">Page not found</h1>
        <p className="max-w-2xl text-lg leading-8 text-[var(--ink-soft)]">
          The page may have moved, or the card link may be incomplete.
        </p>
        <Link className="button-primary" href="/discover">
          Open Discover
        </Link>
      </section>
    </main>
  )
}
