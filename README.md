# profile
This repository is hosting Bogdan's technical profile and expertise.

A dependency-free static site (`index.html` + `assets/`), deployed to GitHub Pages.

## Run locally
```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

## Deploy
1. In the repo on GitHub: **Settings → Pages → Source: GitHub Actions**.
2. Push to `main`. The `Deploy to GitHub Pages` workflow publishes the site.

## Features
- Light/dark theme (follows the OS, with a manual toggle)
- Expandable experience timeline grouped by company to show career progression
- "Download CV" opens the PDF CV (`assets/cv/CV Rosca Bogdan.pdf`) in a new tab
- Printing the page produces a clean, full-history CV (all roles expanded)
- Public GitHub repos load automatically; the section stays hidden until there are repos with descriptions
