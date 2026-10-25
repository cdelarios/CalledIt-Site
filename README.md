# Called It — site

The static site at **https://calledit.dalcor.com**: the landing page, the invite page, and Apple's
`.well-known/apple-app-site-association` file that makes invite links open the app.

**The source of truth is `web/` in the private `cdelarios/CalledIt` repository.** This public
repository (`cdelarios/CalledIt-Site`) is a mirror published by GitHub Pages. Do not edit it here —
edit `web/` there and run `tools/sync-site.sh`, which copies `web/` over this checkout, commits and
pushes.

Files:
- `index.html` — what Called It is.
- `404.html` — GitHub Pages serves this for every path that is not a file, which is how
  `/i/<token>` shows the invite page when the app is not installed. It reads the token from the URL
  and offers the `calledit://` link as a second way in.
- `.well-known/apple-app-site-association` — Universal Links. Must be served over HTTPS, no
  redirects, at exactly this path. `.nojekyll` keeps GitHub Pages from skipping the dot-directory.
- `CNAME` — the custom domain, kept here so a sync never removes it from the Pages settings.
