export type CatalogRuntimeSource = 'static' | 'hybrid' | 'db'

export function getCatalogRuntimeSource(): CatalogRuntimeSource {
  const source = process.env.CATALOG_RUNTIME_SOURCE?.trim().toLowerCase()

  if (source === 'hybrid' || source === 'db') {
    return source
  }

  return 'static'
}

export function shouldUseCatalogDatabase() {
  return getCatalogRuntimeSource() !== 'static'
}

export function getCatalogDatabaseTimeoutMs() {
  const timeout = Number(process.env.CATALOG_DATABASE_TIMEOUT_MS ?? '750')
  return Number.isFinite(timeout) && timeout > 0 ? timeout : 750
}

export async function withCatalogDatabaseTimeout<T>(operation: Promise<T>, fallback: T) {
  if (getCatalogRuntimeSource() === 'db') {
    return operation
  }

  return Promise.race([
    operation,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), getCatalogDatabaseTimeoutMs())
    }),
  ])
}
