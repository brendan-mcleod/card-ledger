import Link from "next/link"

import { AddCardForm } from "@/app/add-card-form"
import { CreateCollectionForm } from "@/app/create-collection-form"
import { prisma } from "@/lib/prisma"

function formatRecentStamp(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

export default async function Home() {
  const [collections, recentCards, totalCards, favoriteCards] = await Promise.all([
    prisma.collection.findMany({
      orderBy: [{ createdAt: "desc" }, { name: "asc" }],
      include: {
        cards: {
          orderBy: [{ isFavorite: "desc" }, { createdAt: "desc" }],
        },
      },
    }),
    prisma.card.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        collection: true,
      },
    }),
    prisma.card.count(),
    prisma.card.count({
      where: { isFavorite: true },
    }),
  ])

  const collectionCount = collections.length
  const years = collections.flatMap((collection) => collection.cards.map((card) => card.year))
  const yearSpan =
    years.length > 0 ? `${Math.min(...years)}-${Math.max(...years)}` : "No cards yet"

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div className="hero-copy-block">
          <p className="eyebrow">Card Ledger</p>
          <h1>Your collection, scored like a proper home opener.</h1>
          <p className="hero-copy">
            Track the cards that matter, keep your shelves organized, and turn pickups into
            a collection story with a little scoreboard energy and classic cardboard soul.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#add-card">
              Add Card
            </a>
            <a className="button button-secondary" href="#create-collection">
              Create Collection
            </a>
          </div>
        </div>

        <div className="hero-scoreboard">
          <div className="scoreboard-header">
            <span>Collector Home</span>
            <span>Season Snapshot</span>
          </div>
          <div className="scoreboard-grid">
            <article>
              <span>Total Cards</span>
              <strong>{totalCards}</strong>
            </article>
            <article>
              <span>Collections</span>
              <strong>{collectionCount}</strong>
            </article>
            <article>
              <span>Favorites</span>
              <strong>{favoriteCards}</strong>
            </article>
            <article>
              <span>Year Span</span>
              <strong>{yearSpan}</strong>
            </article>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span className="stat-label">Active Collections</span>
          <strong>{collectionCount}</strong>
          <p>Organized corners of your shelf, from vintage icons to rookie boxes.</p>
        </article>
        <article className="stat-card">
          <span className="stat-label">Logged Favorites</span>
          <strong>{favoriteCards}</strong>
          <p>The keepers, centerpieces, and cards you would pull out first for a friend.</p>
        </article>
        <article className="stat-card">
          <span className="stat-label">Recent Rhythm</span>
          <strong>{recentCards.length}</strong>
          <p>Fresh additions surfaced here so the collection feels alive every time you return.</p>
        </article>
      </section>

      <section className="dashboard-grid">
        <div className="section-stack">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Recent Additions</p>
              <h2>Latest cards logged</h2>
            </div>
          </div>

          {recentCards.length === 0 ? (
            <div className="panel empty-panel">
              <p>No cards yet. Add the first card to get the ledger moving.</p>
            </div>
          ) : (
            <div className="recent-grid">
              {recentCards.map((card) => (
                <article key={card.id} className="recent-card">
                  <div className="recent-card-header">
                    <span>{card.year}</span>
                    {card.isFavorite ? <span className="favorite-chip">Favorite</span> : null}
                  </div>
                  <h3>{card.playerName}</h3>
                  <p className="card-subtitle">
                    {card.setName} • {card.cardTitle}
                  </p>
                  <p className="recent-team">{card.team}</p>
                  <p className="recent-meta">
                    Added to <Link href={`/collections/${card.collectionId}`}>{card.collection.name}</Link>
                  </p>
                  <p className="recent-date">{formatRecentStamp(card.createdAt)}</p>
                </article>
              ))}
            </div>
          )}

          <div className="section-heading">
            <div>
              <p className="eyebrow">Collections</p>
              <h2>Your shelves</h2>
            </div>
          </div>

          {collections.length === 0 ? (
            <div className="panel empty-panel">
              <p>No collections yet. Create your first collection to start shaping the shelf.</p>
            </div>
          ) : (
            <div className="collection-grid">
              {collections.map((collection) => {
                const favoriteCount = collection.cards.filter((card) => card.isFavorite).length
                const featuredCard = collection.cards[0]

                return (
                  <Link
                    key={collection.id}
                    href={`/collections/${collection.id}`}
                    className="collection-card"
                  >
                    <div className="collection-card-topline">
                      <span>{collection.cards.length} cards</span>
                      <span>{favoriteCount} favorites</span>
                    </div>
                    <h3>{collection.name}</h3>
                    <p className="collection-description">
                      {collection.description ?? "A growing part of the Card Ledger shelf."}
                    </p>
                    {featuredCard ? (
                      <div className="collection-feature">
                        <strong>{featuredCard.playerName}</strong>
                        <span>
                          {featuredCard.year} {featuredCard.setName} • {featuredCard.cardTitle}
                        </span>
                      </div>
                    ) : (
                      <div className="collection-feature empty-feature">
                        <strong>Ready for the first card</strong>
                        <span>Open the collection and start logging additions.</span>
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <aside className="sidebar-stack">
          <CreateCollectionForm />
          <AddCardForm
            collections={collections.map((collection) => ({
              id: collection.id,
              name: collection.name,
            }))}
          />
        </aside>
      </section>
    </main>
  )
}
