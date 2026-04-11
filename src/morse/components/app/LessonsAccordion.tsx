import { useEffect, useRef, useState } from 'react'
import { useMorse } from '../../context/MorseContext'

/**
 * Renders the "LICW Lessons" accordion with controls for selecting lessons, presets,
 * playback options, overrides, and related settings.
 *
 * This component consumes state and actions from `useMorse()` and manages only the
 * accordion open/closed UI state; all lesson/configuration state is driven by the
 * provided view model. It also wires file input for loading settings and ensures
 * sensible auto-selection when lesson lists recompute.
 *
 * @returns The accordion JSX element containing lesson selection, preset save/load,
 * playback toggles, override controls, and the Apply button.
 */
export function LessonsAccordion () {
  const { vm, lessons, misc, trailReveal, allowSaveCookies, applyEnabled, morseLoadImages } = useMorse()
  const settingsFileRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    const l = vm.lessons

    // Lesson state (userTarget / selectedClass / letterGroup / selectedDisplay) was
    // already restored from localStorage in the MorseViewModel constructor
    // (restoreLessonState), before any saveToStorage subscriptions existed.
    // This effect only needs to:
    //  1. Handle URL-querystring preset param (settingsPresetsInitialized).
    //  2. Re-arm the *Initialized flags and auto-select fallbacks whenever the user
    //     changes TYPE / CLASS / GROUP, which causes the computed observables to reset
    //     selectedClass / letterGroup / selectedDisplay back to empty.

    l.setSettingsPresetsInitialized()

    // When the user changes TYPE, classes recomputes and resets selectedClass='' /
    // selectedClassInitialized=false.  Re-arm the flag and auto-select first class.
    const onClassesChange = (newClasses: any[]) => {
      l.selectedClassInitialized = true
      if (!l.selectedClass() && newClasses.length > 0) {
        l.changeSelectedClass(newClasses[0])
      }
    }
    const classesSub = l.classes.subscribe(onClassesChange)
    onClassesChange(l.classes())

    // When the user changes CLASS, letterGroups recomputes and resets letterGroup='' /
    // letterGroupInitialized=false.  Re-arm and auto-select first valid group.
    const onLetterGroupsChange = (newGroups: any[]) => {
      l.letterGroupInitialized = true
      const valid = newGroups.filter((g: string) => !g.startsWith('Select'))
      if (!l.letterGroup() && valid.length > 0) {
        l.setLetterGroup(valid[0])
      }
    }
    const letterGroupsSub = l.letterGroups.subscribe(onLetterGroupsChange)
    onLetterGroupsChange(l.letterGroups())

    // When the user changes LETTER GROUP, displays recomputes and resets selectedDisplay={}.
    // Re-arm displaysInitialized and auto-select the first non-dummy lesson.
    const onDisplaysChange = (newDisplays: any[]) => {
      l.displaysInitialized = true
      const nonDummy = newDisplays.filter((d: any) => !d.isDummy)
      if (!l.selectedDisplay()?.display && nonDummy.length > 0) {
        l.setDisplaySelected(nonDummy[0])
      }
    }
    const displaysSub = l.displays.subscribe(onDisplaysChange)
    onDisplaysChange(l.displays())

    return () => {
      classesSub.dispose()
      letterGroupsSub.dispose()
      displaysSub.dispose()
    }
  }, [vm])

  const bookSrc = morseLoadImages?.getSrc('bookImage')
  const lockSrc = morseLoadImages?.getSrc('lockImage')
  const unlockSrc = morseLoadImages?.getSrc('unlockImage')

  const selectedDisplayIdx = lessons.selectedDisplay?.display
    ? lessons.displays.findIndex(d => d.display === lessons.selectedDisplay.display)
    : -1

  const selectedPresetIdx = lessons.selectedSettingsPreset?.display
    ? lessons.settingsPresets.findIndex(p => p.display === lessons.selectedSettingsPreset.display)
    : -1

  return (
    <div className="accordion-item">
      <h2 className="accordion-header" id="headingLessonControls">
        <button
          className={`accordion-button${isOpen ? '' : ' collapsed'}`}
          type="button"
          aria-expanded={isOpen ? 'true' : 'false'}
          aria-controls="accordianItemLessonControls"
          id="lessonAccordianButton"
          onClick={() => setIsOpen(o => !o)}
        >
          <img src={bookSrc} height={20} width={20} alt="" /><span>&nbsp;</span>
          <span>LICW Lessons</span>
          <span>&nbsp;</span>
          {lessons.selectedDisplay?.display && (
            <span className="badge bg-success" style={{ whiteSpace: 'normal' }}>
              <span>Type: </span><span>{lessons.userTarget}</span>
              <span>&nbsp; Class: </span><span>{lessons.selectedClass}</span>
              <span>&nbsp; Letter Group: </span><span>{lessons.letterGroup}</span>
              <span>&nbsp; Lesson: </span><span>{lessons.selectedDisplay.display}</span>
              <span>&nbsp; Settings: </span><span>{lessons.selectedSettingsPreset?.display}</span>
            </span>
          )}
          {!lessons.selectedDisplay?.display && (
            <span className="badge bg-success">(None Currently Selected)</span>
          )}
        </button>
      </h2>
      <div id="accordianItemLessonControls" className={`accordion-collapse${isOpen ? ' show' : ' collapse'}`} aria-labelledby="headingLessonControls">
        <div className="accordion-body">
          <div className="row gx-2 gy-3">

            {/* TYPE */}
            <div className="col-6 col-md-auto">
              <label className="form-label mb-1 fw-semibold">TYPE</label>
              <select
                className="form-select form-select-sm"
                aria-label="Curriculum kind"
                value={lessons.userTarget}
                onChange={e => vm.lessons.changeUserTarget(e.target.value)}
              >
                {lessons.userTargets.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* CLASS */}
            <div className="col-6 col-md-auto">
              <label className="form-label mb-1 fw-semibold">CLASS</label>
              <select
                className="form-select form-select-sm"
                aria-label="Class"
                value={lessons.selectedClass}
                onChange={e => vm.lessons.changeSelectedClass(e.target.value, 'click')}
              >
                {lessons.classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* LETTER GROUP */}
            <div className="col-12 col-md-auto">
              <label className="form-label mb-1 fw-semibold">LETTER GROUP</label>
              <select
                className="form-select form-select-sm"
                aria-label="Wordlist"
                value={lessons.letterGroup}
                onChange={e => vm.lessons.setLetterGroup(e.target.value, 'click')}
              >
                {lessons.letterGroups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* LESSON */}
            <div className="col-12 col-md-auto">
              <label className="form-label mb-1 fw-semibold">LESSON</label>
              <select
                className="form-select form-select-sm"
                aria-label="Lesson"
                value={selectedDisplayIdx >= 0 ? selectedDisplayIdx : ''}
                onChange={e => {
                  const item = lessons.displays[Number(e.target.value)]
                  if (item) vm.lessons.setDisplaySelected(item, false, 'click')
                }}
              >
                {lessons.displays.map((d, i) => (
                  <option key={i} value={i}>{d.display}</option>
                ))}
              </select>
            </div>

            {/* PRESET */}
            <div className="col-12 col-md-auto">
              <label className="form-label mb-1 fw-semibold">PRESET</label>
              <select
                className="form-select form-select-sm"
                aria-label="Settings preset"
                disabled={!allowSaveCookies}
                value={selectedPresetIdx >= 0 ? selectedPresetIdx : ''}
                onChange={e => {
                  const item = lessons.settingsPresets[Number(e.target.value)]
                  if (item) vm.lessons.setPresetSelected(item, false, 'click')
                }}
              >
                {lessons.settingsPresets.map((p, i) => (
                  <option key={i} value={i}>{p.display}</option>
                ))}
              </select>
              <div className="d-flex gap-1 mt-1">
                <button
                  id="saveSettingsButton"
                  type="button"
                  className="btn btn-outline-secondary btn-sm flex-fill"
                  onClick={() => vm.saveSettings()}
                >
                  <span>Save</span>
                </button>
                <button
                  id="loadSettingsButton"
                  type="button"
                  className="btn btn-outline-secondary btn-sm flex-fill"
                  onClick={() => settingsFileRef.current?.click()}
                >
                  <span>Load</span>
                </button>
                <input
                  type="file"
                  accept=".json"
                  id="settingsfiletoread"
                  className="form-control"
                  ref={settingsFileRef}
                  onChange={e => vm.settingsFileChange(e.target)}
                  hidden
                />
              </div>
            </div>

            {/* Playback options + overrides */}
            <div className="col-12 col-md-auto">
              <div className="d-flex flex-wrap gap-4 align-items-start">

                {/* Playback options */}
                <div className="d-flex flex-column gap-2">
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" role="switch" id="btncheck1"
                      autoComplete="off" checked={lessons.randomizeLessons}
                      onChange={e => vm.lessons.randomizeLessons(e.target.checked)} />
                    <label className="form-check-label" htmlFor="btncheck1">Randomize</label>
                  </div>
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" role="switch" id="btnchecktrailreveal"
                      autoComplete="off" checked={trailReveal}
                      onChange={e => vm.trailReveal(e.target.checked)} />
                    <label className="form-check-label" htmlFor="btnchecktrailreveal">Trail Reveal</label>
                  </div>
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" role="switch" id="btnchecknewlinechunking"
                      autoComplete="off" checked={misc.newlineChunking}
                      onChange={e => vm.settings.misc.newlineChunking(e.target.checked)} />
                    <label className="form-check-label" htmlFor="btnchecknewlinechunking">Keep Lines</label>
                  </div>
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" role="switch" id="btncheck2stickysetstoggle"
                      autoComplete="off" checked={lessons.ifStickySets}
                      onChange={e => vm.lessons.ifStickySets(e.target.checked)} />
                    <label className="form-check-label" htmlFor="btncheck2stickysetstoggle">Sticky Sets</label>
                  </div>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    aria-label="Sticky set text"
                    placeholder="Sticky characters"
                    disabled={!lessons.ifStickySets}
                    value={lessons.stickySets}
                    onChange={e => vm.lessons.stickySets(e.target.value)}
                  />
                  <p role="note" className="sr-only">
                    When pressed, the Custom Group button generates working text using the text entered in the Custom group text input instead of a lesson.
                  </p>
                  <div className="input-group input-group-sm">
                    <input
                      type="text"
                      className="form-control"
                      aria-label="Custom group text"
                      placeholder="Custom group"
                      value={lessons.customGroup}
                      onChange={e => vm.lessons.customGroup(e.target.value)}
                    />
                    <button type="button" className="btn btn-success"
                      onClick={() => vm.lessons.doCustomGroup()}>Go</button>
                  </div>
                </div>

                {/* Overrides */}
                <div className="d-flex flex-column gap-2">
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" role="switch" id="btncheck2"
                      autoComplete="off" checked={lessons.ifOverrideTime}
                      onChange={e => vm.lessons.ifOverrideTime(e.target.checked)} />
                    <label className="form-check-label" htmlFor="btncheck2">Override Time</label>
                  </div>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text">Mins</span>
                    <input type="number" className="form-control" aria-label="minutes" min={0}
                      disabled={!lessons.ifOverrideTime}
                      value={lessons.overrideMins}
                      onChange={e => vm.lessons.overrideMins(Number(e.target.value))} />
                  </div>
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" role="switch" id="btncheck2overridesize"
                      autoComplete="off" checked={lessons.ifOverrideMinMax}
                      onChange={e => vm.lessons.ifOverrideMinMax(e.target.checked)} />
                    <label className="form-check-label" htmlFor="btncheck2overridesize">Override Size</label>
                  </div>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text">Min</span>
                    <input type="number" className="form-control" aria-label="Minimum" min={1}
                      disabled={!lessons.ifOverrideMinMax}
                      value={lessons.overrideMin}
                      onChange={e => vm.lessons.overrideMin(Number(e.target.value))} />
                  </div>
                  <div className="input-group input-group-sm">
                    <span
                      role="checkbox"
                      aria-label="Sync minimum and maximum size"
                      className="input-group-text"
                      style={{ cursor: 'pointer' }}
                      aria-checked={lessons.syncSize ? 'true' : 'false'}
                      onClick={() => vm.lessons.syncSize(!lessons.syncSize)}
                    >
                      Max&nbsp;<img aria-hidden="true"
                        src={lessons.syncSize ? lockSrc : unlockSrc} />
                    </span>
                    <input
                      aria-label="Maximum"
                      type="number"
                      className="form-control"
                      min={lessons.overrideMin}
                      disabled={!lessons.ifOverrideMinMax || lessons.syncSize}
                      value={lessons.overrideMax}
                      onChange={e => vm.lessons.overrideMax(Number(e.target.value))}
                    />
                  </div>
                  <button type="button" className="btn btn-success btn-sm" id="btnApply"
                    disabled={!applyEnabled}
                    onClick={() => vm.doApply(true)}>Apply</button>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
