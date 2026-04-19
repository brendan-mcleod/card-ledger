import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="page-shell">
      <section className="hero-panel space-y-5">
        <p className="eyebrow">Not found</p>
        <h1 className="display-title text-5xl md:text-7xl">That card slipped out of the binder.</h1>
        <p className="max-w-2xl text-lg leading-8 text-[var(--ink-soft)]">
          Try the library instead and you’ll be back on cardboard in one click.
        </p>
        <Link className="button-primary" href="/library">
          Go to library
        </Link>
      </section>
    </main>
  )
}
