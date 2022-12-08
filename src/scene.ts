import { TonalEstimator } from "./tonalEstimator"
import { Controls } from "./types"
import { TonalObserver } from "./tonalEstimator"
import { MidiMonitor, MidiObserver } from "./midiMonitor"
import P5 from 'p5'
import { Particle } from "./particle"
import { NOTE_NAMES } from "./constants"
import { pitch2hue } from "./palette"
import { NoteMessageEvent } from "webmidi"
import { SceneObject } from "./sceneObject"


export class MainScene implements TonalObserver, MidiObserver {
  estimator!: TonalEstimator
  bgHue: number = 160
  groups: { [key: string]: SceneObject[] } = {}
  p5: P5
  midiMonitor!: MidiMonitor
  controls: Controls
  constructor(p5: P5, config: Controls) {
    this.p5 = p5
    this.controls = config
    this.subscribeMonitor(new MidiMonitor())
    this.subscribeEstimator(new TonalEstimator())
    this.estimator.subscribeMonitor(this.midiMonitor)
  }

  subscribeEstimator(estimator: TonalEstimator) {
    this.estimator = estimator
    estimator.subscribers.push(this)
  }
  subscribeMonitor(monitor: MidiMonitor): void {
    this.midiMonitor = monitor
    monitor.addSubscriber(this)
  }
  update() {
    // console.log(Object.keys(this))
    for (const group of Object.keys(this.groups)) {
      this.groups[group].forEach(obj => obj.update())
      this.groups[group] = this.groups[group].filter(o => o.alive)
      this.groups[group].forEach(obj => obj.show())
    }
  }
  notifyTonalEstimation(): void {

  }
  notifyMidiEvent(e: NoteMessageEvent): void {
    const pitch = (e as any).rawData[1]
    const controls = this.controls
    // New particle
    if (e.note.rawAttack < 1)
      return
    const p5 = this.p5
    const x = p5.map(pitch, controls.minPitch, controls.maxPitch, 0, p5.width)
    const y = controls.bottomBorder * p5.height
    p5.push()
    p5.colorMode(p5.HSL)
    this.groups.circles.push(new Particle(
      p5, controls, x, y,
      p5.color(
        pitch2hue(this.estimator.estimation.prediction.pitch), // hue
        p5.random(controls.particleMinSaturation * 1, controls.particleMaxSaturation * 1),  // saturation
        p5.random(controls.particleMinLightness * 1, controls.particleMaxLightness * 1),  // lightness
        p5.random(controls.particleMinAlpha * 1, controls.particleMaxAlpha * 1)     // alpha
      ),
      p5.map(e.note.rawAttack, 0, 128, controls.particleMinRadius * 1, controls.particleMaxRadius * 1), // radius
      e.note.number, // pitch
      NOTE_NAMES[this.estimator.estimation.prediction.pitch][e.note.number % 12]  // caption
    ))
    p5.pop()
  }
}
