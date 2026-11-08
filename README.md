# PUREVER website

Static multi-page site with no build step. Double-click `index.html` to preview, or upload the whole `site/` folder to any web host. An internet connection is needed for fonts, the 3D engine (Three.js) and the globe map.

## Pages
| Page | File | Highlights |
|---|---|---|
| Home | `index.html` | Hero, solutions, live 3D teaser, people, industries, impact, projects |
| RO Systems | `ro-systems.html` | **3D configurator** (500 / 1000 / 2000 LPH, containerised SWRO), comparison table |
| Simulator | `simulator.html` | RO process simulator and filtration spectrum |
| Products | `products.html` | Filterable catalogue (19 products) |
| Industries | `industries.html` | Sector cards with photos, reference projects |
| About | `about.html` | Story, values, photo mosaic, global network globe, lifecycle, sustainability, partners |
| Contact | `contact.html` | Quote form (pre-filled when opened from a model or product) |

The header and footer for **all** pages live in `assets/js/layout.js`. Edit the navigation once there.

## 3D configurator (`assets/js/viewer3d.js`)
- The machines are modelled in code (no 3D files to load). Specs, component descriptions and dimensions are in `MODELS` and the `buildSkid` / `buildContainer` functions.
- Deep links: `ro-systems.html?model=c500|c1000|c2000|swro`. Add `&explode=1` to open in exploded view.
- Controls: drag to rotate, scroll to zoom, right-drag to pan, click a part to inspect it. Tools: Explode, Flow, Cutaway / X-ray (container), Hotspots, Auto-rotate, Fullscreen.

## Photos
`assets/img/photos/` contains stock photography from Unsplash (free for commercial use under the Unsplash License; no attribution required). For the strongest brand, **replace these with photos of your own team, factory and installations**, keeping the same file names.

## Before launch: replace placeholder content
- Stats and claims: hero numbers, hub and partner counts, sustainability percentages, "100% tested" card.
- Hubs: `window.PV_HUBS` in `main.js`.
- Reference projects: `projects` array in `main.js` (illustrative examples, not real installations).
- Standards strip: list only certifications PUREVER actually holds.
- Model specifications in `viewer3d.js` and the comparison table in `ro-systems.html`: confirm them against your real datasheets.
- Contact details and the quote form endpoint (the form currently only shows a confirmation).

## Using real product photos in the catalogue
Add `img: 'assets/img/name.jpg'` to a product in the `products` array in `main.js`.
