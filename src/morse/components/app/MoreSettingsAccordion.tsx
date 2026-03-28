import { useState } from 'react'
import { useMorse } from '../../context/MorseContext'

export function MoreSettingsAccordion() {
  const [isOpen, setIsOpen] = useState(false)
  const { vm, lessons, speed, frequency, voice, showExpertSettings, adminMode, cardsVisible,
    trailReveal, trailPreDelay, trailPostDelay, trailFinal,
    preSpace, xtraWordSpaceDits, cardSpace, cardFontPx,
    numberOfRepeats, shuffleIntraGroup, morseLoadImages } = useMorse()

  const img = (key: string) => morseLoadImages?.getSrc(key)
  const checkOrCircle = (on: boolean) => on ? img('checkImage') : img('circleImage')
  const lockOrUnlock = (on: boolean) => on ? img('lockImage') : img('unlockImage')

  return (
    <div className="accordion-item">
      <h2 className="accordion-header" id="headingmoresettings">
        <button
          id="moreSettingsAccordionButton"
          className={`accordion-button${isOpen ? '' : ' collapsed'}`}
          type="button"
          aria-expanded={isOpen ? 'true' : 'false'}
          aria-controls="collapsemoresettings"
          onClick={() => { setIsOpen(o => !o); vm.morseVoice.initEasySpeech() }}
        >
          <img src={img('gearImage')} height={20} width={20} alt="" /><span>&nbsp;</span>
          More Settings<span>&nbsp;</span>
        </button>
      </h2>
      <div id="collapsemoresettings" className={`accordion-collapse${isOpen ? ' show' : ' collapse'}`} aria-labelledby="headingmoresettings">
        <div className="accordion-body">
          <div className="row row-cols-5 gx-2 gy-2">

            {/* Tone */}
            <div className="col-auto">
              <div className="input-group">
                <label htmlFor="ditFrequency" className="input-group-text">
                  DIT&nbsp;<img src={img('musicnoteImage')} height={20} width={20} alt="" />
                </label>
                <input id="ditFrequency" name="ditFrequency" type="number"
                  style={{ maxWidth: 75, minWidth: 75 }} className="form-control"
                  min={100} max={1200} step={10}
                  title="Dit frequency in hertz"
                  value={frequency.ditFrequency}
                  onChange={e => vm.settings.frequency.ditFrequency(Number(e.target.value))} />
                <span className="input-group-text"
                  onClick={() => vm.settings.frequency.syncFreq(!frequency.syncFreq)}>
                  <label htmlFor="dahFrequency">DAH</label>&nbsp;
                  <input type="image" role="checkbox" alt="Sync dit and dah frequencies"
                    aria-checked={frequency.syncFreq}
                    src={lockOrUnlock(frequency.syncFreq)}
                    title="Sync dit and dah frequencies" />
                </span>
                <input id="dahFrequency" name="dahFrequency" type="number"
                  style={{ maxWidth: 75, minWidth: 75 }} className="form-control"
                  min={100} max={1200} step={10}
                  title="Dah frequency in hertz"
                  disabled={frequency.syncFreq}
                  value={frequency.dahFrequency}
                  onChange={e => vm.settings.frequency.dahFrequency(Number(e.target.value))} />
                <button id="zeroBeatButton" type="button" className="btn btn-light"
                  title="Plays a sustained test tone"
                  onClick={() => vm.testTone()}>
                  <span>Zero Beat</span>
                </button>
              </div>
            </div>

            {/* Silence & spacing */}
            <div className="col-auto">
              <div className="input-group">
                <label htmlFor="preSpace" className="input-group-text">
                  PRE&nbsp;<img src={img('volumemuteImage')} height={20} width={20} alt="" />
                </label>
                <input id="preSpace" name="preSpace" type="number"
                  style={{ maxWidth: 75, minWidth: 75 }} className="form-control"
                  min={0} max={1200} step={0.5}
                  title="The amount of silence in seconds to include at the start of playback"
                  value={preSpace}
                  onChange={e => vm.preSpace(Number(e.target.value))} />
                <label htmlFor="xtraWordSpaceDits" className="input-group-text">
                  WORD SPACE&nbsp;<img src={img('graphuparrowImage')} height={20} width={20} alt="" />
                </label>
                <input id="xtraWordSpaceDits" name="xtraWordSpaceDits" type="number"
                  style={{ maxWidth: 75, minWidth: 75 }} className="form-control"
                  min={1} max={10} step={1}
                  title="Extra word space in dits"
                  value={xtraWordSpaceDits}
                  onChange={e => vm.xtraWordSpaceDits(Number(e.target.value))} />
                <label htmlFor="cardSpace" className="input-group-text">
                  CARD WAIT&nbsp;<img src={img('graphuparrowImage')} height={20} width={20} alt="" />
                </label>
                <input id="cardSpace" name="cardSpace" type="number"
                  style={{ maxWidth: 75, minWidth: 75 }} className="form-control"
                  min={0} max={10} step={1}
                  title="The amount of extra silence to include between cards"
                  value={cardSpace}
                  onChange={e => vm.cardSpace(Number(e.target.value))} />
              </div>
            </div>

            {/* Card size */}
            <div className="col-auto">
              <div className="input-group">
                <label htmlFor="cardFontPx" className="input-group-text">
                  CARD SIZE&nbsp;<img src={img('barchartImage')} height={20} width={20} alt="" />
                </label>
                <input id="cardFontPx" name="cardFontPx" type="number"
                  style={{ maxWidth: 75, minWidth: 75 }} className="form-control"
                  min={1} max={1200} step={1}
                  title="The text size to use when displaying cards"
                  value={cardFontPx ?? ''}
                  onChange={e => vm.cardFontPx(Number(e.target.value))} />
              </div>
            </div>

            {/* Trail reveal */}
            <div className="col-auto" title="Automatic card revealing">
              <div className="input-group">
                <input type="checkbox" className="btn-check" id="btntrailReveal" autoComplete="off"
                  title="Reveals hidden cards after they have been played"
                  checked={trailReveal}
                  onChange={e => vm.trailReveal(e.target.checked)} />
                <label className="btn btn-outline-secondary" htmlFor="btntrailReveal">
                  <span>Trail&nbsp;</span>
                  <img src={trailReveal ? img('eyeImage') : img('eyeslashImage')} height={20} width={20} alt="" />
                </label>
                <label htmlFor="trailPreDelay" className="input-group-text">
                  Pre Delay&nbsp;<img src={img('stopwatchImage')} height={20} width={20} alt="" />
                </label>
                <input id="trailPreDelay" name="trailPreDelay" type="number"
                  style={{ maxWidth: 75, minWidth: 50 }} className="form-control"
                  min={0} step={0.25}
                  title="The amount to delay prior to revealing a card upon playback"
                  disabled={!trailReveal}
                  value={trailPreDelay}
                  onChange={e => vm.trailPreDelay(Number(e.target.value))} />
                <label htmlFor="trailPostDelay" className="input-group-text">
                  Post Delay&nbsp;<img src={img('stopwatchImage')} height={20} width={20} alt="" />
                </label>
                <input id="trailPostDelay" name="trailPostDelay" type="number"
                  style={{ maxWidth: 75, minWidth: 50 }} className="form-control"
                  min={0} step={0.25}
                  title="The amount to delay after revealing a card upon playback"
                  disabled={!trailReveal}
                  value={trailPostDelay}
                  onChange={e => vm.trailPostDelay(Number(e.target.value))} />
                <label htmlFor="trailFinal" className="input-group-text">
                  Final&nbsp;<img src={img('stopwatchImage')} alt="" />
                </label>
                <input id="trailFinal" name="trailFinal" type="number"
                  style={{ maxWidth: 75, minWidth: 50 }} className="form-control"
                  min={0} step={0.25}
                  title="The amount to delay after revealing the final card upon playback"
                  disabled={!trailReveal}
                  value={trailFinal}
                  onChange={e => vm.trailFinal(Number(e.target.value))} />
              </div>
            </div>

            {/* Speed intervals */}
            <div className="input-group">
              <div className="col-auto">
                <input type="checkbox" className="btn-check" autoComplete="off"
                  id="btncheckspeedinterval" name="btncheckspeedinterval"
                  aria-label="Speed Intervals"
                  title="Enables variable speeds in time intervals you define"
                  checked={speed.speedInterval}
                  onChange={e => vm.settings.speed.speedInterval(e.target.checked)} />
                <label className="btn btn-outline-primary" htmlFor="btncheckspeedinterval" aria-hidden="true">
                  <img src={img('rocketTakeoffImage')} alt="" />&nbsp;Speed Intervals&nbsp;
                  <img src={checkOrCircle(speed.speedInterval)} alt="" />
                </label>
              </div>
              {speed.speedInterval && <>
                <label htmlFor="intervalTimingsText" className="input-group-text">
                  Timings&nbsp;<img src={img('stopwatchImage')} height={20} width={20} alt="" />
                </label>
                <input id="intervalTimingsText" name="intervalTimingsText" type="text"
                  style={{ maxWidth: 200, minWidth: 200 }} className="form-control"
                  title="Comma-separated interval durations"
                  value={speed.intervalTimingsText}
                  onChange={e => vm.settings.speed.intervalTimingsText(e.target.value)} />
                <label htmlFor="intervalWpmText" className="input-group-text">WPM&nbsp;</label>
                <input id="intervalWpmText" name="intervalWpmText" type="text"
                  style={{ maxWidth: 200, minWidth: 200 }} className="form-control"
                  title="Comma-separated character WPM speeds for each interval"
                  value={speed.intervalWpmText}
                  onChange={e => vm.settings.speed.intervalWpmText(e.target.value)} />
                <label htmlFor="intervalFwpmText" className="input-group-text">FWPM&nbsp;</label>
                <input id="intervalFwpmText" name="intervalFwpmText" type="text"
                  style={{ maxWidth: 200, minWidth: 200 }} className="form-control"
                  title="Comma-separated FWPM speeds for each interval"
                  value={speed.intervalFwpmText}
                  onChange={e => vm.settings.speed.intervalFwpmText(e.target.value)} />
              </>}
            </div>

            {/* Cards visible */}
            <div className="col-auto">
              <input type="checkbox" className="btn-check" autoComplete="off"
                id="btncheckcardsvisible" title="Toggles card visibility" aria-label="Cards"
                checked={cardsVisible}
                onChange={e => vm.cardsVisible(e.target.checked)} />
              <label className="btn btn-outline-primary" htmlFor="btncheckcardsvisible" aria-hidden="true">
                <img src={img('grid3x3gapImage')} alt="" />&nbsp;Cards&nbsp;
                <img src={checkOrCircle(cardsVisible)} alt="" />
              </label>
            </div>

            {/* Auto Close lesson accordion */}
            <div className="col-auto">
              <input type="checkbox" className="btn-check" autoComplete="off"
                id="btncheckautoclose" title="Collapse the Lessons accordion when playback starts" aria-label="Auto Close"
                checked={lessons.autoCloseLessonAccordion}
                onChange={e => vm.lessons.autoCloseLessonAccordion(e.target.checked)} />
              <label className="btn btn-outline-secondary" htmlFor="btncheckautoclose" aria-hidden="true">
                Auto Close&nbsp;
                <img src={checkOrCircle(lessons.autoCloseLessonAccordion)} alt="" />
              </label>
            </div>

            {/* Download audio */}
            <div className="col-auto">
              <button type="button" className="btn btn-success"
                title="Downloads an audio file using the current settings"
                onClick={() => vm.doDownload()}>
                <img src={img('downloadImage')} alt="" />
                Audio File
              </button>
              <a id="downloadLink"></a>
            </div>

            {/* Expert settings toggle */}
            <div className="col-auto">
              <input type="checkbox" className="btn-check" autoComplete="off"
                id="btncheckexpertsettings" aria-label="Expert Settings"
                checked={showExpertSettings}
                onChange={e => vm.showExpertSettings(e.target.checked)} />
              <label className="btn btn-outline-danger" htmlFor="btncheckexpertsettings" aria-hidden="true">
                <img height={20} width={20} src={img('exclamationoctagonImage')} alt="" />&nbsp;Expert Settings&nbsp;
                <img src={checkOrCircle(showExpertSettings)} alt="" />
              </label>
            </div>

            {/* Repeats (expert only) */}
            <div className="input-group">
              {showExpertSettings && (
                <div className="input-group">
                  <label htmlFor="numberOfRepeats" className="input-group-text">
                    Repeats&nbsp;<img width={20} height={20} src={img('repeatImage')} alt="" />
                  </label>
                  <input id="numberOfRepeats" name="numberOfRepeats" type="number"
                    style={{ maxWidth: 75, minWidth: 75 }} className="form-control"
                    min={0} max={10} step={1}
                    value={numberOfRepeats}
                    onChange={e => vm.numberOfRepeats(Number(e.target.value))} />
                  <label htmlFor="speakFirstAdditionalWordspaces" className="input-group-text">
                    Repeat Spacing<img width={20} height={20} src={img('stopwatchImage')} alt="" />
                  </label>
                  <input id="speakFirstAdditionalWordspaces" name="speakFirstAdditionalWordspaces" type="number"
                    style={{ maxWidth: 75, minWidth: 75 }} className="form-control"
                    min={0} max={10} step={1}
                    value={voice.speakFirstAdditionalWordspaces}
                    onChange={e => vm.morseVoice.speakFirstAdditionalWordspaces(Number(e.target.value))} />
                  {adminMode && <>
                    <input type="checkbox" className="btn-check" autoComplete="off"
                      aria-label="Shuffle Intra-group" id="btnshuffleintragroup"
                      checked={shuffleIntraGroup}
                      onChange={e => vm.shuffleIntraGroup(e.target.checked)} />
                    <label className="btn btn-outline-primary" htmlFor="btnshuffleintragroup" aria-hidden="true">
                      &nbsp;Shuffle Intra-group&nbsp;
                      <img src={checkOrCircle(shuffleIntraGroup)} />
                    </label>
                  </>}
                </div>
              )}
            </div>

            {/* Voice controls (expert only) */}
            <div className="input-group">
              <div className="col-auto" style={{ display: showExpertSettings ? '' : 'none' }}>
                <input type="checkbox" className="btn-check" autoComplete="off"
                  id="btncheckvoice" aria-label="Voice"
                  title="Toggles display of voice-related settings"
                  checked={voice.voiceEnabled}
                  disabled={!voice.voiceCapable || voice.manualVoice}
                  onChange={e => vm.morseVoice.voiceEnabled(e.target.checked)} />
                <label className="btn btn-outline-primary" htmlFor="btncheckvoice" aria-hidden="true">
                  <img src={img('chatquoteImage')} />&nbsp;Voice&nbsp;
                  <img src={checkOrCircle(voice.voiceEnabled)} />
                </label>
              </div>

              {showExpertSettings && voice.voiceEnabled && <>
                <div className="col-auto">
                  <input type="checkbox" className="btn-check" autoComplete="off"
                    aria-label="Spell" id="btncheckvoicespell"
                    checked={voice.voiceSpelling}
                    onChange={e => vm.morseVoice.voiceSpelling(e.target.checked)} />
                  <label className="btn btn-outline-primary" htmlFor="btncheckvoicespell" aria-hidden="true">
                    <img src={img('spellcheckImage')} />&nbsp;Spell&nbsp;
                    <img src={checkOrCircle(voice.voiceSpelling)} />
                  </label>
                </div>
                <div className="col-auto">
                  <input type="checkbox" className="btn-check" autoComplete="off"
                    aria-label="Arm Recap" id="btncheckmanualVoice"
                    checked={voice.manualVoice}
                    onChange={e => vm.morseVoice.manualVoice(e.target.checked)} />
                  <label className="btn btn-outline-primary" htmlFor="btncheckmanualVoice" aria-hidden="true">
                    <img src={img('bootstrapRebootImage')} />&nbsp;Arm Recap&nbsp;
                    <img src={checkOrCircle(voice.manualVoice)} />
                  </label>
                </div>
                <div className="col-auto">
                  <input type="checkbox" className="btn-check" autoComplete="off"
                    aria-label="Speak First" id="btncheckspeakfirst"
                    checked={voice.speakFirst}
                    onChange={e => vm.morseVoice.speakFirst(e.target.checked)} />
                  <label className="btn btn-outline-primary" htmlFor="btncheckspeakfirst" aria-hidden="true">
                    <img src={img('chatRightDotsImage')} />&nbsp;Voice First&nbsp;
                    <img src={checkOrCircle(voice.speakFirst)} />
                  </label>
                </div>
                <div className="col-md-auto">
                  <div className="input-group">
                    <label htmlFor="voiceThinkingTime" className="input-group-text">
                      Delay Before<img width={20} height={20} src={img('stopwatchImage')} alt="" />
                    </label>
                    <input id="voiceThinkingTime" name="voiceThinkingTime" type="number"
                      style={{ maxWidth: 75, minWidth: 75 }} className="form-control"
                      min={0} max={10} step={0.25}
                      value={voice.voiceThinkingTime}
                      onChange={e => vm.morseVoice.voiceThinkingTime(Number(e.target.value))} />
                    <label className="input-group-text">
                      <span>{voice.voiceThinkingTimeWpm}</span><span>&nbsp;wpm</span>
                    </label>
                  </div>
                </div>
                <div className="col-md-auto">
                  <div className="input-group">
                    <label htmlFor="voiceAfterThinkingTime" className="input-group-text">
                      Delay After<img width={20} height={20} src={img('stopwatchImage')} alt="" />
                    </label>
                    <input id="voiceAfterThinkingTime" name="voiceAfterThinkingTime" type="number"
                      style={{ maxWidth: 75, minWidth: 75 }} className="form-control"
                      min={0} max={10} step={0.25}
                      value={voice.voiceAfterThinkingTime}
                      onChange={e => vm.morseVoice.voiceAfterThinkingTime(Number(e.target.value))} />
                  </div>
                </div>
                {voice.voiceVoices.length > 0 && (
                  <div className="col-auto">
                    <select aria-label="Choose speaker" id="selectVoiceDropdown" className="form-select"
                      value={voice.voiceVoiceIdx ?? ''}
                      onChange={e => vm.morseVoice.voiceVoiceIdx(Number(e.target.value))}>
                      <option value="">Choose speaker...</option>
                      {voice.voiceVoices.map((v: any) => (
                        <option key={v.idx} value={v.idx}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="col-md-auto">
                  <div className="input-group">
                    <label htmlFor="voiceVolume" className="input-group-text">
                      <img role="img" width={20} height={20} src={img('volumeImage')} alt="Voice Volume" />
                    </label>
                    <input id="voiceVolume" name="voiceVolume" type="number"
                      style={{ maxWidth: 75, minWidth: 75 }} className="form-control"
                      min={0} max={10} step={1}
                      value={voice.voiceVolume}
                      onChange={e => vm.morseVoice.voiceVolume(Number(e.target.value))} />
                  </div>
                </div>
                <div className="col-auto">
                  <input type="checkbox" className="btn-check" autoComplete="off"
                    aria-label="Last Only" id="btnvoicelastonly"
                    checked={voice.voiceLastOnly}
                    onChange={e => vm.morseVoice.voiceLastOnly(e.target.checked)} />
                  <label className="btn btn-outline-primary" htmlFor="btnvoicelastonly" aria-hidden="true">
                    <img src={img('alignendImage')} />&nbsp;Last Only&nbsp;
                    <img src={checkOrCircle(voice.voiceLastOnly)} />
                  </label>
                </div>
                <div className="col-md-auto">
                  <div className="input-group">
                    <label htmlFor="voicePitch" className="input-group-text">
                      Pitch<img width={20} height={20} src={img('musicnoteImage')} alt="" />
                    </label>
                    <input id="voicePitch" name="voicePitch" type="number"
                      style={{ maxWidth: 75, minWidth: 75 }} className="form-control"
                      min={0} max={2} step={0.25}
                      value={voice.voicePitch}
                      onChange={e => vm.morseVoice.voicePitch(Number(e.target.value))} />
                  </div>
                </div>
                <div className="col-md-auto">
                  <div className="input-group">
                    <label htmlFor="voiceRate" className="input-group-text">
                      Rate<img width={20} height={20} src={img('speedometerImage')} alt="" />
                    </label>
                    <input id="voiceRate" name="voiceRate" type="number"
                      style={{ maxWidth: 75, minWidth: 75 }} className="form-control"
                      min={0.1} max={10} step={0.1}
                      value={voice.voiceRate}
                      onChange={e => vm.morseVoice.voiceRate(Number(e.target.value))} />
                  </div>
                </div>
                <div className="col-md-auto">
                  <div className="input-group">
                    <label htmlFor="voiceBufferMaxLength" className="input-group-text">
                      Voice After<img width={20} height={20} src={img('bookshelfImage')} alt="" />
                    </label>
                    <input id="voiceBufferMaxLength" name="voiceBufferMaxLength" type="number"
                      style={{ maxWidth: 75, minWidth: 75 }} className="form-control"
                      min={1} max={999} step={1}
                      value={voice.voiceBufferMaxLength}
                      onChange={e => vm.morseVoice.voiceBufferMaxLength(Number(e.target.value))} />
                  </div>
                </div>
              </>}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
