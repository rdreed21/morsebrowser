import { useMorse } from '../../context/MorseContext'
import { Header } from './Header'
import { BasicSettings } from './BasicSettings'
import { WorkingText } from './WorkingText'
import { LessonsAccordion } from './LessonsAccordion'
import { MoreSettingsAccordion } from './MoreSettingsAccordion'
import { FlaggedWordsAccordion } from '../flaggedWordsAccordion/FlaggedWordsAccordion'
import { Controls } from './Controls'
import { WordList } from './WordList'
import { KeyboardShortcuts } from './KeyboardShortcuts'

export function AppContent () {
  const { accessibilityAnnouncement } = useMorse()

  return (
    <div className="container-fluid" style={{ overflowY: 'auto' }}>
      <div className="row gy-2 row-cols-1">

        <Header />

        <BasicSettings />

        <WorkingText />

        {/* Accordions */}
        <section title="Settings" aria-label="Settings" className="col">
          <div className="accordion" id="accordionArea">
            <LessonsAccordion />
            <MoreSettingsAccordion />
            <div className="accordion-item">
              <FlaggedWordsAccordion />
            </div>
          </div>
        </section>

        <Controls />

        <WordList />

        <div className="col">
          <KeyboardShortcuts />
          <br /><br />
        </div>

      </div>

      <div className="sr-only" aria-live="polite" aria-label="Latest status announcement">
        <p>{accessibilityAnnouncement}</p>
      </div>
    </div>
  )
}
