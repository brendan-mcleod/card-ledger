'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { getAutocompleteSuggestions } from '@/lib/data'
import type { CardSuggestion } from '@/lib/types'

type SearchBarProps = {
  initialValue?: string
  placeholder?: string
  onValueChange?: (value: string) => void
  large?: boolean
  suggestionPrefix?: string
  suggestions?: CardSuggestion[]
  rotatingPlaceholders?: string[]
}

export function SearchBar({
  initialValue = '',
  placeholder = 'Search the card library',
  onValueChange,
  large = false,
  suggestionPrefix,
  suggestions,
  rotatingPlaceholders,
}: SearchBarProps) {
  const router = useRouter()
  const [value, setValue] = useState(initialValue)
  const [open, setOpen] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [placeholderFading, setPlaceholderFading] = useState(false)

  const trimmedValue = useMemo(() => value.trim(), [value])
  const visibleSuggestions = useMemo<CardSuggestion[]>(
    () => {
      if (trimmedValue.length < 2) {
        return []
      }

      if (suggestions) {
        return suggestions
      }

      return getAutocompleteSuggestions(trimmedValue)
    },
    [suggestions, trimmedValue],
  )
  const activePlaceholder =
    trimmedValue.length === 0 && rotatingPlaceholders && rotatingPlaceholders.length > 0
      ? rotatingPlaceholders[placeholderIndex % rotatingPlaceholders.length]
      : placeholder

  useEffect(() => {
    if (!rotatingPlaceholders || rotatingPlaceholders.length === 0 || trimmedValue.length > 0) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setPlaceholderFading(true)
    }, 3200)

    const swapId = window.setTimeout(() => {
      setPlaceholderIndex((current) => (current + 1) % rotatingPlaceholders.length)
      setPlaceholderFading(false)
    }, 3700)

    return () => {
      window.clearTimeout(timeoutId)
      window.clearTimeout(swapId)
    }
  }, [placeholderIndex, rotatingPlaceholders, trimmedValue.length])

  return (
    <div className="search-shell">
      <form
        className="search-form"
        onSubmit={(event) => {
          event.preventDefault()
          router.push(`/library?q=${encodeURIComponent(value.trim())}`)
          setOpen(false)
        }}
      >
        <input
          className={`search-input ${large ? 'search-input-large' : ''}`}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onChange={(event) => {
            const nextValue = event.target.value
            setValue(nextValue)
            if (nextValue.trim().length > 0) {
              setPlaceholderFading(false)
            }
            setOpen(true)
            onValueChange?.(nextValue)
          }}
          onFocus={() => setOpen(true)}
          placeholder={rotatingPlaceholders?.length ? '' : activePlaceholder}
          type="search"
          value={value}
        />
        {trimmedValue.length === 0 && rotatingPlaceholders?.length ? (
          <span className={`search-rotating-placeholder ${placeholderFading ? 'search-rotating-placeholder-fading' : ''}`}>
            {activePlaceholder}
          </span>
        ) : null}
      </form>
      {open && visibleSuggestions.length > 0 ? (
        <div className="search-popover">
          {visibleSuggestions.map((suggestion) => (
            <Link
              key={suggestion.id}
              className="search-suggestion"
              href={suggestion.href}
              onClick={() => setOpen(false)}
            >
              <div className="search-suggestion-visual">
                {suggestion.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" className="search-suggestion-thumb" src={suggestion.thumbnailUrl} />
                ) : (
                  <span className="search-suggestion-thumb search-suggestion-thumb-placeholder" />
                )}
              </div>
              <div className="search-suggestion-copy">
              {suggestionPrefix ? <span className="search-suggestion-prefix">{suggestionPrefix}</span> : null}
              <span className="font-semibold text-[var(--ink-strong)]">{suggestion.label}</span>
              <span className="text-sm text-[var(--ink-soft)]">{suggestion.sublabel}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}
