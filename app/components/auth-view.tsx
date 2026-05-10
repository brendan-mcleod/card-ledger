'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'

import { useCollector } from '@/app/components/collector-provider'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase/browser'

type AuthMode = 'sign-in' | 'sign-up'

export function AuthView() {
  const collector = useCollector()
  const searchParams = useSearchParams()
  const returnHref = useMemo(() => searchParams.get('next') || '/', [searchParams])
  const initialMode = searchParams.get('mode') === 'sign-up' ? 'sign-up' : 'sign-in'
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()
  const supabase = getSupabaseBrowserClient()
  const configured = isSupabaseBrowserConfigured() && supabase

  function submit() {
    if (!supabase) return

    setMessage('')
    startTransition(async () => {
      const result = mode === 'sign-in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                display_name: displayName || email.split('@')[0],
                username: email.split('@')[0],
              },
            },
          })

      if (result.error) {
        setMessage(result.error.message)
        return
      }

      setMessage(mode === 'sign-in' ? 'Signed in. Your collection will sync to this account.' : 'Account created. Check your email if confirmation is enabled.')
      window.location.href = returnHref
    })
  }

  return (
    <main className="page-shell auth-page">
      <section className="auth-panel">
        <div className="panel-stack-sm">
          <p className="eyebrow">Slabbed account</p>
          <h1 className="display-title">Sign in to your shelf.</h1>
          <p className="body-copy">
            Keep your profile, collection, watchlist, favorites, showcase, notes, and backs tied to your account.
          </p>
        </div>

        {!configured ? (
          <div className="section-empty auth-demo-empty">
            <span>Supabase auth is not configured in this environment.</span>
            <button
              className="button-primary"
              onClick={() => {
                collector.signInDemo()
                window.location.href = returnHref
              }}
              type="button"
            >
              Continue as mcleodbc
            </button>
          </div>
        ) : (
          <form
            className="settings-form auth-form"
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
          >
            <div className="segmented-control segmented-control-compact" role="tablist">
              <button
                className={mode === 'sign-in' ? 'segmented-control-option segmented-control-option-active' : 'segmented-control-option'}
                onClick={() => setMode('sign-in')}
                type="button"
              >
                Sign in
              </button>
              <button
                className={mode === 'sign-up' ? 'segmented-control-option segmented-control-option-active' : 'segmented-control-option'}
                onClick={() => setMode('sign-up')}
                type="button"
              >
                Create account
              </button>
            </div>

            {mode === 'sign-up' ? (
              <label className="settings-field">
                <span>Display name</span>
                <input
                  className="settings-input"
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Brendan McLeod"
                  value={displayName}
                />
              </label>
            ) : null}

            <label className="settings-field">
              <span>Email</span>
              <input
                autoComplete="email"
                className="settings-input"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="collector@example.com"
                required
                type="email"
                value={email}
              />
            </label>

            <label className="settings-field">
              <span>Password</span>
              <input
                autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                className="settings-input"
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                required
                type="password"
                value={password}
              />
            </label>

            <div className="settings-actions">
              <button className="button-primary" disabled={isPending} type="submit">
                {isPending ? 'Working...' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
              </button>
              <Link className="button-secondary" href="/">
                Back
              </Link>
            </div>

            {message ? <p className="flash-note">{message}</p> : null}
          </form>
        )}
      </section>
    </main>
  )
}
