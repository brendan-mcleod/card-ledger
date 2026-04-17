export type CreateCollectionFormState = {
  errors: {
    name?: string
    description?: string
    form?: string
  }
  values: {
    name: string
    description: string
  }
  success: boolean
}

export const initialCreateCollectionFormState: CreateCollectionFormState = {
  errors: {},
  values: {
    name: '',
    description: '',
  },
  success: false,
}
