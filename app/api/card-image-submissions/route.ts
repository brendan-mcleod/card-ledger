import { randomUUID } from 'node:crypto'

import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type { CardImageSubmissionSide } from '@/lib/types'

type SupabaseUploadAdmin = Omit<ReturnType<typeof getSupabaseAdmin>, 'from' | 'storage'> & {
  auth: ReturnType<typeof getSupabaseAdmin>['auth']
  from: (relation: 'card_image_submissions' | 'profiles') => {
    insert: (values: Record<string, unknown>) => {
      select: (columns: string) => {
        single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>
      }
    }
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: string) => {
        select: (columns: string) => {
          single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>
        }
      }
    }
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        order: (column: string, options: { ascending: boolean }) => {
          limit: (count: number) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>
        }
        maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>
      }
    }
  }
  storage: {
    from: (bucket: 'card-image-submissions' | 'card-images-approved') => {
      createSignedUploadUrl: (path: string) => Promise<{
        data: { path: string; token: string; signedUrl: string } | null
        error: { message: string } | null
      }>
      createSignedUrl: (path: string, expiresIn: number) => Promise<{
        data: { signedUrl: string } | null
        error: { message: string } | null
      }>
      download: (path: string) => Promise<{
        data: Blob | null
        error: { message: string } | null
      }>
      upload: (path: string, fileBody: Blob, options?: { contentType?: string; upsert?: boolean }) => Promise<{
        data: { path: string } | null
        error: { message: string } | null
      }>
      getPublicUrl: (path: string) => {
        data: { publicUrl: string }
      }
    }
  }
}

type SubmissionRow = {
  id: string
  user_id: string
  global_card_id: string
  user_card_copy_id?: string | null
  side: CardImageSubmissionSide
  storage_bucket: 'card-image-submissions'
  storage_path: string
  original_file_name?: string | null
  mime_type?: string | null
  file_size_bytes?: number | null
  rights_attestation: 'user_uploaded_own_scan'
  review_status: 'pending' | 'approved' | 'rejected' | 'needs_changes'
  review_notes?: string | null
  reviewed_by?: string | null
  reviewed_at?: string | null
  approved_image_url?: string | null
  approved_rights_status?: 'user_uploaded' | 'licensed' | null
  created_at: string
  updated_at: string
}

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const maxFileSizeBytes = 12 * 1024 * 1024

function bearerToken(request: NextRequest) {
  const header = request.headers.get('authorization')
  if (!header?.toLowerCase().startsWith('bearer ')) {
    return null
  }

  return header.slice('bearer '.length).trim()
}

async function getAuthenticatedUserId(request: NextRequest) {
  const token = bearerToken(request)
  if (!token) {
    return null
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    return null
  }

  return data.user.id
}

function sanitizeFileName(fileName: string) {
  const cleaned = fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return cleaned || 'card-image.jpg'
}

function isValidSide(side: unknown): side is CardImageSubmissionSide {
  return side === 'front' || side === 'back'
}

function isValidCardId(cardId: unknown): cardId is string {
  return typeof cardId === 'string' && /^[a-z0-9][a-z0-9-]{2,180}$/i.test(cardId)
}

async function isAdminUser(userId: string, supabase: SupabaseUploadAdmin) {
  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    return false
  }

  return data?.is_admin === true
}

