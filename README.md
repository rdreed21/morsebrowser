# Long Island CW Morse Practice Page Source Code Repository

![logo](src/assets/CW-Club-logo-clear400-300x300.png)

What is this?

The **source code repository** for [Long Island CW Club's](https://longislandcwclub.org/) customized version of [SG Phillip's](https://morsecode.world/international/trainer/generator.html) (and by the way, please note that we've made a few tweaks to his [morse-pro js libraries](https://github.com/scp93ch/morse-pro)) It is available for use by anyone who wants to practice morse code and has many useful features, and also includes LICW's lessons that go along with some classes.

**If you are just looking for the application itself and just want to start using it, go here:** https://longislandcw.github.io/morsebrowser/index.html

Or download https://longislandcw.github.io/morsebrowser/download/morse.zip and unzip somewhere on your device, then open index.html in your browser.

# Found a bug, or have a feature suggestion?

Feel free to make feature requests or bug reports using the "Issues" tab.https://github.com/LongIslandCW/morsebrowser/issues Note that you may need to open a github account. _Please respect the request to submit issues here on github rather than emailing the contributors directly_.

# Do you want to help code or just tinker with the code?

KN4YRM originally built it to be "ham tinkerer-friendly." The stack has evolved: the UI is **React** with **TypeScript**, styling is **Bootstrap 5**, and the build uses **Webpack 5**. Core practice logic still lives in a large **MorseViewModel** ([`src/morse/morse.ts`](src/morse/morse.ts)) that uses small **custom observables** ([`src/morse/utils/observable.ts`](src/morse/utils/observable.ts)) so lesson and audio code stay reactive; [**MorseContext**](src/morse/context/MorseContext.tsx) mirrors that state into React so components update when the model changes.

The shipped HTML shell is minimal: [`src/template.html`](src/template.html) provides the dev-server mount (`#react-root`) and theme bootstrap script. The visible UI lives under [`src/morse/components/`](src/morse/components/).

It's suggested that if you want to help:

- **Look and feel:** [Bootstrap 5](https://getbootstrap.com/) and React components under `src/morse/components/`.
- **Behavior and lessons:** TypeScript, especially [`src/morse/morse.ts`](src/morse/morse.ts) and modules under `src/morse/` (lessons, player, settings, timing, voice).
- **Tooling:** Node, npm, webpack, eslint, git (and GitHub if you want to contribute).
- KN4YRM used VSCode as his IDE for this project.
- Please create a feature branch off of develop, and submit a pull request to merge into develop if you have code to contribute.

**Local dev:** `npm install` then `npm run dev` (webpack dev server, typically http://localhost:3000). **Tests:** `npm test` (Vitest).

For a deeper architectural overview, see [DOCUMENTATION.md](DOCUMENTATION.md). For **maintainers**, [docs/MAINTAINER_GUIDE.md](docs/MAINTAINER_GUIDE.md) describes app design and content flow in detail. This fork also maintains [CLAUDE.md](CLAUDE.md) with fork-specific changes and CI/testing notes.

1.0.0
