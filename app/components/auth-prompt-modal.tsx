'use client'

import Link from 'next/link'

import { useCollector, type AuthPromptKind } from '@/app/components/collector-provider'

const promptCopy: Record<AuthPromptKind, { title: string; body: string }> = {
  owned: {
    title: 'Track this card',
    body: 'Create a free Slabbed profile to mark cards as owned, choose backs, and track progress.',
  },
  wishlist: {
    title: 'Save this card',
    body: 'Sign in to keep a watchlist of cards you want next.',
  },
  favorite: {
    title: 'Save your favorites',
    body: 'Create a profile to save favorite cards.',
  },
  showcase: {
    title: 'Build your showcase',
    body: 'Sign in to feature cards on your shelf.',
  },
  back: {
    title: 'Save the back',
    body: 'Sign in to save backs for cards you own.',
  },
  default: {
    title: 'Sign in to personalize Slabbed',
    body: 'Create a profile to track cards, save targets, choose backs, and follow set progress.',
  },
}

function loginHref(mode: 'signin' | 'signup', nextPath?: string) {
  const params = new URLSearchParams()

  if (mode === 'signup') {
    params.set('mode', 'sign-up')
  }

  if (nextPath) {
    params.set('next', nextPath)
  }

  const query = params.toString()
  return query ? `/login?${query}` : '/login'
}

export function AuthPromptModal() {
  const collector = useCollector()
  const prompt = collector.authPrompt

  if (!prompt) {
    return null
  }

  const copy = promptCopy[prompt.kind]

  return (
    <div className="auth-prompt-backdrop" role="presentation" onMouseDown={collector.closeAuthPrompt}>
      <section
        aria-labelledby="auth-prompt-title"
        aria-modal="true"
        className="auth-prompt-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button aria-label="Close sign in prompt" className="auth-prompt-close" onClick={collector.closeAuthPrompt} type="button">
          <span aria-hidden="true">x</span>
        </button>
        <div className="panel-stack-sm">
          <p className="eyebrow">Account required</p>
          <h2 className="section-title" id="auth-prompt-title">
            {copy.title}
          </h2>
          <p className="body-copy-sm">{copy.body}</p>
        </div>
        <div className="auth-prompt-actions">
          <Link className="button-primary" href={loginHref('signup', prompt.nextPath)} onClick={collector.closeAuthPrompt}>
            Create account
          </Link>
          <Link className="button-secondary" href={loginHref('signin', prompt.nextPath)} onClick={collector.closeAuthPrompt}>
            Sign in
          </Link>
        </div>
      </section>
    </div>
  )
}
