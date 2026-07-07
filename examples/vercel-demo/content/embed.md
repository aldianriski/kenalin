---
title: How do I add Kenalin to my site?
type: case_study
projectId: embed
url: https://github.com/aldianriski/kenalin#readme
---

# Adding Kenalin to your site

Getting started takes a few minutes. Scaffold a project, add your content, and
embed one script tag:

1. **Scaffold** — `npx create-kenalin my-site` generates a runnable project.
2. **Configure** — edit `kenalin.config.ts`: your name, persona, which modules are
   on, and your handoff channels. It's the only file most owners touch.
3. **Add content** — drop in your profile and case studies (Markdown), then run
   `npm run ingest` to build a local knowledge index.
4. **Embed** — put one `<script>` tag on any page:
   `<script src="https://unpkg.com/@kenalin/widget/dist/kenalin.js" data-api-url="https://your-site.com" defer></script>`

The widget is a Shadow-DOM-isolated Web Component, so it never clashes with your
site's styles, and you theme it with CSS variables. There are integration guides
for **Next.js** and **plain HTML**. You bring one API key (a Gemini free tier
covers a small site); this very demo runs with **no key at all**.
