"use client"

import { useActionState, useEffect, useRef } from "react"
import { useFormStatus } from "react-dom"

import { createCollection } from "@/app/actions"
import {
  initialCreateCollectionFormState,
  type CreateCollectionFormState,
} from "@/app/create-collection-form-state"

function normalizeFormState(
  state: Partial<CreateCollectionFormState> | undefined,
): CreateCollectionFormState {
  return {
    success: state?.success ?? initialCreateCollectionFormState.success,
    errors: {
      ...initialCreateCollectionFormState.errors,
      ...(state?.errors ?? {}),
    },
    values: {
      ...initialCreateCollectionFormState.values,
      ...(state?.values ?? {}),
    },
  }
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button className="button button-secondary" type="submit" disabled={pending}>
      {pending ? "Building Shelf..." : "Create Collection"}
    </button>
  )
}

export function CreateCollectionForm() {
  const [state, formAction] = useActionState(
    createCollection,
    initialCreateCollectionFormState,
  )
  const formState = normalizeFormState(state)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (formState.success) {
      formRef.current?.reset()
    }
  }, [formState.success])

  return (
    <form
      id="create-collection"
      ref={formRef}
      action={formAction}
      className="panel form-panel compact-form-panel"
    >
      <div className="panel-header">
        <p className="eyebrow">Build The Shelf</p>
        <h2>Create a collection</h2>
        <p className="panel-copy">
          Start a new lane for a team PC, vintage run, rookie stash, or a favorite set.
        </p>
      </div>

      <div className="form-grid single-column">
        <label className="field">
          <span>Collection name</span>
          <input name="name" defaultValue={formState.values.name} />
          {formState.errors.name ? (
            <small className="field-error">{formState.errors.name}</small>
          ) : null}
        </label>

        <label className="field">
          <span>Description</span>
          <textarea
            name="description"
            rows={4}
            defaultValue={formState.values.description}
            placeholder="What belongs in this box, binder, or long-term chase?"
          />
          {formState.errors.description ? (
            <small className="field-error">{formState.errors.description}</small>
          ) : null}
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
