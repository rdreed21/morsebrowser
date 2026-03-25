// see https://getbootstrap.com/docs/5.0/getting-started/webpack/
import 'bootstrap/dist/css/bootstrap.min.css'
// You can specify which plugins you need
// Note that even though these don't seem to be used directly,
// they are used by the accordian.
// eslint-disable-next-line no-unused-vars
import { Tooltip, Toast, Popover, Collapse } from 'bootstrap'
import './css/style.css'
import { MorseViewModel } from './morse/morse'
import { createRoot } from 'react-dom/client'
import App from './App'

const vm = new MorseViewModel()

const loader = document.getElementById('app-loading')
if (loader) loader.remove()

const reactRoot = document.getElementById('react-root')
if (reactRoot) {
  createRoot(reactRoot).render(<App vm={vm} />)
}
