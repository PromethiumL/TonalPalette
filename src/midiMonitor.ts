import { NoteMessageEvent, WebMidi } from "webmidi"

export type CallbackFn = (e: NoteMessageEvent) => void

export interface MidiObserver {
  midiMonitor?: MidiMonitor
  notifyMidiEvent(e: NoteMessageEvent): void
  subscribeMonitor(monitor: MidiMonitor): void
}

export class MidiMonitor {
  subscribers: MidiObserver[] = []
  initialized: boolean = false
  deviceStates: Map<string, boolean> = new Map()

  constructor() {
    this.setupMidi()
  }

  onMidiEvent(e: NoteMessageEvent) {
    for (const sub of this.subscribers)
      sub.notifyMidiEvent(e)
  }

  addSubscriber(obj: any) {
    this.subscribers.push(obj)
  }

  setMIDIInputDevices(deviceNames: string[]) {
    WebMidi.removeListener()
    for (const key of this.deviceStates.keys())
      this.deviceStates.set(key, false)
    const names = new Set(deviceNames)
    const devices = WebMidi.inputs.filter((inp) => names.has(inp.name))
    for (const d of devices) {
      d.addListener("noteon", this.onMidiEvent.bind(this))
      d.addListener("noteoff", this.onMidiEvent.bind(this))
      this.deviceStates.set(d.name, true)
    }
    console.log('Update selected devices to', deviceNames)
  }

  setupMidi() {
    WebMidi.enable()
      .then(() => {

        for (const d of WebMidi.inputs)
          this.deviceStates.set(d.name, false)

        let devicesToUse: string[] = []

        // Try to read local settings
        const localSettings = localStorage.getItem("midi devices")
        if (localSettings != null) {
          const parsed: string[] = JSON.parse(localSettings)
          for (const deviceName of parsed)
            if (WebMidi.inputs.findIndex((x) => x.name === deviceName) > -1)
              devicesToUse.push(deviceName)
        } else {
          devicesToUse = WebMidi.inputs.map((x) => x.name)
          // If local settings do not exist, use all available inputs.
        }
        console.log('These devices will be used', devicesToUse)
        this.setMIDIInputDevices(devicesToUse)
        this.initialized = true
        dispatchEvent(new Event('onMidiInitialized'))
      })
      .catch((err) => console.error(err))
  }
}