export async function GET(request: NextRequest) {
  let userId: string | null = null

  try {
    userId = await getAuthenticatedUserId(request)
  } catch {
    return NextResponse.json({ error: 'Card image review storage is not configured.' }, { status: 503 })
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin() as unknown as SupabaseUploadAdmin
  const admin = await isAdminUser(userId, supabase)
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('card_image_submissions')
    .select('*')
    .eq('review_status', 'pending')
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const submissions = await Promise.all((data ?? []).map(async (submission) => {
    const row = submission as SubmissionRow
    const { data: signed, error: signedError } = await supabase
      .storage
      .from('card-image-submissions')
      .createSignedUrl(row.storage_path, 60 * 20)

    return {
      ...row,
      reviewImageUrl: signedError ? null : signed?.signedUrl ?? null,
    }
  }))

  return NextResponse.json({ submissions })
}

export async function POST(request: NextRequest) {
  let userId: string | null = null

  try {
    userId = await getAuthenticatedUserId(request)
  } catch {
    return NextResponse.json({ error: 'Card image upload storage is not configured.' }, { status: 503 })
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as {
    globalCardId?: unknown
    userCardCopyId?: unknown
    side?: unknown
    fileName?: unknown
    mimeType?: unknown
    fileSizeBytes?: unknown
  } | null

  if (!body || !isValidCardId(body.globalCardId) || !isValidSide(body.side)) {
    return NextResponse.json({ error: 'A valid card id and image side are required.' }, { status: 400 })
  }

  if (typeof body.fileName !== 'string' || typeof body.mimeType !== 'string') {
    return NextResponse.json({ error: 'File name and MIME type are required.' }, { status: 400 })
  }

  if (!allowedMimeTypes.has(body.mimeType)) {
    return NextResponse.json({ error: 'Upload a JPG, PNG, or WebP image.' }, { status: 400 })
  }

  if (typeof body.fileSizeBytes !== 'number' || body.fileSizeBytes <= 0 || body.fileSizeBytes > maxFileSizeBytes) {
    return NextResponse.json({ error: 'Image must be 12 MB or smaller.' }, { status: 400 })
  }

  const uploadId = randomUUID()
  const storagePath = `${userId}/${body.globalCardId}/${body.side}/${uploadId}-${sanitizeFileName(body.fileName)}`
  const supabase = getSupabaseAdmin() as unknown as SupabaseUploadAdmin
  const { data: upload, error: uploadError } = await supabase
    .storage
    .from('card-image-submissions')
    .createSignedUploadUrl(storagePath)

  if (uploadError || !upload) {
    return NextResponse.json({ error: uploadError?.message ?? 'Could not create upload URL.' }, { status: 500 })
  }

  const { data, error } = await supabase
    .from('card_image_submissions')
    .insert({
      id: uploadId,
      user_id: userId,
      global_card_id: body.globalCardId,
      user_card_copy_id: typeof body.userCardCopyId === 'string' ? body.userCardCopyId : null,
      side: body.side,
      storage_bucket: 'card-image-submissions',
      storage_path: storagePath,
      original_file_name: body.fileName,
      mime_type: body.mimeType,
      file_size_bytes: body.fileSizeBytes,
      rights_attestation: 'user_uploaded_own_scan',
      review_status: 'pending',
    })
    .select('id, review_status, storage_bucket, storage_path, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    submission: data,
    upload: {
      path: upload.path,
      token: upload.token,
      signedUrl: upload.signedUrl,
    },
  })
}

export async function PATCH(request: NextRequest) {
  let userId: string | null = null

  try {
    userId = await getAuthenticatedUserId(request)
  } catch {
    return NextResponse.json({ error: 'Card image review storage is not configured.' }, { status: 503 })
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin() as unknown as SupabaseUploadAdmin
  const admin = await isAdminUser(userId, supabase)
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 })
  }

  const body = await request.json().catch(() => null) as {
    submissionId?: unknown
    reviewStatus?: unknown
    reviewNotes?: unknown
    approvedImageUrl?: unknown
  } | null

  if (!body || typeof body.submissionId !== 'string') {
    return NextResponse.json({ error: 'Submission id is required.' }, { status: 400 })
  }

  if (!['approved', 'rejected', 'needs_changes'].includes(String(body.reviewStatus))) {
    return NextResponse.json({ error: 'Use approved, rejected, or needs_changes.' }, { status: 400 })
  }

  const reviewStatus = String(body.reviewStatus)
  let approvedImageUrl = reviewStatus === 'approved' && typeof body.approvedImageUrl === 'string'
    ? body.approvedImageUrl
    : null

  if (reviewStatus === 'approved' && !approvedImageUrl) {
    const { data: submission, error: submissionError } = await supabase
      .from('card_image_submissions')
      .select('*')
      .eq('id', body.submissionId)
      .maybeSingle()

    if (submissionError || !submission) {
      return NextResponse.json({ error: submissionError?.message ?? 'Submission not found.' }, { status: 404 })
    }

    const row = submission as SubmissionRow
    const { data: blob, error: downloadError } = await supabase
      .storage
      .from('card-image-submissions')
      .download(row.storage_path)

    if (downloadError || !blob) {
      return NextResponse.json({ error: downloadError?.message ?? 'Could not read uploaded image.' }, { status: 500 })
    }

    const approvedPath = `${row.global_card_id}/${row.side}/${row.id}-${sanitizeFileName(row.original_file_name ?? 'card-image.jpg')}`
    const { error: uploadError } = await supabase
      .storage
      .from('card-images-approved')
      .upload(approvedPath, blob, {
        contentType: row.mime_type ?? undefined,
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    approvedImageUrl = supabase
      .storage
      .from('card-images-approved')
      .getPublicUrl(approvedPath)
      .data.publicUrl
  }

  const { data, error } = await supabase
    .from('card_image_submissions')
    .update({
      review_status: reviewStatus,
      review_notes: typeof body.reviewNotes === 'string' ? body.reviewNotes : null,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      approved_image_url: approvedImageUrl,
      approved_rights_status: reviewStatus === 'approved' ? 'user_uploaded' : null,
    })
    .eq('id', body.submissionId)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ submission: data })
}
