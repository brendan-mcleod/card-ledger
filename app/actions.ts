'use server'

import { revalidatePath } from 'next/cache'

import { prisma } from '@/lib/prisma'
import {
  initialAddCardFormState,
  type AddCardFormState,
} from '@/app/add-card-form-state'
import {
  initialCreateCollectionFormState,
  type CreateCollectionFormState,
} from '@/app/create-collection-form-state'

function normalizeTextValue(formData: FormData, key: string) {
  return formData.get(key)?.toString().trim() ?? ''
}

export async function addCard(
  _prevState: AddCardFormState,
  formData: FormData,
): Promise<AddCardFormState> {
  const playerName = normalizeTextValue(formData, 'playerName')
  const yearValue = normalizeTextValue(formData, 'year')
  const setName = normalizeTextValue(formData, 'setName')
  const cardTitle = normalizeTextValue(formData, 'cardTitle')
  const team = normalizeTextValue(formData, 'team')
  const collectionId = normalizeTextValue(formData, 'collectionId')
  const notes = normalizeTextValue(formData, 'notes')
  const isFavorite = formData.get('isFavorite') === 'on'

  const errors: AddCardFormState['errors'] = {}
  const year = Number(yearValue)
  const currentYear = new Date().getFullYear() + 1

  if (!playerName) {
    errors.playerName = 'Player name is required.'
  }

  if (!yearValue) {
    errors.year = 'Year is required.'
  } else if (!Number.isInteger(year) || year < 1860 || year > currentYear) {
    errors.year = `Year must be a whole number between 1860 and ${currentYear}.`
  }

  if (!setName) {
    errors.setName = 'Set name is required.'
  }

  if (!cardTitle) {
    errors.cardTitle = 'Card title is required.'
  }

  if (!team) {
    errors.team = 'Team is required.'
  }

  if (!collectionId) {
    errors.collectionId = 'Please choose a collection.'
  }

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      values: {
        playerName,
        year: yearValue,
        setName,
        cardTitle,
        team,
        collectionId,
        notes,
        isFavorite,
      },
      success: false,
    }
  }

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    select: { id: true },
  })

  if (!collection) {
    return {
      errors: {
        collectionId: 'Selected collection was not found.',
      },
      values: {
        playerName,
        year: yearValue,
        setName,
        cardTitle,
        team,
        collectionId,
        notes,
        isFavorite,
      },
      success: false,
    }
  }

  try {
    await prisma.card.create({
      data: {
        playerName,
        year,
        setName,
        cardTitle,
        team,
        collectionId,
        notes: notes || null,
        isFavorite,
      },
    })
  } catch {
    return {
      errors: {
        form: 'Unable to save the card right now.',
      },
      values: {
        playerName,
        year: yearValue,
        setName,
        cardTitle,
        team,
        collectionId,
        notes,
        isFavorite,
      },
      success: false,
    }
  }

  revalidatePath('/')
  revalidatePath(`/collections/${collectionId}`)

  return {
    ...initialAddCardFormState,
    success: true,
  }
}

export async function createCollection(
  _prevState: CreateCollectionFormState,
  formData: FormData,
): Promise<CreateCollectionFormState> {
  const name = normalizeTextValue(formData, 'name')
  const description = normalizeTextValue(formData, 'description')

  const errors: CreateCollectionFormState['errors'] = {}

  if (!name) {
    errors.name = 'Collection name is required.'
  } else if (name.length < 2) {
    errors.name = 'Collection name must be at least 2 characters.'
  }

  if (description.length > 240) {
    errors.description = 'Description must be 240 characters or fewer.'
  }

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      values: {
        name,
        description,
      },
      success: false,
    }
  }

  const existingUser = await prisma.user.findFirst({
    select: { id: true },
  })

  const user =
    existingUser ??
    (await prisma.user.create({
      data: {
        email: 'collector@cardledger.app',
        name: 'Card Ledger Collector',
      },
      select: { id: true },
    }))

  if (!user) {
    return {
      errors: {
        form: 'A user record is required before creating a collection.',
      },
      values: {
        name,
        description,
      },
      success: false,
    }
  }

  try {
    await prisma.collection.create({
      data: {
        name,
        description: description || null,
        userId: user.id,
      },
    })
  } catch {
    return {
      errors: {
        form: 'Unable to create the collection right now.',
      },
      values: {
        name,
        description,
      },
      success: false,
    }
  }

  revalidatePath('/')

  return {
    ...initialCreateCollectionFormState,
    success: true,
  }
}
