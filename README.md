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
- `og.png` — the 1200×630 preview image both pages name (rendered from the site's mark and colours).
- `404.html` — GitHub Pages serves this for every path that is not a file. It still handles the
  older `/i/<token>` links (the app accepts both forms); anything else is a plain not-found.
- `.well-known/apple-app-site-association` — Universal Links. Must be served over HTTPS, no
  redirects, at exactly this path. `.nojekyll` keeps GitHub Pages from skipping the dot-directory.
- `CNAME` — the custom domain, kept here so a sync never removes it from the Pages settings.
