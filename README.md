# giCentre website

A small [Astro](https://astro.build) static site for the giCentre research group. Most
content (news, projects, people) is driven by YAML data files so it can be edited without
touching the page code.

## Project structure

```text
/
├── public/                  # Static assets served as-is at the site root
│   ├── giCentre.png         # Logo
│   ├── global.css           # Global styles
│   ├── news/                # News images
│   └── people/              # People photos
├── src/
│   ├── layouts/
│   │   └── Layout.astro     # Shared shell: <head>, nav, footer, background
│   ├── components/
│   │   └── News.astro       # Renders news.yaml (markdown via markdown-it)
│   ├── pages/               # One file per route
│   │   ├── index.astro      # Home (intro + News)
│   │   ├── projects.astro   # Renders projects.yaml as a grid
│   │   └── people.astro     # Renders person.yaml (academics / PhD / alumni)
│   ├── news.yaml            # News items: title, date, imgs, content (markdown)
│   ├── projects.yaml        # Projects: name, image, description, link
│   └── person.yaml          # People, grouped into academics / phd / alumni
├── astro.config.ts          # site + base config (see Deployment)
└── package.json
```

### Editing content

- **News** — add an entry to `src/news.yaml` (`content` is markdown; `imgs` are paths under `public/`).
- **Projects** — add an entry to `src/projects.yaml`.
- **People** — add an entry under `academics`, `phd`, or `alumni` in `src/person.yaml`; put photos in `public/people/`.

No code changes are needed for content updates.

## Commands

Run from the project root:

| Command           | Action                                       |
| :---------------- | :------------------------------------------- |
| `npm install`     | Install dependencies                         |
| `npm run dev`     | Start the dev server at `localhost:4321`     |
| `npm run build`   | Build the production site to `./dist/`       |
| `npm run preview` | Preview the production build locally         |

## Deployment

The site deploys to **GitHub Pages** automatically via the
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) workflow: every push to
`main` builds the site with [`withastro/action`](https://github.com/withastro/action) and
publishes `./dist/` to Pages. You can also trigger it manually from the repository's
**Actions** tab ("Run workflow").

One-time setup: in the repository settings, set **Settings → Pages → Build and deployment →
Source** to **GitHub Actions**.

### Important: `base` and `site`

The site is served from a project subpath, so `astro.config.ts` sets:

```js
site: 'https://alexispister.github.io/',
base: '/giCentre',
```

Because of `base`, always build URLs to public assets and internal links from
`import.meta.env.BASE_URL` (the layout/pages already do this) rather than hardcoding `/`.
If the repository name or owner changes, update `site` and `base` to match, or the
deployed asset and link paths will break.
