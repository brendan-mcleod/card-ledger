# Card Image Review Workflow

Slabbed can accept user-uploaded card images, but uploads should not become public catalog art automatically.

## Policy

- Users may upload clean scans/photos of the raw card only.
- Slabbed should discourage slab photos, screenshots, auction images, watermarked scans, and third-party copyrighted scans.
- Every upload is stored as a private `card-image-submissions` object first.
- Every upload creates a `card_image_submissions` row with `review_status = pending`.
- Public catalog images should only use uploads after admin review sets `review_status = approved` and `approved_rights_status = user_uploaded`.

## API Shape

- `POST /api/card-image-submissions`
  - Requires auth.
  - Creates a pending review row.
  - Returns a signed upload URL for the private `card-image-submissions` bucket.
- `GET /api/card-image-submissions`
  - Requires admin profile.
  - Lists pending submissions.
- `PATCH /api/card-image-submissions`
  - Requires admin profile.
  - Approves, rejects, or requests changes.

## Review Checklist

- Is this just the card, not a slab or holder?
- Is the scan/photo free of visible marketplace or grading-service wordmarks?
- Does the image match the submitted card id, player, set, card number, and side?
- Is the crop useful for the card visual?
- Is the user attesting that the image is their own scan/photo?

Approved images can later be promoted into card-level or copy-level display fields. Until then, catalog placeholders remain the safe default.
