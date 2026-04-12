import { useMorse } from '../../context/MorseContext'

function toggleDarkMode () {
  const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark'
  document.documentElement.setAttribute('data-bs-theme', isDark ? 'light' : 'dark')
  localStorage.setItem('theme', isDark ? 'light' : 'dark')
  const meta = document.getElementById('theme-color-meta')
  if (meta) meta.setAttribute('content', isDark ? '#ffffff' : '#212529')
}

export function Header () {
  const { vm, isDev, morseLoadImages } = useMorse()
  const logoSrc = morseLoadImages?.getSrc('logoImage')
  const githubSrc = morseLoadImages?.getSrc('githubImage')

  return (
    <header className="col">
      <div className="header-banner">
        <div className="header-banner-inner">
          <img
            src={logoSrc}
            onClick={() => vm.logoClick()}
            id="logoImage"
            style={{ maxWidth: '100%', height: 'auto', cursor: 'pointer' }}
            alt="Long Island CW Club Logo depicting a hand on a straight key and the club call sign W2LCW"
          />
          <div className="header-title-block">
            <div className="d-flex align-items-center gap-2">
              <h1 className="header-title mb-0">Morse Practice Page</h1>
              <button
                id="btnDarkMode"
                type="button"
                className="btn btn-sm btn-outline-secondary ms-auto"
                aria-label="Toggle dark mode"
                onClick={toggleDarkMode}
              >
                <span className="theme-icon-light" aria-hidden="true">🌙</span>
                <span className="theme-icon-dark" aria-hidden="true">☀️</span>
                <span className="theme-icon-light ms-1">Dark Mode</span>
                <span className="theme-icon-dark ms-1">Light Mode</span>
              </button>
            </div>
            <p className="header-tagline">
              A practice tool by the{' '}
              <a href="https://longislandcwclub.org/">Long Island CW Club</a>
            </p>
          </div>
        </div>

        {isDev && (
          <div className="header-dev-warning" role="alert">
            WARNING: You are using the BETA (unstable) version. The{' '}
            <a href="../">latest stable release</a> is recommended.
          </div>
        )}

        <section id="credits-and-info" title="Credits and additional information" aria-label="Credits and additional information">
          <span title="Contributor info" id="contributor-info">
            Built by KN4YRM with AB5TN, KN6WKV, N1CC, VE3QBZ, VK5PL, WO6W, W4EMB, and KQ4NKF
          </span>
          <span className="header-attribution">
            Adapted from the{' '}
            <a href="https://morsecode.world/">SC Phillips</a>{' '}
            <a href="https://github.com/scp93ch/morse-pro">morse-pro library</a>
          </span>

          <nav className="header-links" aria-label="Quick links">
            <a href="https://longislandcwclub.org/academic-downloads/">User Guide</a>
            <span className="header-link-sep" aria-hidden="true">&middot;</span>
            <a href="https://www.youtube.com/playlist?list=PLt-EzlLx2AKFY8NVxxPVBbPzR6s-Kz7tJ">Videos</a>
            <span className="header-link-sep" aria-hidden="true">&middot;</span>
            <a href="https://github.com/LongIslandCW/morsebrowser/">
              Source<img src={githubSrc} aria-hidden="true" className="header-github-icon" />
            </a>
            <span className="header-link-sep" aria-hidden="true">&middot;</span>
            <a href="mailto:AB5TN48@gmail.com">Contact</a>
          </nav>

          <span id="version-info">v1.13</span>
        </section>
      </div>
    </header>
  )
}
