import { CollectionSetView } from '@/app/components/collection-set-view'

type SetPageProps = {
  params: Promise<{
    setSlug: string
  }>
}

export default async function SetPage({ params }: SetPageProps) {
  const { setSlug } = await params

  return <CollectionSetView setSlug={setSlug} />
}
