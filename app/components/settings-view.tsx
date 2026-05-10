'use client'

import { useEffect, useState } from 'react'

import { AccountSectionNav } from '@/app/components/account-section-nav'
import { useCollector } from '@/app/components/collector-provider'
import { brandCopy } from '@/lib/brand-copy'
import type { CollectorPreferences, CollectorProfile } from '@/lib/types'

function PreferenceGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}) {
  return (
    <div className="settings-field settings-field-full">
      <span className="settings-label">{label}</span>
      <div className="settings-segmented-control" role="tablist" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            className={`settings-segment ${value === option.value ? 'settings-segment-active' : ''}`}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function SettingsView() {
  const collector = useCollector()
  const [profileDraft, setProfileDraft] = useState<CollectorProfile>(collector.profile)
  const [preferenceDraft, setPreferenceDraft] = useState<CollectorPreferences>(collector.preferences)
  const [status, setStatus] = useState<'idle' | 'saved'>('idle')

  useEffect(() => {
    if (status !== 'saved') {
      return
    }

    const timeoutId = window.setTimeout(() => setStatus('idle'), 1800)
    return () => window.clearTimeout(timeoutId)
  }, [status])

  const lockedUsername = collector.profile.username || collector.currentUser.username

  const errors = {
    displayName: profileDraft.displayName.trim().length === 0 ? 'Display name is required.' : '',
  }

  const hasErrors = Boolean(errors.displayName)
  const isDirty =
    JSON.stringify({
      username: lockedUsername,
      displayName: profileDraft.displayName.trim(),
      bio: profileDraft.bio.trim(),
      favoriteTeam: profileDraft.favoriteTeam.trim(),
      location: profileDraft.location?.trim() ?? '',
      imageUrl: profileDraft.imageUrl?.trim() ?? '',
    }) !==
      JSON.stringify({
        username: lockedUsername,
        displayName: collector.profile.displayName.trim(),
        bio: collector.profile.bio.trim(),
        favoriteTeam: collector.profile.favoriteTeam.trim(),
        location: collector.profile.location ?? '',
        imageUrl: collector.profile.imageUrl ?? '',
      }) || JSON.stringify(preferenceDraft) !== JSON.stringify(collector.preferences)

  function updateProfileField<K extends keyof CollectorProfile>(key: K, value: CollectorProfile[K]) {
    setProfileDraft((current) => ({
      ...current,
      [key]: value,
    }))
    setStatus('idle')
  }

  function updatePreferenceField<K extends keyof CollectorPreferences>(key: K, value: CollectorPreferences[K]) {
    setPreferenceDraft((current) => ({
      ...current,
      [key]: value,
    }))
    setStatus('idle')
  }

  function handleSave() {
    if (hasErrors) {
      return
    }

    const nextProfile: CollectorProfile = {
      ...profileDraft,
      displayName: profileDraft.displayName.trim(),
      username: lockedUsername,
      bio: profileDraft.bio.trim(),
      favoriteTeam: profileDraft.favoriteTeam.trim(),
      location: profileDraft.location?.trim() || '',
      imageUrl: profileDraft.imageUrl?.trim() || null,
    }

    collector.updateProfile({
      ...nextProfile,
    })
    collector.updatePreferences(preferenceDraft)
    setProfileDraft(nextProfile)
    setStatus('saved')
  }

  return (
    <main className="page-shell settings-page">
      <AccountSectionNav />

      <section className="settings-topbar">
        <div className="settings-topbar-copy">
          <h1 className="feed-page-title">{brandCopy.pages.settings.title}</h1>
          <p className="settings-intro">{brandCopy.pages.settings.subtitle}</p>
        </div>

        <div className="settings-action-row">
          {status === 'saved' ? <span className="settings-saved-pill">Saved</span> : null}
          <button className="button-primary" disabled={!isDirty || hasErrors} onClick={handleSave} type="button">
            Save changes
          </button>
        </div>
      </section>

      <section className="settings-layout">
        <div className="settings-main-column">
          <section className="section-panel settings-section settings-account-section panel-stack-sm">
            <div className="settings-section-heading">
              <div>
                <h2 className="profile-section-title">Account</h2>
                <p className="profile-section-subtitle">Your Slabbed identity.</p>
              </div>
            </div>

            <div className="settings-static-row settings-account-row">
              <span>Username</span>
              <strong>@{lockedUsername}</strong>
              <small>Usernames are set when the account is created.</small>
            </div>
          </section>

          <section className="section-panel settings-section panel-stack-md">
            <div className="settings-section-heading">
              <div>
                <h2 className="profile-section-title">Profile</h2>
                <p className="profile-section-subtitle">Shown on your public shelf.</p>
              </div>
            </div>

            <div className="settings-form-grid">
              <label className="settings-field">
                <span className="settings-label">Display name</span>
                <input
                  className="settings-input"
                  onChange={(event) => updateProfileField('displayName', event.target.value)}
                  type="text"
                  value={profileDraft.displayName}
                />
                {errors.displayName ? <span className="settings-error">{errors.displayName}</span> : null}
              </label>

              <label className="settings-field">
                <span className="settings-label">Location</span>
                <input
                  className="settings-input"
                  onChange={(event) => updateProfileField('location', event.target.value)}
                  type="text"
                  value={profileDraft.location ?? ''}
                />
              </label>

              <label className="settings-field">
                <span className="settings-label">Favorite team</span>
                <input
                  className="settings-input"
                  onChange={(event) => updateProfileField('favoriteTeam', event.target.value)}
                  type="text"
                  value={profileDraft.favoriteTeam}
                />
              </label>

              <label className="settings-field settings-field-full">
                <span className="settings-label">Avatar image URL</span>
                <input
                  className="settings-input"
                  onChange={(event) => updateProfileField('imageUrl', event.target.value)}
                  placeholder="https://…"
                  type="text"
                  value={profileDraft.imageUrl ?? ''}
                />
              </label>

              <label className="settings-field settings-field-full">
                <span className="settings-label">Bio</span>
                <textarea
                  className="settings-textarea"
                  onChange={(event) => updateProfileField('bio', event.target.value)}
                  rows={4}
                  value={profileDraft.bio}
                />
              </label>
            </div>
          </section>

          <section className="section-panel settings-section panel-stack-md">
            <div className="settings-section-heading">
              <div>
                <h2 className="profile-section-title">Visibility</h2>
                <p className="profile-section-subtitle">Choose what other collectors can see.</p>
              </div>
            </div>

            <div className="settings-form-grid">
              <PreferenceGroup
                label="Collection visibility"
                onChange={(value) => updatePreferenceField('collectionVisibility', value)}
                options={[
                  { value: 'public', label: 'Public' },
                  { value: 'private', label: 'Private' },
                ]}
                value={preferenceDraft.collectionVisibility}
              />

              <PreferenceGroup
                label="Watchlist visibility"
                onChange={(value) => updatePreferenceField('wishlistVisibility', value)}
                options={[
                  { value: 'public', label: 'Public' },
                  { value: 'private', label: 'Private' },
                ]}
                value={preferenceDraft.wishlistVisibility}
              />

              <PreferenceGroup
                label="Showcase visibility"
                onChange={(value) => updatePreferenceField('showcaseVisibility', value)}
                options={[
                  { value: 'public', label: 'Public' },
                  { value: 'private', label: 'Private' },
                ]}
                value={preferenceDraft.showcaseVisibility}
              />
            </div>
          </section>

          <section className="section-panel settings-section panel-stack-md">
            <div className="settings-section-heading">
              <div>
                <h2 className="profile-section-title">Display</h2>
                <p className="profile-section-subtitle">Your default browsing view.</p>
              </div>
            </div>

            <div className="settings-form-grid">
              <PreferenceGroup
                label="Default card view"
                onChange={(value) => updatePreferenceField('defaultLibraryView', value)}
                options={[
                  { value: 'grid', label: 'Grid' },
                  { value: 'list', label: 'List' },
                ]}
                value={preferenceDraft.defaultLibraryView}
              />

              <PreferenceGroup
                label="Default card visual"
                onChange={(value) => updatePreferenceField('defaultCardVisual', value)}
                options={[
                  { value: 'front', label: 'Fronts only' },
                  { value: 'flip', label: 'Allow flip' },
                ]}
                value={preferenceDraft.defaultCardVisual}
              />

              <p className="settings-source-note settings-field-full">
                Slabbed shows source-safe card images on public pages.
              </p>
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}
