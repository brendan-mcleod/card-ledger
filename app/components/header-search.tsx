'use client'

import { useState } from 'react'

import { SearchBar } from '@/app/components/search-bar'

export function HeaderSearch() {
  const [open, setOpen] = useState(false)

  return (
    <div className={`header-search ${open ? 'header-search-open' : ''}`}>
      <div className="header-search-panel">
        <SearchBar placeholder="Search cards, players, or sets" />
      </div>

      <button
        aria-expanded={open}
        aria-label="Search"
        className="header-search-toggle"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <svg aria-hidden="true" className="header-search-icon" viewBox="0 0 24 24">
          <path
            d="M15.5 15.5 21 21m-2.5-10a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      </button>
    </div>
  )
}
