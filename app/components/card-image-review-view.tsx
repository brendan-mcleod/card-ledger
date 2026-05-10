'use client'

import { useCallback, useEffect, useState } from 'react'

import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import type { CardImageSubmissionSide } from '@/lib/types'

type ReviewSubmission = {
  id: string
  global_card_id: string
  side: CardImageSubmissionSide
  original_file_name?: string | null
  mime_type?: string | null
  file_size_bytes?: number | null
  created_at: string
  reviewImageUrl?: string | null
}

type ReviewPayload = {
  submissions?: ReviewSubmission[]
  error?: string
}

export function CardImageReviewView() {
  const [submissions, setSubmissions] = useState<ReviewSubmission[]>([])
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const getToken = useCallback(async () => {
    const supabase = getSupabaseBrowserClient()
    const session = await supabase?.auth.getSession()
    return session?.data.session?.access_token ?? null
  }, [])

  const loadSubmissions = useCallback(async () => {
    setMessage('')
    const token = await getToken()
    if (!token) {
      setMessage('Admin sign-in required.')
      return
    }

    const response = await fetch('/api/card-image-submissions', {
      headers: { authorization: `Bearer ${token}` },
    })
    const payload = (await response.json()) as ReviewPayload
    if (!response.ok) {
      setMessage(payload.error ?? 'Could not load submissions.')
      return
    }

    setSubmissions(payload.submissions ?? [])
  }, [getToken])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadSubmissions()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadSubmissions])

  async function reviewSubmission(submissionId: string, reviewStatus: 'approved' | 'rejected' | 'needs_changes') {
    setBusyId(submissionId)
    setMessage('')
    const token = await getToken()

    if (!token) {
      setMessage('Admin sign-in required.')
      setBusyId(null)
      return
    }

    try {
      const response = await fetch('/api/card-image-submissions', {
        method: 'PATCH',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          reviewStatus,
        }),
      })
      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(payload.error ?? 'Review failed.')
      }

      setSubmissions((current) => current.filter((submission) => submission.id !== submissionId))
      setMessage(reviewStatus === 'approved' ? 'Image approved and copied to approved storage.' : 'Review saved.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Review failed.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="page-shell">
      <section className="section-panel panel-stack-md">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Admin</p>
            <h1 className="display-title intro-title">Image review</h1>
            <p className="hero-body">Approve only clean raw-card fronts or backs with no slab labels, marketplace marks, or seller watermarks.</p>
          </div>
          <button className="button-secondary" onClick={loadSubmissions} type="button">Refresh</button>
        </div>
        {message ? <p className="flash-note">{message}</p> : null}
        {submissions.length === 0 ? (
          <div className="section-empty">No pending image submissions.</div>
        ) : (
          <div className="card-image-review-grid">
            {submissions.map((submission) => (
              <article className="card-image-review-card" key={submission.id}>
                {submission.reviewImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={`${submission.global_card_id} ${submission.side} submission`} src={submission.reviewImageUrl} />
                ) : (
                  <div className="card-image-review-placeholder">Preview unavailable</div>
                )}
                <div className="panel-stack-sm">
                  <p className="eyebrow">{submission.side}</p>
                  <h2 className="section-title section-title-spaced">{submission.global_card_id}</h2>
                  <p className="body-copy-sm">{submission.original_file_name ?? 'Uploaded image'} · {submission.mime_type ?? 'image'}</p>
                  <div className="card-image-review-actions">
                    <button className="button-primary" disabled={busyId === submission.id} onClick={() => reviewSubmission(submission.id, 'approved')} type="button">
                      Approve
                    </button>
                    <button className="button-secondary" disabled={busyId === submission.id} onClick={() => reviewSubmission(submission.id, 'needs_changes')} type="button">
                      Needs changes
                    </button>
                    <button className="button-secondary button-secondary-quiet" disabled={busyId === submission.id} onClick={() => reviewSubmission(submission.id, 'rejected')} type="button">
                      Reject
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
