import type { Metadata } from 'next'

import { AuthRequired } from '@/app/components/auth-required'
import { SettingsView } from '@/app/components/settings-view'
import { brandCopy } from '@/lib/brand-copy'

export const metadata: Metadata = {
  title: `${brandCopy.pages.settings.title} | Slabbed`,
  description: brandCopy.pages.settings.subtitle,
}

export default function SettingsPage() {
  return (
    <AuthRequired title="Sign in to manage settings.">
      <SettingsView />
    </AuthRequired>
  )
}
