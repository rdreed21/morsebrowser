import { MorseViewModel } from './morse/morse'
import { MorseProvider } from './morse/context/MorseContext'
import { AppContent } from './morse/components/app/AppContent'

interface AppProps {
  vm: MorseViewModel
}

export default function App ({ vm }: AppProps) {
  return (
    <MorseProvider vm={vm}>
      <AppContent />
    </MorseProvider>
  )
}
