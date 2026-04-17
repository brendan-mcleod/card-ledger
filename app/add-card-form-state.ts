export type AddCardFormState = {
  errors: {
    playerName?: string
    year?: string
    setName?: string
    cardTitle?: string
    team?: string
    collectionId?: string
    notes?: string
    form?: string
  }
  values: {
    playerName: string
    year: string
    setName: string
    cardTitle: string
    team: string
    collectionId: string
    notes: string
    isFavorite: boolean
  }
  success: boolean
}

export const initialAddCardFormState: AddCardFormState = {
  errors: {},
  values: {
    playerName: '',
    year: '',
    setName: '',
    cardTitle: '',
    team: '',
    collectionId: '',
    notes: '',
    isFavorite: false,
  },
  success: false,
}
