import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type { CollectorState } from '@/lib/types'

type UntypedSupabaseAdmin = Omit<ReturnType<typeof getSupabaseAdmin>, 'from'> & {
  // The project does not currently generate Supabase database types, so new tables
  // are accessed through the generic PostgREST surface until typed schemas exist.
  from: (relation: 'collector_states') => {
    select: (columns: string) => {
      eq: (column: 'user_id', value: string) => {
        maybeSingle: () => Promise<{
          data: { state: CollectorState | null; updated_at: string | null } | null
          error: { message: string } | null
        }>
      }
    }
    upsert: (
      values: { user_id: string; state: CollectorState; updated_at: string },
      options: { onConflict: 'user_id' },
    ) => Promise<{ error: { message: string } | null }>
  }
}

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

export async function GET(request: NextRequest) {
  let userId: string | null = null

  try {
    userId = await getAuthenticatedUserId(request)
  } catch {
    return NextResponse.json({ error: 'Collector account storage is not configured.' }, { status: 503 })
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin() as unknown as UntypedSupabaseAdmin
  const collectorStates = supabase.from('collector_states')
  const { data, error } = await collectorStates
    .select('state, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ state: data?.state ?? null, updatedAt: data?.updated_at ?? null })
}

export async function PUT(request: NextRequest) {
  let userId: string | null = null

  try {
    userId = await getAuthenticatedUserId(request)
  } catch {
    return NextResponse.json({ error: 'Collector account storage is not configured.' }, { status: 503 })
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as { state?: CollectorState } | null
  if (!body?.state) {
    return NextResponse.json({ error: 'Missing collector state.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin() as unknown as UntypedSupabaseAdmin
  const collectorStates = supabase.from('collector_states')
  const { error } = await collectorStates
    .upsert(
      {
        user_id: userId,
        state: body.state,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
