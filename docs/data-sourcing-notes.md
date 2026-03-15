# Data sourcing notes (US FHR full list)

## Primary sources used

1. US Credit Card Guide FHR/THC map page:
   - https://www.uscreditcardguide.com/a-search-engine-for-amex-fhr-thc/
   - Embedded Google My Maps KML contains hotel points and metadata fields including `Program`, `Amex_Reservation`, and coordinates.
2. Proud Money reference page:
   - https://www.proudmoney.com/list-of-all-american-express-fine-hotels-resorts-and-the-hotel-collection/
   - Used as cross-check for property coverage by region and program labeling.

## Normalization logic

- Keep only rows where `Program = FHR`.
- Keep only AMEX property URLs whose state segment ends with `-US`.
- Parse `state`, `city`, and `hotel` from the AMEX URL pattern:
  `/property/<State-US>/<City>/<Hotel>`.
- Use map coordinates from `location` (fallback: KML `<coordinates>`).
- Deduplicate by AMEX URL.

## Known limitations

- Address, phone, and brand are not present in the KML metadata and remain `null`.
- `websiteUrl` is populated from the map's `hotelft_link` field when available.
- This dataset is sourced from a third-party maintained map and should be periodically revalidated against official AMEX travel inventory.
