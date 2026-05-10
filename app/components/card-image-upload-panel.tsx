'use client'

import { useState } from 'react'

import { useCollector } from '@/app/components/collector-provider'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import type { Card, CardImageSubmissionSide } from '@/lib/types'

type CardImageUploadPanelProps = {
  card: Card
  defaultSide?: CardImageSubmissionSide
}

type UploadResponse = {
  upload?: {
    path: string
    token: string
    signedUrl: string
  }
  error?: string
}

export function CardImageUploadPanel({ card, defaultSide = 'front' }: CardImageUploadPanelProps) {
  const collector = useCollector()
  const [side, setSide] = useState<CardImageSubmissionSide>(defaultSide)
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function submitImage() {
    setMessage('')

    if (!collector.isAuthenticated) {
      collector.requestAuth('default', `/cards/${card.slug}`)
      return
    }

    if (!file) {
      setMessage('Choose a JPG, PNG, or WebP image first.')
      return
    }

    const supabase = getSupabaseBrowserClient()
    const session = await supabase?.auth.getSession()
    const token = session?.data.session?.access_token

    if (!supabase || !token) {
      setMessage('Sign in with a full account to upload card images.')
      return
    }

    setBusy(true)

    try {
      const response = await fetch('/api/card-image-submissions', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          globalCardId: card.id,
          side,
          fileName: file.name,
          mimeType: file.type,
          fileSizeBytes: file.size,
        }),
      })
      const payload = (await response.json()) as UploadResponse

      if (!response.ok || !payload.upload) {
        throw new Error(payload.error ?? 'Could not prepare upload.')
      }

      const { error } = await supabase
        .storage
        .from('card-image-submissions')
        .uploadToSignedUrl(payload.upload.path, payload.upload.token, file)

      if (error) {
        throw new Error(error.message)
      }

      setFile(null)
      setMessage('Submitted for review. Approved images can become public catalog art.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Upload failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="section-panel card-image-upload-panel panel-stack-sm" id="card-image-upload-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Image review</p>
          <h2 className="section-title section-title-spaced">Submit a card image</h2>
        </div>
      </div>
      <p className="body-copy-sm">
        Upload a clean front or back scan of the raw card. Slabbed reviews images before they can replace catalog art.
      </p>
      <div className="card-image-upload-controls">
        <label className="all-cards-filter">
          <select className="all-cards-filter-select" onChange={(event) => setSide(event.target.value as CardImageSubmissionSide)} value={side}>
            <option value="front">Front image</option>
            <option value="back">Back image</option>
          </select>
        </label>
        <label className="card-image-file-control">
          <span>{file ? file.name : 'Choose image'}</span>
          <input
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            type="file"
          />
        </label>
        <button className="button-secondary" disabled={busy} onClick={submitImage} type="button">
          {busy ? 'Uploading...' : 'Submit'}
        </button>
      </div>
      <p className="body-copy-xs">
        By submitting, you confirm this is your own scan/photo and does not include a slab label, seller watermark, or marketplace branding.
      </p>
      {message ? <p className="flash-note">{message}</p> : null}
    </section>
  )
}
