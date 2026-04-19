import { redirect } from 'next/navigation'

type CollectionSetPageProps = {
  params: Promise<{
    setSlug: string
  }>
}

export default async function CollectionSetPage({ params }: CollectionSetPageProps) {
  const { setSlug } = await params

  redirect(`/sets/${setSlug}`)
}
