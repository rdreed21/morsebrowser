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
      <div className="row row-cols-1 row-cols-md-2 justify-content-md-center">
        <div className="col col-md-auto">
          <img
            src={logoSrc}
            onClick={() => vm.logoClick()}
            id="logoImage"
            style={{ maxWidth: '100%', height: 'auto' }}
            alt="Long Island CW Club Logo depicting a hand on a straight key and the club call sign W2LCW"
          />
        </div>
        <div className="col col-md-auto">
          <div className="d-flex align-items-center gap-2 mb-1">
            <h1 className="mb-0">Morse Practice Page</h1>
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
          <section id="credits-and-info" title="Credits and additional information" aria-label="Credits and additional information">
            <span title="Contributor info" id="contributor-info">
              by KN4YRM with AB5TN, KN6WKV, N1CC, VE3QBZ, VK5PL, WO6W, W4EMB, and KQ4NKF
            </span>
            <span>
              Inspired by and adapted from the{' '}
              <a href="https://morsecode.world/">SC Phillips</a>{' '}
              <a href="https://github.com/scp93ch/morse-pro">morse-pro library</a>.
              To view source, please go to{' '}
              <a href="https://github.com/LongIslandCW/morsebrowser/">
                our github<img src={githubSrc} aria-hidden="true" /> repository.
              </a>
            </span>
            <span>
              To ask user questions, report bugs, request features and more{' '}
              <a href="mailto:AB5TN48@gmail.com">email us</a>.
            </span>
            <span>
              <a href="https://www.youtube.com/playlist?list=PLt-EzlLx2AKFY8NVxxPVBbPzR6s-Kz7tJ">
                Videos to help you use this site
              </a>{' '}
              are found on YouTube
            </span>
            <span>
              Click{' '}
              <a href="https://longislandcwclub.org/academic-downloads/">&ldquo;here&rdquo;</a>{' '}
              for a User Guide to help you use this site or it can be found on the LICW website at{' '}
              <a href="https://longislandcwclub.org/">https://longislandcwclub.org/</a>
            </span>
            {isDev && (
              <span className="warning">
                WARNING: You are using the BETA (unstable) version. The{' '}
                <a href="../">latest stable release</a> is recommended.
              </span>
            )}
            <span id="version-info">Version 1.13</span>
          </section>
        </div>
      </div>
    </header>
  )
}
