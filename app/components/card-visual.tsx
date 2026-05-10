'use client'

import Image from 'next/image'
import { useState, type ReactNode } from 'react'

import { getBackByIdForCard, getPossibleBackCountForCard, getRepresentativeBackForCard, isUnloggedBackId } from '@/lib/back-library'
import { toCardImageRouteUrl } from '@/lib/card-asset-url'
import { getCardDisplayTeam, getCardDisplayTitle } from '@/lib/format'
import { coerceSelectedBackIdForCard } from '@/lib/t206-back-rules'
import type { Card, T206Back } from '@/lib/types'

type CardVisualProps = {
  card: Card
  selectedBackId?: string | null
  flippable?: boolean
  flipOnSurface?: boolean
  flipOnHover?: boolean
  showFlipControl?: boolean
  className?: string
  imageClassName?: string
  priority?: boolean
  preloadBack?: boolean
  side?: 'front' | 'back'
}

function CardImageElement({
  alt,
  card,
  className,
  fallback,
  priority = false,
  src,
}: {
  alt: string
  card?: Card
  className: string
  fallback: ReactNode
  priority?: boolean
  src: string
}) {
  const [failed, setFailed] = useState(false)
  const imageSrc = toCardImageRouteUrl(src)

  if (failed) return <>{fallback}</>

  if (imageSrc.startsWith('http')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={alt}
        className={className}
        decoding="async"
        loading={priority ? 'eager' : 'lazy'}
        onError={() => setFailed(true)}
        referrerPolicy="no-referrer"
        src={imageSrc}
        style={{
          objectPosition: card?.libraryFraming?.objectPosition,
          transform: card?.libraryFraming?.scale ? `scale(${card.libraryFraming.scale})` : undefined,
        }}
      />
    )
  }

  return (
    <Image
      alt={alt}
      className={className}
      height={560}
      onError={() => setFailed(true)}
      priority={priority}
      sizes="(max-width: 640px) 42vw, (max-width: 1024px) 24vw, 220px"
      src={imageSrc}
      style={{
        objectPosition: card?.libraryFraming?.objectPosition,
        transform: card?.libraryFraming?.scale ? `scale(${card.libraryFraming.scale})` : undefined,
      }}
      width={400}
    />
  )
}

function renderImage(src: string, alt: string, className: string, fallback: ReactNode, card?: Card, priority = false) {
  return <CardImageElement alt={alt} card={card} className={className} fallback={fallback} priority={priority} src={src} />
}

function getPlaceholderIdentity(card: Card) {
  if (card.brand === 'T206') {
    return { symbol: 'T206', theme: 'tobacco', kicker: card.yearRange ?? String(card.year) }
  }

  if (card.brand === 'T205') {
    return { symbol: 'T205', theme: 'gold', kicker: card.yearRange ?? String(card.year) }
  }

  if (card.brand === 'Bowman') {
    return { symbol: `B${String(card.year).slice(-2)}`, theme: 'bowman', kicker: `${card.year} Bowman` }
  }

  if (card.brand === 'Goudey') {
    return { symbol: `G${String(card.year).slice(-2)}`, theme: 'goudey', kicker: `${card.year} Goudey` }
  }

  if (card.brand === 'Topps') {
    return { symbol: `T${String(card.year).slice(-2)}`, theme: 'topps', kicker: `${card.year} Topps` }
  }

  return { symbol: 'S', theme: 'vintage', kicker: `${card.year} ${card.brand}` }
}

function getDefaultBackVariant(card: Card) {
  const normalizedSetLabel = card.setLabel.toLowerCase()

  if (card.brand === 'Bowman') {
    return `${card.year} Bowman back`
  }

  if (card.brand === 'Goudey') {
    return 'Goudey gum back'
  }

  if (normalizedSetLabel.includes('red backs')) {
    return 'Red back'
  }

  if (normalizedSetLabel.includes('blue backs')) {
    return 'Blue back'
  }

  if (card.brand === 'Topps') {
    return `${card.year} Topps back`
  }

  return `${card.setLabel} back`
}

