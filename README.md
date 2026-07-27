# Salah — Portfolio

An interactive, static portfolio built with React, Vite, Three.js, and React
Three Fiber.

The first visit in a browser session opens with a short, prismatic device
sequence:

- desktop and landscape tablet: a wireframe desk approaches a playful computer
  boot and sign-in screen;
- portrait and mobile: a lightweight phone-on-desk scene wakes into a pattern
  unlock;
- reduced motion, constrained devices, repeat visits, and WebGL failures:
  immediate access to the HTML interface.

The sign-in and unlock are visual storytelling, not authentication. The final
résumé, contact, and GitHub interface is regular semantic HTML rather than
content rendered inside WebGL.

## Local development

```bash
npm ci
npm run dev
```

Vite prints the local development URL. The other project checks are:

```bash
npm run lint
npm run build
npm run preview
```

## Deployment

Pushes to `main` run lint and a production build, then publish `dist/` through
GitHub Pages. Static files such as the résumé, favicon, SVGs, and `CNAME` live
in `public/` and are copied into the deployment artifact.
