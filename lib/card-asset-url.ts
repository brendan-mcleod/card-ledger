import type { Card, SetSummary, T206Back } from '@/lib/types'

const CARD_DETAIL_PREFIX = '/cards/'
const CARD_IMAGE_PREFIX = '/card-images/'

function isExternalUrl(url: string) {
  return /^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')
}

export function toCardImageRouteUrl<T extends string | null | undefined>(url: T): T {
  if (!url || isExternalUrl(url)) return url
  if (url.startsWith(CARD_IMAGE_PREFIX)) return url
  if (!url.startsWith(CARD_DETAIL_PREFIX)) return url
  return `${CARD_IMAGE_PREFIX}${url.slice(CARD_DETAIL_PREFIX.length)}` as T
}

export function toCardStorageRelativePath(assetPath: string[]) {
  return assetPath
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment))
    .join('/')
}

export function normalizeCardAssetUrls<T extends Partial<Pick<Card, 'imageUrl' | 'frontImageUrl' | 'scannedBackImageUrl'>>>(card: T): T {
  return {
    ...card,
    imageUrl: toCardImageRouteUrl(card.imageUrl),
    frontImageUrl: toCardImageRouteUrl(card.frontImageUrl),
    scannedBackImageUrl: toCardImageRouteUrl(card.scannedBackImageUrl),
  }
}

export function normalizeSetAssetUrls<T extends Partial<Pick<SetSummary, 'coverImageUrl'>>>(set: T): T {
  return {
    ...set,
    coverImageUrl: toCardImageRouteUrl(set.coverImageUrl),
  }
}

export function normalizeBackAssetUrls<T extends Partial<Pick<T206Back, 'backImageUrl'>>>(back: T): T {
  return {
    ...back,
    backImageUrl: toCardImageRouteUrl(back.backImageUrl),
  }
}
