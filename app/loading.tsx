export default function Loading() {
  return (
    <main className="app-loading-screen" aria-label="Loading Slabbed">
      <div className="app-loading-brand" aria-hidden="true">
        <span className="brand-mark">
          <svg aria-hidden="true" className="brand-mark-svg" viewBox="0 0 24 24">
            <rect x="6.25" y="4.25" width="11.5" height="15.5" rx="2.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <path d="M9 8.5h6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
            <path d="M9 11.7h6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
            <path d="M9 14.9h4.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
            <path d="M4.9 7.1v8.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeOpacity="0.5" strokeWidth="1.2" />
            <path d="M19.1 7.1v8.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeOpacity="0.5" strokeWidth="1.2" />
          </svg>
        </span>
        <span className="brand-name">Slabbed</span>
      </div>
    </main>
  )
}
