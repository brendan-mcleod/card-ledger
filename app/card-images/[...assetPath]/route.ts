import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { NextResponse } from 'next/server'

import { toCardStorageRelativePath } from '@/lib/card-asset-url'

export const runtime = 'nodejs'

const contentTypes: Record<string, string> = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

type CardImageRouteContext = {
  params: Promise<{
    assetPath: string[]
  }>
}

export async function GET(_request: Request, { params }: CardImageRouteContext) {
  const { assetPath } = await params
  const storagePath = toCardStorageRelativePath(assetPath)
  const root = path.join(process.cwd(), 'public', 'cards')
  const filePath = path.resolve(root, storagePath)

  if (!filePath.startsWith(`${root}${path.sep}`)) {
    return new NextResponse('Not found', { status: 404 })
  }

  try {
    const body = await readFile(filePath)
    const extension = path.extname(filePath).toLowerCase()
    return new NextResponse(new Uint8Array(body), {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Type': contentTypes[extension] ?? 'application/octet-stream',
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