function getSetBackPlaceholderCopy(card: Card) {
  const placeholder = getPlaceholderIdentity(card)
  const variants = (card.knownBackVariants ?? []).filter(Boolean)
  const primaryVariant = variants[0] ?? getDefaultBackVariant(card)
  const variantLabel = variants.length > 1 ? variants.slice(0, 3).join(' / ') : primaryVariant

  return {
    ...placeholder,
    kicker: 'Set-style back',
    title: primaryVariant,
    subtitle: variantLabel,
    variants,
    note: 'Add a copy to log the exact back.',
  }
}

function FrontPlaceholder({ card }: { card: Card }) {
  const placeholder = getPlaceholderIdentity(card)
  const title = getCardDisplayTitle(card)
  const team = getCardDisplayTeam(card)

  return (
    <div className={`set-symbol-placeholder set-symbol-placeholder-${placeholder.theme}`}>
      <div className="set-symbol-placeholder-field">
        <div className="set-symbol-mark" aria-hidden="true">{placeholder.symbol}</div>
        <span>{card.cardNumber}</span>
      </div>
      <div className="set-symbol-placeholder-copy">
        <span>{placeholder.kicker}</span>
        <strong>{title}</strong>
        {team ? <p>{team}</p> : null}
      </div>
    </div>
  )
}

function SubtleCardBackPlaceholder({ back, card, mode = 'copy' }: { back?: T206Back; card: Card; mode?: 'copy' | 'preview' | 'selected' }) {
  const isTobacco = card.brand === 'T206' || card.brand === 'T205'
  const isPreview = mode === 'preview'
  const isUnlogged = !back || isUnloggedBackId(back.backId)
  const placeholder = getSetBackPlaceholderCopy(card)
  const variants = isTobacco ? [] : placeholder.variants
  const possibleBackCount = isTobacco ? getPossibleBackCountForCard(card) : variants.length
  const title = isUnlogged ? 'Back not logged yet' : back?.name ?? 'Card back'
  const eyebrow = isPreview ? 'Back preview' : isTobacco ? 'Tobacco back' : 'Card back'
  const variationCopy = possibleBackCount > 0
    ? `Up to ${possibleBackCount} back ${possibleBackCount === 1 ? 'variation' : 'variations'} may exist`
    : 'Back details can be added to your copy'
  const note = isPreview
    ? 'Add a copy to log the exact back on your card.'
    : isUnlogged
      ? 'Choose the actual back when you know it.'
      : back?.collectorNote ?? 'Back details are saved to this copy.'
  const cardNumber = card.cardNumber ? `#${card.cardNumber}` : card.sourceCatalogId ?? 'Card back'

  return (
    <div className={`subtle-card-back-placeholder subtle-card-back-placeholder-${placeholder.theme}`}>
      <div className="subtle-card-back-paper">
        <div className="subtle-card-back-topline">
          <span>{eyebrow}</span>
          <span>{cardNumber}</span>
        </div>
        <div className="subtle-card-back-title">
          <span>{card.yearRange ?? card.year}</span>
          <strong>{title}</strong>
          <p>{variationCopy}</p>
        </div>
        <dl className="subtle-card-back-facts">
          <div>
            <dt>Subject</dt>
            <dd>{getCardDisplayTitle(card)}</dd>
          </div>
          <div>
            <dt>Set</dt>
            <dd>{card.setLabel}</dd>
          </div>
          {(card.displayTeam ?? card.team) ? (
            <div>
              <dt>Team</dt>
              <dd>{card.displayTeam ?? card.team}</dd>
            </div>
          ) : null}
        </dl>
        {variants.length > 1 ? (
          <div className="subtle-card-back-variants" aria-label="Known back variants">
            {variants.slice(0, 3).map((variant) => (
              <small key={variant}>{variant}</small>
            ))}
          </div>
        ) : null}
        <p className="subtle-card-back-note">{note}</p>
      </div>
    </div>
  )
}

function BackPlaceholder({ back, card, mode = 'copy' }: { back: T206Back; card: Card; mode?: 'copy' | 'preview' | 'selected' }) {
  return <SubtleCardBackPlaceholder back={back} card={card} mode={mode} />
}

function SetBackPlaceholder({ card }: { card: Card }) {
  return <SubtleCardBackPlaceholder card={card} mode="preview" />
}

