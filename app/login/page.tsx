import { Suspense } from 'react'

import { AuthView } from '@/app/components/auth-view'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthView />
    </Suspense>
  )
}
