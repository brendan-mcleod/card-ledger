"use client"

import { useActionState, useEffect, useRef } from "react"
import { useFormStatus } from "react-dom"

import { addCard } from "@/app/actions"
import {
  initialAddCardFormState,
  type AddCardFormState,
} from "@/app/add-card-form-state"

type CollectionOption = {
  id: string
  name: string
}

function normalizeFormState(
  state: Partial<AddCardFormState> | undefined,
): AddCardFormState {
  return {
    success: state?.success ?? initialAddCardFormState.success,
    errors: {
      ...initialAddCardFormState.errors,
      ...(state?.errors ?? {}),
    },
    values: {
      ...initialAddCardFormState.values,
      ...(state?.values ?? {}),
    },
  }
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button className="button button-primary" type="submit" disabled={pending}>
      {pending ? "Logging Card..." : "Add Card"}
    </button>
  )
}

export function AddCardForm({
  collections,
}: {
  collections: CollectionOption[]
}) {
  const [state, formAction] = useActionState(addCard, initialAddCardFormState)
  const formState = normalizeFormState(state)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (formState.success) {
      formRef.current?.reset()
    }
  }, [formState.success])

  return (
    <form id="add-card" ref={formRef} action={formAction} className="panel form-panel">
      <div className="panel-header">
        <p className="eyebrow">Add To Ledger</p>
        <h2>Log a new card</h2>
        <p className="panel-copy">
          Capture the basics now and keep the shelf feeling alive as new pickups come in.
        </p>
      </div>

      <div className="form-grid">
        <label className="field field-span-2">
          <span>Player name</span>
          <input name="playerName" defaultValue={formState.values.playerName} />
          {formState.errors.playerName ? (
            <small className="field-error">{formState.errors.playerName}</small>
          ) : null}
        </label>

        <label className="field">
          <span>Year</span>
          <input
            name="year"
            type="number"
            inputMode="numeric"
            defaultValue={formState.values.year}
          />
          {formState.errors.year ? (
            <small className="field-error">{formState.errors.year}</small>
          ) : null}
        </label>

        <label className="field">
          <span>Team</span>
          <input name="team" defaultValue={formState.values.team} />
          {formState.errors.team ? (
            <small className="field-error">{formState.errors.team}</small>
          ) : null}
        </label>

        <label className="field">
          <span>Set name</span>
          <input name="setName" defaultValue={formState.values.setName} />
          {formState.errors.setName ? (
            <small className="field-error">{formState.errors.setName}</small>
          ) : null}
        </label>

        <label className="field">
          <span>Card title</span>
          <input name="cardTitle" defaultValue={formState.values.cardTitle} />
          {formState.errors.cardTitle ? (
            <small className="field-error">{formState.errors.cardTitle}</small>
          ) : null}
        </label>

        <label className="field field-span-2">
          <span>Collection</span>
          <select name="collectionId" defaultValue={formState.values.collectionId}>
            <option value="">Select a collection</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </select>
          {formState.errors.collectionId ? (
            <small className="field-error">{formState.errors.collectionId}</small>
          ) : null}
        </label>

        <label className="field field-span-2">
          <span>Notes</span>
          <textarea
            name="notes"
            rows={4}
            defaultValue={formState.values.notes}
            placeholder="Condition, pickup story, grading plans, or anything worth remembering."
          />
        </label>

        <label className="checkbox-field field-span-2">
          <input
            name="isFavorite"
            type="checkbox"
            defaultChecked={formState.values.isFavorite}
          />
          <span>Mark as a favorite in the collection</span>
        </label>
      </div>

      {formState.errors.form ? (
        <p className="form-error-banner">{formState.errors.form}</p>
      ) : null}

      <div className="form-actions">
        <SubmitButton />
      </div>
    </form>
  )
}
