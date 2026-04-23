type UserAvatarProps = {
  name: string
  size?: 'sm' | 'md' | 'lg'
  imageUrl?: string | null
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function UserAvatar({ name, size = 'md', imageUrl }: UserAvatarProps) {
  return (
    <span className={`user-avatar user-avatar-${size}`}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={name} className="user-avatar-image" src={imageUrl} />
      ) : (
        <span className="user-avatar-fallback">{getInitials(name)}</span>
      )}
    </span>
  )
}
