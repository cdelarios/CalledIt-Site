# Called It — site

The site at **https://calledit.dalcor.com**: the landing page, the invite pages, the shared-title page (a
function that names the title and shows its poster in the link preview), the App Store badge and Smart App
Banner for people without the app, and Apple's `.well-known/apple-app-site-association` file that makes
invite links open the app.

**The source of truth is `web/` in the private `cdelarios/CalledIt` repository.** This public
repository (`cdelarios/CalledIt-Site`) is a mirror that Vercel deploys on every push (since CMD-022;
GitHub Pages before). Do not edit it here — edit `web/` there and run `tools/sync-site.sh`, which copies
`web/` over this checkout, commits and pushes. The TMDB token the title function uses is
`TMDB_READ_ACCESS_TOKEN` in Vercel's environment, never here.

Files:
- `index.html` — what Called It is.
- `i/index.html` — the invite page, at `https://calledit.dalcor.com/i/?t=<token>` (the form the app
  shares since CMD-003). A real file served 200, so Messages shows a preview card from its Open
  Graph tags; a 404 page gets no preview. It reads the token from the query and offers
  the `calledit://` link as a second way in.
- `i/pool/index.html` — the pool invite page (CMD-008), at `https://calledit.dalcor.com/i/pool/?t=<token>`.
  A second real file under `/i/`, so the association file's `/i/*` pattern already opens the app and
  the page carries its own preview copy; its button is `calledit://pool/<token>`.
- `api/title.js` — the shared-title page (CMD-010; a function since CMD-022), at
  `https://calledit.dalcor.com/i/title/?m=movie&id=<id>` (or `m=tv`), which `vercel.json` rewrites to it. It asks
  TMDB for the title and answers the page with the title and year as the card's title and the poster as its image;
  anything else (a bad query, an unknown id, no poster, a TMDB failure) gets the generic Called It card, always with
  status 200. Its button is `calledit://title/<media>/<id>`. No TMDB data is stored; good answers are CDN-cached
  for a day.
- `icon.png` — the real app icon, 512 px, masked to the iOS corner radius (CMD-014): the mark at the top of every page and the favicon. Rendered with `swift tools/render-launch-icon.swift web/icon.png`.
- `apple-touch-icon.png` — the same icon, 180 px, opaque and square, because iOS applies its own mask for Add to Home Screen. Made with `sips -z 180 180 CalledIt/Assets.xcassets/AppIcon.appiconset/E-envelope-card-star.png --out web/apple-touch-icon.png`. Re-make both when the icon changes. Pages name both by root-absolute path, because `404.html` is served at any depth.
- `.gitignore` — keeps `.DS_Store` out of this repository.
- `app-store-badge.svg` — Apple's black "Download on the App Store" badge (CMD-016), a byte-exact copy of the
  file App Store Marketing Tools serves (`https://toolbox.marketingtools.apple.com/api/v2/badges/download-on-the-app-store/black/en-us`),
  never modified. Every page draws it 48 px tall, linking `https://apps.apple.com/app/id6826726436`, and carries Apple's
  credit line in its footer. Every page also carries the Smart App Banner tag `<meta name="apple-itunes-app">` with
  `app-id=6826726436`; on the three link pages and `404.html` a head script adds `app-argument=<the page's own https URL>`,
  built from the validated token or title, so the banner's Open hands the app the same URL the universal link would.
- `og.png` — the 1200×630 preview image every page but `404.html` names: the real app icon on the house background, rendered by `tools/render-og.swift` (CMD-003.01; re-run it when the icon or the copy changes). The pages name it as `og.png?v=N` — bump `N` when the image changes, because Messages and LinkPresentation cache a preview per page URL and the invite page's URL never changes.
- `404.html` — served for every path that is not a file. It still handles the older `/i/<token>` links
  (the app accepts both forms; `vercel.json` rewrites that form here with status 200); anything else is a
  plain not-found with status 404.
- `.well-known/apple-app-site-association` — Universal Links. Must be served over HTTPS, no
  redirects, at exactly this path; `vercel.json` gives it `Content-Type: application/json`.
- `vercel.json` — Vercel's configuration (CMD-022): the title rewrites, the legacy `/i/<token>` rewrite to
  `404.html`, and the association file's content type. Not served.
