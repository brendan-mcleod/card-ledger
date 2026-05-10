# 1948 Bowman Image Sources

Slabbed supports three displayable image source classes for 1948 Bowman:

- `verified_public_domain`: reviewed public-domain/open files, currently imported from Wikimedia Commons and cached locally.
- `licensed` / `user_uploaded`: future production-safe scans supplied by Slabbed or a collector.
- `external_attributed`: third-party images displayed from the provider with source links and attribution, not cached locally and not treated as public-domain. These must pass visual review and cannot contain visible marketplace wordmarks.

## Commons Import

Run:

```bash
pnpm import:bowman-1948-images
```

This imports only Wikimedia Commons files that pass the current public-domain metadata check.

## External Attributed Sources

### COMC review manifest

Run:

```bash
pnpm import:bowman-1948-comc-images
```

The importer reads `data/bowman1948ComcImageSources.json`, verifies each image URL returns an image response, requires `visualReview: "approved_no_wordmark"`, and writes external-attributed front/back metadata into `data/bowman1948Catalog.generated.json`.

External marketplace images should be displayed only when the scan is visually clean, attributed, source-linked, and free of visible marketplace wordmarks. They should not be downloaded into `public/cards/` or marked `verified_public_domain`.

To add more COMC-backed cards, add entries with:

- `cardNumber`
- `player`
- `comcCardUrl`
- `frontImageUrl`
- `backImageUrl`
- `attributionText`
- `rightsNote`
- `confidence`
- `visualReview`: must be `approved_no_wordmark` to attach images

The app will render those images once their `frontImageRightsStatus` / `backImageRightsStatus` is `external_attributed`.

### Vintage Card Prices front-image manifest

Run:

```bash
pnpm import:bowman-1948-vcp-images
```

The importer reads `data/bowman1948VcpImageSources.json` and attaches only front images that are explicitly marked `visualReview: "approved_no_wordmark"`. These images fill missing 1948 Bowman fronts from clean card-only VCP scans, but remain `external_attributed` rather than local public-domain assets.

The VCP importer does not attach backs. Backs should remain placeholders unless a clean, source-reviewed back image is added through a public-domain, licensed, user-uploaded, or approved no-wordmark external source.