export function CardVisual({
  card,
  selectedBackId,
  flippable = false,
  flipOnSurface = true,
  flipOnHover = false,
  showFlipControl = false,
  className = '',
  imageClassName = '',
  priority = false,
  preloadBack = false,
  side: forcedSide,
}: CardVisualProps) {
  const [internalSide, setInternalSide] = useState<'front' | 'back'>('front')
  const side = forcedSide ?? internalSide
  const displayTitle = getCardDisplayTitle(card)
  const safeSelectedBackId = coerceSelectedBackIdForCard(selectedBackId, card)
  const back = getBackByIdForCard(card, safeSelectedBackId)
  const shouldUseBackPreview = selectedBackId === undefined || selectedBackId === null
  const previewBack = shouldUseBackPreview ? getRepresentativeBackForCard(card) : null
  const frontSrc = card.frontImageUrl ?? card.imageUrl
  const hasApprovedFront = Boolean(frontSrc && card.imageStatus === 'approved')
  const hasSelectedBack = Boolean(safeSelectedBackId && !isUnloggedBackId(safeSelectedBackId))
  const catalogBackSrc = card.scannedBackImageStatus === 'approved' ? card.scannedBackImageUrl : null
  const backSrc = hasSelectedBack && back.backImageStatus === 'approved'
    ? back.backImageUrl
    : shouldUseBackPreview && previewBack?.backImageStatus === 'approved'
      ? previewBack.backImageUrl
      : catalogBackSrc
  const backAlt = card.brand === 'T206' || card.brand === 'T205'
    ? `${hasSelectedBack ? back.name : previewBack?.name ?? `${card.brand} back preview`} tobacco back`
    : `${displayTitle} ${card.yearRange ?? card.year} ${card.setLabel} back`
  const backPlaceholder = previewBack ?? back
  const backPlaceholderMode = shouldUseBackPreview ? 'preview' : hasSelectedBack ? 'selected' : 'copy'
  const canFlip = !forcedSide && (flippable || showFlipControl)
  const isBack = side === 'back'
  const shouldRenderBackImage = Boolean(backSrc && (isBack || priority || showFlipControl || preloadBack))
  const visualClassName = `card-visual ${isBack ? 'card-visual-flipped' : ''} ${flipOnHover ? 'card-visual-hover-flip' : ''} ${className}`.trim()
  const mediaClassName = imageClassName || 'card-visual-image'

  function flip() {
    if (!canFlip) {
      return
    }
    setInternalSide((current) => (current === 'front' ? 'back' : 'front'))
  }

  return (
    <div
      className={visualClassName}
      onMouseEnter={() => {
        if (canFlip && flipOnHover) {
          setInternalSide('back')
        }
      }}
      onMouseLeave={() => {
        if (canFlip && flipOnHover) {
          setInternalSide('front')
        }
      }}
    >
      <button
        aria-label={`Flip to ${isBack ? 'front' : 'back'}`}
        aria-pressed={isBack}
        className="card-visual-touch-target"
        disabled={!canFlip || !flipOnSurface}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          flip()
        }}
        tabIndex={canFlip && flipOnSurface ? 0 : -1}
        type="button"
      />
      <div className="card-visual-inner">
        <div className="card-visual-face card-visual-front">
          {hasApprovedFront
            ? renderImage(frontSrc!, `${displayTitle} ${card.yearRange ?? card.year} ${card.setLabel} front`, mediaClassName, <FrontPlaceholder card={card} />, card, priority)
            : <FrontPlaceholder card={card} />}
        </div>
        <div className="card-visual-face card-visual-back">
          {shouldRenderBackImage && backSrc
            ? renderImage(backSrc, backAlt, mediaClassName, card.brand === 'T206' || card.brand === 'T205' ? <BackPlaceholder back={backPlaceholder} card={card} mode={backPlaceholderMode} /> : <SetBackPlaceholder card={card} />, undefined, priority)
            : card.brand === 'T206' || card.brand === 'T205' ? <BackPlaceholder back={backPlaceholder} card={card} mode={backPlaceholderMode} /> : <SetBackPlaceholder card={card} />}
        </div>
      </div>
      {canFlip ? (
        <button
          aria-label={`Show ${isBack ? 'front' : 'back'} of card`}
          className={`card-visual-flip-control ${showFlipControl ? 'card-visual-flip-control-prominent' : ''}`}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            flip()
          }}
          type="button"
        >
          Flip
        </button>
      ) : null}
    </div>
  )
}
