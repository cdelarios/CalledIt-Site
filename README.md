# Called It — site

The static site at **https://calledit.dalcor.com**: the landing page, the invite page, and Apple's
`.well-known/apple-app-site-association` file that makes invite links open the app.

**The source of truth is `web/` in the private `cdelarios/CalledIt` repository.** This public
repository (`cdelarios/CalledIt-Site`) is a mirror published by GitHub Pages. Do not edit it here —
edit `web/` there and run `tools/sync-site.sh`, which copies `web/` over this checkout, commits and
pushes.

Files:
- `index.html` — what Called It is.
- `i/index.html` — the invite page, at `https://calledit.dalcor.com/i/?t=<token>` (the form the app
  shares since CMD-003). A real file served 200, so Messages shows a preview card from its Open
  Graph tags; GitHub Pages' 404 page gets no preview. It reads the token from the query and offers
  the `calledit://` link as a second way in.
- `i/pool/index.html` — the pool invite page (CMD-008), at `https://calledit.dalcor.com/i/pool/?t=<token>`.
  A second real file under `/i/`, so the association file's `/i/*` pattern already opens the app and
  the page carries its own preview copy; its button is `calledit://pool/<token>`.
- `i/title/index.html` — the shared-title page (CMD-010), at `https://calledit.dalcor.com/i/title/?m=movie&id=<id>`
  (or `m=tv`). A third real file under `/i/`; its button is `calledit://title/<media>/<id>`.
- `icon.png` — the real app icon, 512 px, masked to the iOS corner radius (CMD-014): the mark at the top of every page and the favicon. Rendered with `swift tools/render-launch-icon.swift web/icon.png`.
- `apple-touch-icon.png` — the same icon, 180 px, opaque and square, because iOS applies its own mask for Add to Home Screen. Made with `sips -z 180 180 CalledIt/Assets.xcassets/AppIcon.appiconset/E-envelope-card-star.png --out web/apple-touch-icon.png`. Re-make both when the icon changes. Pages name both by root-absolute path, because `404.html` is served at any depth.
- `.gitignore` — keeps `.DS_Store` out of this repository.
- `og.png` — the 1200×630 preview image every page but `404.html` names: the real app icon on the house background, rendered by `tools/render-og.swift` (CMD-003.01; re-run it when the icon or the copy changes). The pages name it as `og.png?v=N` — bump `N` when the image changes, because Messages and LinkPresentation cache a preview per page URL and the invite page's URL never changes.
- `404.html` — GitHub Pages serves this for every path that is not a file. It still handles the
  older `/i/<token>` links (the app accepts both forms); anything else is a plain not-found.
- `.well-known/apple-app-site-association` — Universal Links. Must be served over HTTPS, no
  redirects, at exactly this path. `.nojekyll` keeps GitHub Pages from skipping the dot-directory.
- `CNAME` — the custom domain, kept here so a sync never removes it from the Pages settings.
