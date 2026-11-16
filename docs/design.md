# Kimlik verification flow design decisions

Follows the product-design skill. This task extends the existing settings page.

- Goal: verify the requested account detail and return to the requesting partner.
- Personality: clear through a named request; trustworthy through explicit verification status; direct through one relevant form.
- Palette: existing white and gray-900 canvases, gray-900/white text, emerald-700 primary action, emerald-50 request surface, green success and red errors.
- Typography: existing DM Sans family and site font fallbacks; 18px request heading, 16px body and inputs, 14px secondary status.
- Composition: retain the settings header, then show the named partner request and only its required verification form. No marketing hero.
- Product moment: a phone/email code form followed by a named return button.
- Signature detail: a simple emerald left rule identifies the partner request.
- Imagery: none; account status and actual controls carry the information.
- Voice: direct Azerbaijani; telefon nömrəsi, e-poçt ünvanı, şəxsiyyətin təsdiqi. Generic partner names use the neutral return construction "{client} saytına qayıt".
- Shapes: existing rounded-xl controls, flat request notice, no new gradients or blur effects.
- States: validation/loading, invalid link, account-load failure, pending verification, already verified, completion with a three-second return and an option to stay, unavailable ID workflow.
- Scope: no broader rebrand or settings redesign. Existing unrelated styling is preserved.
