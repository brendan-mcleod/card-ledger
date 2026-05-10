'use client'

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import type { CardSuggestion } from '@/lib/types'

type SearchBarProps = {
  initialValue?: string
  value?: string
  placeholder?: string
  onValueChange?: (value: string) => void
  large?: boolean
  variant?: 'default' | 'command'
  suggestionPrefix?: string
  suggestions?: CardSuggestion[]
  rotatingPlaceholders?: string[]
  placeholderMode?: 'swap' | 'type'
  submitPath?: string
  showSuggestions?: boolean
  debounceMs?: number
}

export function SearchBar({
  initialValue = '',
  value: controlledValue,
  placeholder = 'Search the card library',
  onValueChange,
  large = false,
  variant = 'default',
  suggestionPrefix,
  suggestions,
  rotatingPlaceholders,
  placeholderMode = 'swap',
  submitPath = '/search',
  showSuggestions = true,
  debounceMs = 120,
}: SearchBarProps) {
  const router = useRouter()
  const [draftState, setDraftState] = useState(() => ({
    controlledValue,
    value: controlledValue ?? initialValue,
  }))
  const [open, setOpen] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [placeholderFading, setPlaceholderFading] = useState(false)
  const [typedPlaceholder, setTypedPlaceholder] = useState('')
  const [placeholderDeleting, setPlaceholderDeleting] = useState(false)
  const [asyncSuggestions, setAsyncSuggestions] = useState<CardSuggestion[]>([])
  const didMountRef = useRef(false)
  const onValueChangeRef = useRef(onValueChange)

  if (controlledValue !== undefined && controlledValue !== draftState.controlledValue && controlledValue !== draftState.value) {
    setDraftState({ controlledValue, value: controlledValue })
  }

  const searchValue = draftState.value
  const trimmedValue = useMemo(() => searchValue.trim(), [searchValue])
  const deferredSearchValue = useDeferredValue(searchValue)
  const deferredTrimmedValue = useMemo(() => deferredSearchValue.trim(), [deferredSearchValue])
  const visibleSuggestions = useMemo<CardSuggestion[]>(() => {
    if (deferredTrimmedValue.length < 2 || !showSuggestions) return []
    return (suggestions ?? asyncSuggestions).slice(0, 6)
  }, [asyncSuggestions, deferredTrimmedValue.length, showSuggestions, suggestions])
  const activePlaceholder =
    trimmedValue.length === 0 && rotatingPlaceholders && rotatingPlaceholders.length > 0
      ? placeholderMode === 'type'
        ? typedPlaceholder
        : rotatingPlaceholders[placeholderIndex % rotatingPlaceholders.length]
      : placeholder

  useEffect(() => {
    onValueChangeRef.current = onValueChange
  }, [onValueChange])

  useEffect(() => {
    if (!showSuggestions || suggestions || deferredTrimmedValue.length < 2) {
      return
    }

    let cancelled = false
    import('@/lib/client-catalog')
      .then(({ getClientAutocompleteSuggestions }) => getClientAutocompleteSuggestions(deferredTrimmedValue, 6))
      .then((nextSuggestions) => {
        if (!cancelled) setAsyncSuggestions(nextSuggestions)
      })
      .catch(() => {
        if (!cancelled) setAsyncSuggestions([])
      })

    return () => {
      cancelled = true
    }
  }, [deferredTrimmedValue, showSuggestions, suggestions])

  useEffect(() => {
    if (!onValueChangeRef.current) return

    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }

    const timeoutId = window.setTimeout(() => {
      onValueChangeRef.current?.(searchValue)
    }, debounceMs)

    return () => window.clearTimeout(timeoutId)
  }, [debounceMs, searchValue])

  useEffect(() => {
    if (
      placeholderMode !== 'swap' ||
      !rotatingPlaceholders ||
      rotatingPlaceholders.length === 0 ||
      trimmedValue.length > 0
    ) {
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
  }, [placeholderIndex, placeholderMode, rotatingPlaceholders, trimmedValue.length])

  useEffect(() => {
    if (
      placeholderMode !== 'type' ||
      !rotatingPlaceholders ||
      rotatingPlaceholders.length === 0 ||
      trimmedValue.length > 0
    ) {
      return
    }

    const target = rotatingPlaceholders[placeholderIndex % rotatingPlaceholders.length] ?? ''

    if (!placeholderDeleting && typedPlaceholder === target) {
      const holdId = window.setTimeout(() => {
        setPlaceholderDeleting(true)
      }, 1800)

      return () => window.clearTimeout(holdId)
    }

    if (placeholderDeleting) {
      const deleteId = window.setTimeout(() => {
        if (typedPlaceholder.length === 0) {
          setPlaceholderDeleting(false)
          setPlaceholderIndex((current) => (current + 1) % rotatingPlaceholders.length)
          return
        }

        setTypedPlaceholder((current) => current.slice(0, -1))
      }, 42)

      return () => window.clearTimeout(deleteId)
    }

    if (typedPlaceholder.length < target.length) {
      const typeId = window.setTimeout(() => {
        setTypedPlaceholder(target.slice(0, typedPlaceholder.length + 1))
      }, typedPlaceholder.length === 0 ? 220 : 78)

      return () => window.clearTimeout(typeId)
    }
  }, [placeholderDeleting, placeholderIndex, placeholderMode, rotatingPlaceholders, trimmedValue.length, typedPlaceholder])

  return (
    <div className="search-shell">
      <form
        className="search-form"
        onSubmit={(event) => {
          event.preventDefault()
          const normalizedValue = searchValue.trim()
          onValueChangeRef.current?.(searchValue)
          router.push(normalizedValue ? `${submitPath}?q=${encodeURIComponent(normalizedValue)}` : submitPath)
          setOpen(false)
        }}
      >
        <input
          autoComplete="off"
          className={`search-input ${large ? 'search-input-large' : ''} ${variant === 'command' ? 'search-input-command' : ''}`}
          enterKeyHint="search"
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onChange={(event) => {
            const nextValue = event.target.value
            setDraftState({ controlledValue, value: nextValue })
            if (nextValue.trim().length > 0) {
              setPlaceholderFading(false)
            } else if (placeholderMode === 'type') {
              setTypedPlaceholder('')
              setPlaceholderDeleting(false)
            }
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={rotatingPlaceholders?.length ? '' : activePlaceholder}
          type="search"
          value={searchValue}
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
                  <img alt="" className="search-suggestion-thumb" decoding="async" loading="lazy" src={suggestion.thumbnailUrl} />
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
