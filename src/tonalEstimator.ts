import { NoteMessageEvent } from "webmidi"
import { MidiMonitor, MidiObserver } from "./midiMonitor"
import { Estimation } from "./types"

export interface TonalObserver {
  estimator: TonalEstimator
  notifyTonalEstimation(): void
  subscribeEstimator(est: TonalEstimator): void
}

export class TonalEstimator implements MidiObserver {
  windowSize = 15
  window: { pitch: number, velocity: number }[] = []
  counter: number[] = new Array(12).fill(0)
  majorScale = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1]
  keyNames = 'C Db D Eb E F F# G Ab A Bb B'.split(' ')
  subscribers: TonalObserver[] = []
  monitor?: MidiMonitor

  subscribeMonitor(monitor: MidiMonitor): void {
    this.monitor = monitor
    monitor.subscribers.push(this)
  }

  estimation: Estimation = {
    prediction: {
      counter: 1,
      name: 'C',
      pitch: 0
    },
    results: [{
      counter: 0,
      name: 'C',
      pitch: 0
    }]
  }

  update(pitch: number, velocity: number) {
    pitch %= 12

    // Apply new pitch to the counter
    for (let tonic = 0; tonic < 12; tonic++)
      if (this._isDiatonic(this.majorScale, tonic, pitch))
        this.counter[tonic] += velocity

    // Update window
    this.window.push({ pitch: pitch, velocity: velocity })

    // remove oldest element from the window
    if (this.window.length > this.windowSize) {
      const oldTonic = this.window.splice(0, 1)[0]
      for (let p = 0; p < 12; p++)
        if (this._isDiatonic(this.majorScale, p, oldTonic.pitch))
          this.counter[p] -= oldTonic.velocity
    }
  }

  estimate() {
    const results = this.counter
      .map((t, i) => ({ counter: t, name: this.keyNames[i], pitch: i }))
      .sort((a, b) => (b.counter - a.counter))
    return {
      prediction: results[0],
      results: results
    }
  }

  reset() {
    this.counter = new Array(12).fill(0)
    this.window = []
  }

  _isDiatonic(scale: number[], tonic: number, pitch: number) {
    pitch %= 12
    return scale[(pitch - tonic + 1200) % 12]
  }

  notifyMidiEvent(e: NoteMessageEvent): void {
    console.log('notify', e)
    const pitch = e.note.number
    // this.update(pitch, Math.max(e.note.attack, .01))
    this.update(pitch, 1)
    this.estimation = this.estimate()
    for (const sub of this.subscribers)
      sub.notifyTonalEstimation()
  }
}