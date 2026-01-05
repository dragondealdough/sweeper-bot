# Bug Fixes & Known Issues

## Fixed Bugs

### Camera not centering on mine when descending
**Date:** Jan 1, 2026
**Reported:** Player could run off-screen in the mine without camera following
**Cause:** 
1. Camera logic was accidentally modified during refactoring
2. Physics lacked explicit mine boundary checks (relied on `isSolid` alone)
**Fix:** 
1. Restored original camera logic:
   - In mine (y >= 0): `targetCamX = (COLUMNS * TILE_SIZE) / 2` = 320px (center of mine grid)
   - In overworld (y < 0): `targetCamX = (player.x * TILE_SIZE) + (TILE_SIZE / 2)` (follows player)
   - Camera Y always follows player with clamping to game bounds
2. Added explicit mine bounds in `usePhysics.ts`:
   - When `p.y >= 0`, player X is clamped to `0` to `COLUMNS - 1` (0 to 15)

### Interaction prompts appearing far from buildings
**Date:** Jan 1, 2026
**Reported:** "Interact" pop-ups appeared far to the left of buildings
**Cause:** Buildings were positioned using CSS `left-1/2` relative positioning while player used world coordinates
**Fix:** Changed building positioning to use same world coordinate system as player (`tileToPixel()`)

### Buildings floating above ground
**Date:** Jan 1, 2026
**Reported:** Buildings not aligned with grass floor
**Cause:** Incorrect `top` positioning calculations
**Fix:** Used `top: FLOOR_Y - BUILDING_HEIGHT` formula to place bottom of each building on the grass

### Disarmed mines not updating neighbor counts
**Date:** Jan 1, 2026
**Reported:** When disarming a mine, surrounding tile numbers didn't update
**Cause:** React's shallow comparison not detecting changes in nested objects
**Fix:** Deep copy grid at start of `revealTileAt` and create new tile objects when updating `neighborMines`

### Game not scaling with window resize
**Date:** Jan 1, 2026
**Reported:** Game elements stay fixed size when window is resized smaller
**Cause:** Fixed pixel values (40px tiles, 640px mine) without responsive scaling
**Fix:** Added responsive scaling system in `App.tsx`:
- Calculates scale factor based on available viewport size vs minimum game dimensions
- Applies CSS `transform: scale()` to the game container
- Uses `origin-top-left` for consistent scaling anchor point
- Min scale 0.5, max scale 1 (doesn't scale up)

### Sidebar overlapping game content / Mine not centered
**Date:** Jan 1, 2026
**Reported:** Left side of mine cut off, sidebar covering game content
**Cause:** 
1. GameHUD used `fixed` positioning (relative to browser window, not game container)
2. Camera calculation used full viewport width instead of visible game area (minus sidebar)
**Fix:**
1. Changed GameHUD from `fixed` to `absolute` positioning
2. Updated camera logic to subtract `SIDEBAR_WIDTH (256px)` from visible width
3. Added debug overlay (toggle with ~ key) to visualize camera and visibility issues

---

## Known Issues / TODO

- [ ] Pause menu not yet implemented
- [ ] Camera transition between overworld and mine could be smoother

---

## Debug Tips

- Player starts at tile x=8, y=-2 (overworld floor)
- Buildings are at: House(-2), Recycler(-8), Shop(13.5), Construction(22), Rope(8)
- Floor is at y=-1 (pixel y=-40 to y=0)
- Mine grid starts at y=0


