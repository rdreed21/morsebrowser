import { useMorse } from '../../context/MorseContext'

export function KeyboardShortcuts () {
  const { allShortcutKeys } = useMorse()

  return (
    <details id="keyboard-shortcuts">
      <summary>Keyboard Shortcuts</summary>
      <p>The following keyboard shortcuts are available to help access commonly used features.</p>
      <table>
        <thead>
          <tr>
            <th>Keyboard shortcut</th>
            <th>Function</th>
          </tr>
        </thead>
        <tbody>
          {allShortcutKeys.map((k: any, i: number) => (
            <tr key={i}>
              <td className="key"><span>{k.key}</span></td>
              <td className="function">{k.title}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}
