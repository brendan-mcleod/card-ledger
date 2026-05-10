'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'

import { CardActionDock } from '@/app/components/card-action-icons'
import { CardImageUploadPanel } from '@/app/components/card-image-upload-panel'
import { CardVisual } from '@/app/components/card-visual'
import { OwnershipMetadataEditor } from '@/app/components/ownership-metadata-editor'
import { useCardActions } from '@/app/components/use-card-actions'
import {
  getActualBackOptionsForCard,
  getBackByIdForCard,
  getPossibleBackCountForCard,
  getRepresentativeBackForCard,
  isUnloggedBackId,
} from '@/lib/back-library'
import { persistClientCatalogCards } from '@/lib/catalog/client-cache'
import { T206_SET_SLUG } from '@/lib/catalog/constants'
import { useClientCatalog } from '@/lib/client-catalog'
import { formatCardSubtitle, getCardDisplayTitle, getMeaningfulCardTags, getMeaningfulCardVariation } from '@/lib/format'
import { getT206ExpertProfile } from '@/lib/t206-expert'
import type { Card, CardImageSubmissionSide, CollectionEntry } from '@/lib/types'

type CardDetailViewProps = {
  card: Card
}

function isKnownBack(backId?: string) {
  return !isUnloggedBackId(backId)
}

function formatCopyBack(card: Card, copy?: CollectionEntry) {
  if (!copy) return 'No owned copy'
  if (copy.selectedBackId === 'unknown') return 'Unknown back'
  if (!isKnownBack(copy.selectedBackId)) return 'Back not logged yet'
  return getBackByIdForCard(card, copy.selectedBackId).name
}

function formatCopyGrade(copy: CollectionEntry) {
  if (copy.grade) return `${copy.gradingCompany ?? 'Graded'} ${copy.grade}`
  return copy.format ?? 'Raw'
}

function isDefaultCopyLabel(label: string | undefined, copyIndex: number) {
  return !label || label.trim().toLowerCase() === `copy ${copyIndex + 1}`.toLowerCase()
}

function formatCopyTitle(copy: CollectionEntry, copyIndex: number, copyCount: number) {
  if (copyCount > 1) {
    return copy.copyLabel ?? `Copy ${copyIndex + 1}`
  }

  return isDefaultCopyLabel(copy.copyLabel, copyIndex) ? 'Owned copy' : copy.copyLabel
}

function formatConfidenceLabel(value?: string) {
  if (value === 'source_scan') return 'Source scan'
  if (value === 'expert_reference') return 'Expert reference'
  if (value === 'manual_review') return 'Manual review'
  return 'Reference pending'
}

