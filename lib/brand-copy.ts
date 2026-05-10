export const brandCopy = {
  name: 'Slabbed',
  corePromise: 'A visual home for vintage card collectors.',
  primaryTagline: 'Vintage card collecting, built for the modern collector.',
  supportingLine: 'Browse fronts and backs, track what you own and want, and share a shelf around the cards you love.',
  seo: {
    defaultDescription: 'A visual home for vintage card collectors: browse fronts and backs, track what you own and want, and share a shelf around the cards you love.',
    shortDescription: 'Browse fronts and backs, track cards, and share a vintage card shelf.',
  },
  pages: {
    home: {
      eyebrow: 'Vintage card collecting',
      headline: 'Vintage card collecting, built for the modern collector.',
      subhead: 'Browse fronts and backs, track what you own and want, and share a shelf around the cards you love.',
      primaryCta: 'Browse Cards',
      secondaryCta: 'View Demo Shelf',
      finalHeadline: 'Start a shelf.',
      finalCopy: 'Browse cards, flip backs, and track what you own.',
    },
    discover: {
      title: 'Discover vintage baseball cards',
      subtitle: 'Search, filter, and explore pre-war sets, stars, teams, and oddball runs.',
      seoTitle: 'Discover vintage baseball cards | Slabbed',
      seoDescription: 'Search and browse vintage baseball cards by player, team, set, rookie status, Hall of Fame subjects, and collector runs.',
    },
    sets: {
      title: 'Sets',
      subtitle: 'Browse vintage checklists.',
      seoTitle: 'Vintage baseball card sets | Slabbed',
      seoDescription: 'Browse vintage baseball card checklists with set context, key cards, and collection progress.',
    },
    search: {
      title: 'Search Slabbed',
      emptySubtitle: 'Find players, teams, sets, card numbers, and tobacco backs.',
      seoTitle: 'Search vintage baseball cards | Slabbed',
      seoDescription: 'Search vintage baseball cards by player, team, set, card number, and tobacco back.',
    },
    collection: {
      title: 'Collection',
      subtitle: 'Cards you own, organized by shelf.',
    },
    watchlist: {
      title: 'Watchlist',
      subtitle: 'Cards you want to come back to.',
    },
    settings: {
      title: 'Settings',
      subtitle: 'Profile, privacy, and card display.',
    },
    profile: {
      shelfDescription: (displayName: string) => `View ${displayName}'s vintage card shelf on Slabbed.`,
    },
  },
  vocabulary: {
    set: 'An official checklist, such as T206 White Border or 1952 Topps.',
    run: 'A collector chase inside or across sets, such as Hall Pass or Southern Charm.',
    shelf: 'The visual profile where a collector shows cards, progress, and favorites.',
  },
} as const

export type BrandCopy = typeof brandCopy
