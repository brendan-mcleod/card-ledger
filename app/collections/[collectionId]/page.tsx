import Link from "next/link"
import { notFound } from "next/navigation"

import { prisma } from "@/lib/prisma"

type CollectionPageProps = {
  params: Promise<{
    collectionId: string
  }>
}

function formatCardLabel(card: {
  year: number
  setName: string
  cardTitle: string
  playerName: string
}) {
  return `${card.year} ${card.setName} ${card.playerName} ${card.cardTitle}`
}

export default async function CollectionDetailPage({
  params,
}: CollectionPageProps) {
  const { collectionId } = await params

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    include: {
      cards: {
        orderBy: [{ isFavorite: "desc" }, { year: "desc" }, { playerName: "asc" }],
      },
      user: true,
    },
  })

  if (!collection) {
    notFound()
  }

  const favoriteCount = collection.cards.filter((card) => card.isFavorite).length
  const years = collection.cards.map((card) => card.year)
  const yearRange =
    years.length > 0 ? `${Math.min(...years)}-${Math.max(...years)}` : "No years yet"

  return (
    <main className="page-shell">
      <section className="hero-panel collection-hero">
        <div>
          <p className="eyebrow">Collection Detail</p>
          <h1>{collection.name}</h1>
          <p className="hero-copy">
            {collection.description ?? "A focused corner of the Card Ledger shelf."}
          </p>
          <p className="collection-owner">
            Curated by {collection.user.name ?? collection.user.email}
          </p>
        </div>

        <div className="hero-actions">
          <Link className="button button-primary" href="/">
            Back to Dashboard
          </Link>
          <Link className="button button-secondary" href="/#add-card">
            Add Another Card
          </Link>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span className="stat-label">Cards Logged</span>
          <strong>{collection.cards.length}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Favorites</span>
          <strong>{favoriteCount}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Year Span</span>
          <strong>{yearRange}</strong>
        </article>
      </section>

      <section className="section-stack">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Card Drawer</p>
            <h2>Cards in this collection</h2>
          </div>
        </div>

        {collection.cards.length === 0 ? (
          <div className="panel empty-panel">
            <p>No cards yet. Use the Add Card form to start this collection off.</p>
          </div>
        ) : (
          <div className="card-tile-grid">
            {collection.cards.map((card) => (
              <article key={card.id} className="card-tile">
                <div className="card-tile-topline">
                  <span>{card.year}</span>
                  {card.isFavorite ? <span className="favorite-chip">Favorite</span> : null}
                </div>
                <h3>{card.playerName}</h3>
                <p className="card-subtitle">{card.cardTitle}</p>
                <dl className="card-meta-list">
                  <div>
                    <dt>Set</dt>
                    <dd>{card.setName}</dd>
                  </div>
                  <div>
                    <dt>Team</dt>
                    <dd>{card.team}</dd>
                  </div>
                </dl>
                {card.notes ? <p className="card-note">{card.notes}</p> : null}
                <p className="card-footnote">{formatCardLabel(card)}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