export function CardDetailView({ card }: CardDetailViewProps) {
  const cardActions = useCardActions(card.id)
  const catalog = useClientCatalog()
  const collector = cardActions.collector
  const cardState = cardActions.state
  const actionLabels = cardActions.actions
  const [isPending, startTransition] = useTransition()
  const [flash, setFlash] = useState('')
  const [preferredCopyId, setPreferredCopyId] = useState<string | null>(null)
  const [uploadDefaultSide, setUploadDefaultSide] = useState<CardImageSubmissionSide>('front')
  const [uploadPanelKey, setUploadPanelKey] = useState(0)
  const [showUploadPanel, setShowUploadPanel] = useState(false)
  const supportsBackSelection = card.brand === 'T206' || card.brand === 'T205'
  const t206Expert = card.setSlug === T206_SET_SLUG ? card.t206Expert ?? getT206ExpertProfile(card) : undefined

  const ownedCopies = useMemo(() => collector.collectionCopies[card.id] ?? [], [card.id, collector.collectionCopies])
  const collectionEntry = cardState.collectionEntry
  const selectedCopyId = ownedCopies.some((copy) => copy.copyId === preferredCopyId || copy.id === preferredCopyId)
    ? preferredCopyId
    : ownedCopies[ownedCopies.length - 1]?.copyId ?? ownedCopies[ownedCopies.length - 1]?.id ?? null
  const activeOwnedCopy = ownedCopies.find((copy) => copy.copyId === selectedCopyId || copy.id === selectedCopyId) ?? ownedCopies[0]
  const activeOwnedCopyIndex = activeOwnedCopy
    ? Math.max(0, ownedCopies.findIndex((copy) => (copy.copyId ?? copy.id) === (activeOwnedCopy.copyId ?? activeOwnedCopy.id)))
    : 0
  const selectedBack = supportsBackSelection && isKnownBack(activeOwnedCopy?.selectedBackId) ? getBackByIdForCard(card, activeOwnedCopy?.selectedBackId) : null
  const backLibrary = supportsBackSelection ? getActualBackOptionsForCard(card, activeOwnedCopy?.selectedBackId) : []
  const backPreview = supportsBackSelection ? getRepresentativeBackForCard(card) : null
  const possibleBackCount = supportsBackSelection ? getPossibleBackCountForCard(card) : 0
  const isWishlisted = cardState.isWatchlisted
  const isFavorite = cardState.isFavorite
  const isShowcased = cardState.isShowcased
  const backStateLabel = activeOwnedCopy
    ? formatCopyBack(card, activeOwnedCopy)
    : card.scannedBackImageStatus === 'approved'
      ? 'Source-scanned back'
      : backPreview
        ? `${backPreview.name} preview`
        : 'Back preview'
  const backSourceLabel = selectedBack
    ? selectedBack.backImageSource
    : activeOwnedCopy
      ? 'Saved on your owned copy'
      : backPreview
        ? backPreview.backImageSource
        : 'Back preview'
  const backRightsNote = selectedBack
    ? selectedBack.backImageRightsNote
    : activeOwnedCopy
      ? 'Back choice is stored on this owned copy only.'
      : 'Preview only. Add a copy to log the exact back on your card.'
  const meaningfulVariation = getMeaningfulCardVariation(card)
  const detailTags = getMeaningfulCardTags(card)
    .filter((tag) => tag !== 'Hall of Fame' && tag !== 'Rookie' && tag !== meaningfulVariation)
    .slice(0, 2)
  const relatedCards = useMemo(() => {
    const team = card.displayTeam ?? card.team
    return catalog.cards
      .filter((candidate) => candidate.setSlug === card.setSlug)
      .filter((candidate) => candidate.id !== card.id)
      .filter((candidate) => (candidate.displayTeam ?? candidate.team) === team || candidate.hallOfFamer === card.hallOfFamer)
      .sort((left, right) => Number(Boolean(right.hallOfFamer)) - Number(Boolean(left.hallOfFamer)) || right.marketValue - left.marketValue || left.player.localeCompare(right.player))
      .slice(0, 6)
  }, [card.displayTeam, card.hallOfFamer, card.id, card.setSlug, card.team, catalog.cards])

  useEffect(() => {
    persistClientCatalogCards([card])
  }, [card])

  function handleAddCopy() {
    startTransition(() => {
      cardActions.toggleCollection()
      if (!collector.isAuthenticated) return
      setFlash(collectionEntry ? 'Another copy added.' : isWishlisted ? 'Moved from watchlist to collection ⚾️🏁' : 'Added to collection.')
    })
  }

  function handleRemoveCopy(copy: CollectionEntry) {
    const copyId = copy.copyId ?? copy.id
    if (!copyId) return
    collector.removeCardCopy(card.id, copyId)
    setPreferredCopyId(null)
    setFlash(ownedCopies.length > 1 ? 'Copy removed.' : 'Removed from collection.')
  }

  function handleRemoveActiveCopy() {
    if (!activeOwnedCopy) return
    handleRemoveCopy(activeOwnedCopy)
  }

  function handleUploadBackImage() {
    setShowUploadPanel(true)
    setUploadDefaultSide('back')
    setUploadPanelKey((current) => current + 1)
    window.requestAnimationFrame(() => {
      const panel = document.getElementById('card-image-upload-panel')
      panel?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const sideSelect = panel?.querySelector<HTMLSelectElement>('select')
      sideSelect?.focus({ preventScroll: true })
    })
  }

  return (
    <main className="page-shell card-detail-page">
      <section className="card-detail-shell">
        <div className="card-detail-visual-column">
          <div className="detail-card-visual-shell">
            <CardVisual
              card={card}
              className="detail-card-visual"
              flippable
              priority
              selectedBackId={activeOwnedCopy ? activeOwnedCopy.selectedBackId ?? 'none' : undefined}
              showFlipControl
            />
          </div>

          {supportsBackSelection ? (
            <div className="back-preview-note">
              <div>
                <strong>{activeOwnedCopy ? formatCopyBack(card, activeOwnedCopy) : 'Back preview'}</strong>
                <span>
                  {activeOwnedCopy
                    ? isKnownBack(activeOwnedCopy.selectedBackId)
                      ? 'This copy’s selected back controls the flip view.'
                      : 'Choose the actual back below when you know it.'
                    : `${possibleBackCount > 0 ? `Up to ${possibleBackCount}` : 'Multiple'} back variations may exist for this subject. Add a copy to log yours.`}
                </span>
              </div>
              <button className="text-link back-upload-link" onClick={handleUploadBackImage} type="button">
                Upload back image
              </button>
            </div>
          ) : null}

          <details className="detail-source-details">
            <summary>Image sources</summary>
            <div className="source-note-stack">
              <p>
                <strong>Front:</strong> {card.frontImageSource ?? card.imageSource ?? 'No source yet'}
              </p>
              <p>{card.frontImageRightsNote ?? card.imageSourceNote}</p>
              <p>
                <strong>Back:</strong> {backSourceLabel}
              </p>
              <p>{backRightsNote}</p>
              {card.frontImageSourceUrl ? (
                <p>
                  <a className="text-link" href={card.frontImageSourceUrl} rel="noreferrer" target="_blank">Front source</a>
                </p>
              ) : null}
              {card.scannedBackImageSourceUrl ? (
                <p>
                  <a className="text-link" href={card.scannedBackImageSourceUrl} rel="noreferrer" target="_blank">Scanned back source</a>
                </p>
              ) : null}
            </div>
          </details>

          {showUploadPanel ? (
            <CardImageUploadPanel card={card} defaultSide={uploadDefaultSide} key={`${card.id}-${uploadDefaultSide}-${uploadPanelKey}`} />
          ) : null}
        </div>

        <div className="card-detail-info-column">
          <section className="hero-panel card-detail-primary-panel panel-stack-md">
            <div className="panel-stack-sm">
              <p className="eyebrow">{card.setLabel}</p>
              <h1 className="display-title detail-title">{getCardDisplayTitle(card)}</h1>
              <p className="hero-body">{formatCardSubtitle(card)}</p>
              <div className="detail-chip-row">
                {card.hallOfFamer ? <span className="detail-chip detail-chip-premium">Hall of Fame</span> : null}
                {card.rookieCard ? <span className="detail-chip">Rookie</span> : null}
                {detailTags.map((tag) => <span className="detail-chip" key={tag}>{tag}</span>)}
                {meaningfulVariation ? <span className="detail-chip">{meaningfulVariation}</span> : null}
              </div>
            </div>

            <dl className="detail-facts-list">
              <div>
                <dt>Team</dt>
                <dd>{card.displayTeam ?? card.team}</dd>
              </div>
              <div>
                <dt>Variation</dt>
                <dd>{meaningfulVariation || 'Base'}</dd>
              </div>
              <div>
                <dt>Set</dt>
                <dd>{card.setLabel} · {card.yearRange ?? card.year}</dd>
              </div>
              <div>
                <dt>Back shown</dt>
                <dd>{backStateLabel}</dd>
              </div>
            </dl>

            <CardActionDock
              overflowActions={[
                collectionEntry
                  ? {
                      disabled: isPending,
                      kind: 'add',
                      label: 'Add another copy',
                      onClick: handleAddCopy,
                    }
                  : null,
                {
                  active: isShowcased,
                  disabled: collector.isAuthenticated && actionLabels.showcase.disabled,
                  kind: 'showcase',
                  label: isShowcased ? 'Remove from showcase' : actionLabels.showcase.disabled ? actionLabels.showcase.reason ?? 'Showcase unavailable' : 'Showcase',
                  onClick: () =>
                    startTransition(() => {
                      if (collector.isAuthenticated && actionLabels.showcase.disabled) {
                        setFlash(actionLabels.showcase.reason ?? 'Showcase unavailable.')
                        return
                      }
                      cardActions.toggleShowcase()
                      setFlash(isShowcased ? 'Removed from showcase.' : 'Added to showcase.')
                    }),
                },
              ]}
              primaryActions={[
                {
                  active: isWishlisted,
                  disabled: actionLabels.watchlist.disabled,
                  kind: 'watch',
                  label: isWishlisted ? 'On watchlist' : 'Watchlist',
                  onClick: () =>
                    startTransition(() => {
                      if (actionLabels.watchlist.disabled) {
                        setFlash(actionLabels.watchlist.reason ?? 'Watchlist unavailable.')
                        return
                      }
                      cardActions.toggleWatchlist()
                      setFlash(isWishlisted ? 'Removed from watchlist.' : 'Added to watchlist.')
                    }),
                },
                {
                  active: isFavorite,
                  kind: 'favorite',
                  label: isFavorite ? 'Favorited' : 'Favorite',
                  onClick: () =>
                    startTransition(() => {
                      cardActions.toggleFavorite()
                      setFlash(isFavorite ? 'Removed favorite.' : 'Favorited.')
                    }),
                },
                collectionEntry
                  ? {
                      active: true,
                      disabled: isPending,
                      kind: 'remove',
                      label: 'Remove one copy',
                      onClick: handleRemoveActiveCopy,
                    }
                  : {
                      disabled: isPending,
                      kind: 'add',
                      label: 'Add to collection',
                      onClick: handleAddCopy,
                    },
              ]}
              className="action-row detail-action-row"
              variant="detail"
            />

            {flash ? <p className="flash-note">{flash}</p> : null}
          </section>

          <section className="section-panel card-detail-copy-panel panel-stack-md" id="owned-copy">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{ownedCopies.length > 0 ? 'Your card' : 'Collection'}</p>
                <h2 className="section-title section-title-spaced">
                  {ownedCopies.length > 0 ? `${ownedCopies.length} ${ownedCopies.length === 1 ? 'copy' : 'copies'}` : 'Add your copy'}
                </h2>
              </div>
              {ownedCopies.length > 0 ? (
                <button className="button-secondary button-secondary-quiet" onClick={handleAddCopy} type="button">
                  + Add another
                </button>
              ) : null}
            </div>

            {activeOwnedCopy ? (
              <div className="panel-stack-md">
                <div className="owned-copy-list">
                  {ownedCopies.map((copy, index) => {
                    const copyId = copy.copyId ?? copy.id ?? `${card.id}-${index}`
                    const active = activeOwnedCopy.copyId === copyId || activeOwnedCopy.id === copyId

                    return (
                      <button
                        className={`owned-copy-row ${active ? 'owned-copy-row-active' : ''}`}
                        key={copyId}
                        onClick={() => setPreferredCopyId(copyId)}
                        type="button"
                      >
                        <span>
                          <strong>{formatCopyTitle(copy, index, ownedCopies.length)}</strong>
                          <small>{formatCopyBack(card, copy)}</small>
                        </span>
                        <small>{formatCopyGrade(copy)}</small>
                      </button>
                    )
                  })}
                </div>

                <OwnershipMetadataEditor
                  card={card}
                  copyCount={ownedCopies.length}
                  copyIndex={activeOwnedCopyIndex}
                  entry={activeOwnedCopy}
                  onChange={(payload) => collector.updateCollectionEntry(card.id, payload, activeOwnedCopy.copyId ?? activeOwnedCopy.id)}
                />

                <button className="button-secondary button-secondary-quiet" onClick={() => handleRemoveCopy(activeOwnedCopy)} type="button">
                  Remove this copy
                </button>
              </div>
            ) : (
              <div className="card-detail-empty-copy">
                <p>Log this physical card. Add another later for a different back, grade, or note.</p>
                <button className="button-primary" onClick={handleAddCopy} type="button">Add to collection</button>
              </div>
            )}
          </section>

          {supportsBackSelection ? (
            <details className="section-panel detail-drawer-panel panel-stack-sm">
              <summary>
                <span>
                  <small>Tobacco backs</small>
                  <strong>{t206Expert ? 'Backs & print group' : `${card.brand} back options`}</strong>
                </span>
                <span>{possibleBackCount > 0 ? `${possibleBackCount} possible` : 'View details'}</span>
              </summary>
              {t206Expert ? (
                <div className="expert-back-context">
                  <div>
                    <span>Print group</span>
                    <strong>{t206Expert.subjectGroupLabel}</strong>
                    <small>{t206Expert.printTimelineLabel}</small>
                  </div>
                  <div>
                    <span>Possible backs</span>
                    <strong>{t206Expert.possibleBackIds.length}</strong>
                    <small>{formatConfidenceLabel(t206Expert.backAvailabilityConfidence)}</small>
                  </div>
                  <div>
                    <span>Confirmed scan</span>
                    <strong>{t206Expert.confirmedBackIds.length > 0 ? t206Expert.confirmedBackIds.map((backId) => getBackByIdForCard(card, backId).name).join(', ') : 'None yet'}</strong>
                    <small>{t206Expert.sourceLabel}</small>
                  </div>
                </div>
              ) : null}
              <div className="back-library-preview">
                {backLibrary.filter((back) => back.backImageStatus === 'approved' && back.backImageUrl).slice(0, 5).map((back) => (
                  <div className="back-library-row" key={back.backId}>
                    <div>
                      <p className="owner-name">{back.name}</p>
                      <p className="body-copy-sm">{back.scarcityTier}</p>
                    </div>
                    <span className="back-library-status">View back</span>
                  </div>
                ))}
              </div>
              <div className="detail-drawer-actions">
                <Link className="text-link" href={`/sets/${card.setSlug}#backs`}>View backs</Link>
                <button className="text-link back-upload-link" onClick={handleUploadBackImage} type="button">Upload back image</button>
              </div>
              {t206Expert?.expertNotes?.length ? (
                <p className="body-copy-sm">{t206Expert.expertNotes[0]}</p>
              ) : null}
            </details>
          ) : null}

          {relatedCards.length > 0 ? (
            <section className="section-panel panel-stack-md">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Related</p>
                  <h2 className="section-title section-title-spaced">More {card.brand} cards</h2>
                </div>
                <Link className="text-link" href={`/sets/${card.setSlug}`}>View set</Link>
              </div>
              <div className="detail-related-grid">
                {relatedCards.map((related) => (
                  <Link className="detail-related-card" href={`/cards/${related.slug}`} key={related.id}>
                    <CardVisual card={related} className="detail-related-visual" flipOnSurface={false} />
                    <span>
                      <strong>{getCardDisplayTitle(related)}</strong>
                      <small>{related.displayTeam ?? related.team}</small>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  )
}
