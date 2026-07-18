# Donna — artwork to generate

The UI is fully functional without these; each image slot renders a designed
fallback until the file exists. Generate each prompt (Nano Banana Pro 2),
save the file at the exact path below, and it appears automatically —
no code changes needed.

Art direction, common to all: deep hunter green (#10201B), ivory paper
(#F2EDE0), polished brass (#C2A25B), warm tungsten lamplight, dark
editorial still-life photography. No people, no text, no logos, no
blue/purple tones.

---

## 1. `public/images/hero-desk.png` — landing hero backdrop

> Cinematic still-life photograph of an executive assistant's desk at dusk,
> shot from a low three-quarter angle. Deep hunter green leather desk mat
> (#10201B tones), a brass banker's lamp casting warm tungsten light from the
> upper left, a neat stack of ivory memo papers (#F2EDE0), a fountain pen
> resting on the top memo, a small brass rubber stamp beside them. The center
> of the frame is intentionally dark and empty (a sphere will be composited
> there). Shallow depth of field, dark editorial mood like a whisky
> advertisement, no people, no text. Square, 1600×1600.

Displayed behind the 3D brass sphere with a radial mask — keep the center
uncluttered and dark.

## 2. `public/images/desk-grain.png` — desk texture (tiling)

> Seamless tileable texture of dark green full-grain leather, very subtle
> pores and grain, near-black hunter green #10201B, extremely low contrast —
> the grain should be barely perceptible, like a desk mat in a dim office.
> Flat even lighting, no vignetting, no seams. 480×480.

Tiles across every dark background. Must be seamless and *very* subtle —
if in doubt, lower the contrast.

## 3. `public/images/paper-grain.png` — memo paper texture (tiling)

> Seamless tileable texture of warm ivory laid paper, #F2EDE0, faint cotton
> fibre and grain, extremely low contrast, flat even lighting, no shadows,
> no seams, no folds. 420×420.

Tiles across every memo card. Same rule: barely perceptible.

---

Optional later (not yet wired in): a wide desk still-life for OG/social
(`public/og.png`, 1200×630, same art direction).
