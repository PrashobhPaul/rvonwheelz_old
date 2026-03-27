

## Plan: Multi-Destination Support

### Summary
Replace the current fixed "office" location with a dropdown of 35+ destinations. Rides will always have one end at "Raheja Vistas Elite, Nacharam" and the other end selected from a predefined list. The direction toggle and ride cards will reflect the chosen destination.

### Database Migration
Add a `destination` column (text, not null, default `'Nanakramguda – Sattva Knowledge City Main Gate'`) to the `rides` table. The default preserves backward compatibility with existing rides.

```sql
ALTER TABLE public.rides ADD COLUMN destination text NOT NULL DEFAULT 'Nanakramguda – Sattva Knowledge City Main Gate';
```

### Code Changes

**1. `src/lib/types.ts`** — Update constants and helpers
- Replace `LOCATIONS` with `HOME_LOCATION = "Raheja Vistas Elite, Nacharam"` and a `DESTINATIONS` array containing all 35 locations.
- Update `Ride` interface to include `destination: string`.
- Update `getDirectionLabel()` to use ride's destination instead of hardcoded office.

**2. `src/components/DirectionToggle.tsx`** — Accept optional `destination` prop
- Display the selected destination name (or a default) instead of the hardcoded office name.
- Keep the toggle behavior for switching direction (from/to home).

**3. `src/components/OfferRideForm.tsx`** — Add destination dropdown
- Add a `<Select>` dropdown populated with the `DESTINATIONS` array, defaulting to "Nanakramguda – Sattva Knowledge City Main Gate".
- Pass `destination` to the `useCreateRide` mutation.
- Pass selected destination to `DirectionToggle` for visual preview.

**4. `src/hooks/useRides.ts`** — Include `destination` in create mutation
- Add `destination` field to the insert payload in `useCreateRide`.

**5. `src/components/RideCard.tsx`** — Show destination
- Display the destination name in the card details (e.g., as a badge or text line below the direction badge).
- Update `getDirectionShort` usage to include destination context.

**6. `src/pages/Index.tsx`** — Add destination filter
- Add a destination filter dropdown alongside the existing date filter so users can filter rides by destination.
- Pass filter to the filtered rides logic.

**7. `src/pages/PublicProfile.tsx`** — Minor update
- If ride history is displayed, show destination for each ride.

### Technical Notes
- The `Select` component from `@/components/ui/select` is already available.
- Existing rides will default to the Sattva Knowledge City destination via the DB default.
- The direction concept ("to-office"/"to-home") remains but is now relative to the selected destination, not a hardcoded office.

