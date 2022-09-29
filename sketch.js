/* 
 * Author: PromethiumL
 * Contributor: Safiyah (Artistic)
 */

// Navigation
// const START_PAGE = 0
const SETTINGS_PAGE = 1
const MAIN = 2

let screenIndex = MAIN

const DEFAULT_MIDI_DEVICE_ID = 0

let SHOW_BUTTONS = true

let bgHue = 160

let estimation = {}

let controls = {}
let buttons = {}

class Control {
  height = 20
  width = 100
  gap = 10
  constructor(type, caption = 'control', options = {}) {
    const acceptable_types = 'slider,switch,color'.split(',')
    this.type = null
    for (const tp of acceptable_types)
      if (tp === type)
        this.type = tp
    if (!this.type)
      throw `invalid control type ${type}`

    this.caption = caption
    this.options = options
    this.value = null
    this.clickableRect = { x: 0, y: 0, w: 0, h: 0 }
  }

  show(x, y, colOffset = null) {
    // if colOffset defined, auto alignment will not be used. 
    push()
    translate(x, y)
    // stroke(0)
    stroke('#ffffff')
    fill(0)
    let offsetX = 10
    textAlign(LEFT, CENTER)
    blendMode(DARKEST)
    text(this.caption, offsetX, this.height * .5)
    blendMode(BLEND)

    offsetX += textWidth(this.caption) + this.gap
    // Get actual position from the the subclass
    const { w, h } = colOffset ? this.drawControl(colOffset) : this.drawControl(offsetX)
    this.clickableRect = { x: x + (colOffset ? colOffset : offsetX), y, w, h }
    pop()
  }

  drawControl(x, y) {
    throw "not implemented"
  }

  valueOf() {
    return this.value
  }

  update() {
    if (screenIndex == SETTINGS_PAGE && this.isMouseInside() && mouseIsPressed) {
      if (mouseButton == CENTER)
        this.value = this.default_value
      else {
        this._update()
      }
    }
  }

  isMouseInside() {
    const { x, y, w, h } = this.clickableRect
    return x < mouseX && mouseX < x + w && y < mouseY && mouseY < y + h
  }
}

class Slider extends Control {
  constructor(caption, min_value, max_value, default_value, post_process_func=null) {
    super('slider', caption, { min_value, max_value })
    this.value = (min_value + max_value) / 2
    this.min_value = min_value
    this.max_value = max_value
    this.value = min_value
    this.default_value = default_value
    if (typeof default_value === 'undefined') {
      this.value = this.min_value
    } else if (default_value >= min_value && default_value <= max_value) {
      this.value = default_value
    }
    this.post_process_func = post_process_func
  }

  drawControl(x) {
    push()

    // Outline
    // fill('#aacca9')
    noStroke()
    fill('#bbdba8')
    // strokeWeight(2)
    rect(x, 0, this.width, this.height)

    // Draw value bar
    const x_val = map(
      this.value,
      this.min_value, this.max_value,
      0, this.width)
    noStroke()
    fill('#e8e775')
    rect(x, 0, x_val, this.height)

    // Show decimals
    fill('#7f7f7f')
    blendMode(DIFFERENCE)
    textAlign(CENTER, CENTER)
    text(Math.round(this.value * 100) / 100, x + this.width / 2, this.height / 2)
    blendMode(BLEND)
    // filter()

    pop()
    return {
      w: this.width,
      h: this.height
    }
  }

  _update() {
    const { x, w } = this.clickableRect
    console.log(mouseX, x, x + w)
    this.value = map(
      mouseX,
      x,
      x + w,
      this.min_value,
      this.max_value
    )
    if (this.post_process_func) {
      this.value = this.post_process_func(this.value)
    }
    // console.log('update', this.value)
  }
}

function initControls() {
  controls.showNoteCaption = new Slider('Toggle Note Caption', 0, 1, 0, (x) => Math.round(x))

  controls.tonalEstimatorWindowSize = new Slider('Tonal Estimator Window [Experimental]', 5, 50, 15)

  controls.minPitch = new Slider('Min Pitch', 0, 64, 36, x => Math.round(x))
  controls.maxPitch = new Slider('Max Pitch', 72, 127, 96, x => Math.round(x))

  controls.maxVelocity = new Slider('Max Y Velocity', 0, 5, 0.75)
  controls.bgTransitionSpeed = new Slider('Background Transition Speed', .1, 10, 3)
  controls.particleNoiseStep = new Slider('Particle Noise Step', 0, 0.5, 0.1)

  controls.particleInitialVelocityXMean = new Slider('Particle Initial Velocity X Mean', -50, 50, 0)
  controls.particleInitialVelocityXStd = new Slider('Particle Initial Velocity X Std', 0, 50, 0.5)
  controls.particleInitialVelocityYMean = new Slider('Particle Initial Velocity Y Mean', -50, 50, 0)
  controls.particleInitialVelocityYStd = new Slider('Particle Initial Velocity Y Std', 0, 50, 0.5)

  controls.particleMinSaturation = new Slider('Particle Min Saturation', 0, 1, .6)
  controls.particleMaxSaturation = new Slider('Particle Max Saturation', 0, 1, .8)
  controls.particleMinLightness = new Slider('Particle Min Lightness', 0, 1, .5)
  controls.particleMaxLightness = new Slider('Particle Max Lightness', 0, 1, .5)
  controls.particleMinAlpha = new Slider('Particle Min Alpha', 0, 1, .8)
  controls.particleMaxAlpha = new Slider('Particle Max Alpha', 0, 1, 1)

  controls.particleMinRadius = new Slider('Particle Min Radius', 3, 20, 5)
  controls.particleMaxRadius = new Slider('Particle Max Radius', 30, 60, 40)
  controls.bottomBorder = new Slider('Bottom Border', 0, 1, .9)
  controls.bgSaturation = new Slider('Background Saturation', 0, 1, .6)
  controls.bgLightness = new Slider('Background Lightness', 0, 1, .4)
  controls.bgAlpha = new Slider('Background Alpha', 0, 1, .9)
}

function drawControls() {
  if (screenIndex == SETTINGS_PAGE) {
    let x = width * 0.3, y = 100
    let dy = 30
    for (const c of Object.keys(controls)) {
      controls[c].show(x, y, width / 4)
      controls[c].update()
      y += dy
    }
  }
}

function drawButtons() {
  buttons.settingsBtn.position(width - 100, 30)
  buttons.clearBtn.position(width - 170, 30)
  buttons.aboutBtn.position(width - 240, 30)

  // Visibility
  for (const btnName in buttons) {
    const btn = buttons[btnName]
    SHOW_BUTTONS ? btn.show() : btn.hide()
  }
}

function initButtons() {
  buttons.settingsBtn = createButton('')
  buttons.settingsBtn.class('fa-gear')
  buttons.settingsBtn.hoverAnimation = 'fa-spin'
  buttons.settingsBtn.mousePressed(() => { screenIndex = screenIndex == MAIN ? SETTINGS_PAGE : MAIN })

  buttons.clearBtn = createButton('')
  buttons.clearBtn.class('fa-trash')
  buttons.clearBtn.hoverAnimation = 'fa-shake'
  buttons.clearBtn.mousePressed(() => scene.circles.length = 0)

  buttons.aboutBtn = createButton('')
  buttons.aboutBtn.class('fa-duo-tone fa-circle-info')
  buttons.aboutBtn.hoverAnimation = 'fa-beat'
  buttons.aboutBtn.mousePressed(() => window.open('https://github.com/PromethiumL/TonalPalette'))

  for (const btnName in buttons) {
    const btn = buttons[btnName]
    btn.addClass('img-btn fa')
    if (btn.hoverAnimation) {
      btn.mouseOver(() => btn.addClass(btn.hoverAnimation))
      btn.mouseOut(() => btn.removeClass(btn.hoverAnimation))
    }
  }
}

function keyPressed() {
  if (key == 'c' || key == 'C') {
    scene.circles.length = 0
  }

  if (key == 's') {
    screenIndex = screenIndex == MAIN ? SETTINGS_PAGE : MAIN
  }

  if (key == 'r') {
    for (const c in controls)
      controls[c].value = controls[c].default_value
  }

  if (key == 'e') {
    const obj = {}
    for (const c in controls)
      obj[c] = controls[c].value
    console.log(obj)
  }

  if (key == 'h') {
    SHOW_BUTTONS = !SHOW_BUTTONS
  }
}

function loadConfiguration(configObj) {
  for (const c in configObj)
    controls[c].value = configObj[c]
}


const NOTE_NAMES = [
  ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'], // C
  ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'], // Db
  ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'], // D
  ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'], // Eb
  ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'], // E
  ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'], // F
  ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'], // Gb
  ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'], // G
  ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'], // Ab
  ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'], // A
  ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'], // Bb
  ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'], // B
]


class TonalEstimator {
  // windowSize = 15
  window = []
  counter = new Array(12).fill(0)
  majorScale = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1]
  keyNames = 'C Db D Eb E F F# G Ab A Bb B'.split(' ')

  update(pitch, velocity) {
    pitch %= 12
    velocity ||= 1.0
    // Apply new pitch to the counter
    for (let tonic = 0; tonic < 12; tonic++)
      if (this._isDiatonic(this.majorScale, tonic, pitch))
        this.counter[tonic] += velocity

    // Update window
    this.window.push({ pitch: pitch, velocity: velocity })

    // remove oldest element from the window
    if (this.window.length > controls.tonalEstimatorWindowSize) {
      const oldTonic = this.window.splice(0, 1)[0]
      for (let p = 0; p < 12; p++)
        if (this._isDiatonic(this.majorScale, p, oldTonic.pitch))
          this.counter[p] -= oldTonic.velocity
    }
    // console.log(this.window)
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

  _isDiatonic(scale, tonic, pitch) {
    pitch %= 12
    return scale[(pitch - tonic + 1200) % 12]
  }
}

const tonalEstimator = new TonalEstimator()

class Circle extends SceneObject {
  alive = true
  constructor(
    x = width / 2,
    y = height,
    color = 'white',
    radius = 10,
    pitch = 69,
    caption = 'A'
  ) {
    super()
    this.caption = caption
    this.pitch = pitch
    this.x = x
    this.y = y
    this.color = color
    this.radius = radius
    // suggested maxVelocity: 0.1, 3, and 5 
    this.maxVelocity = controls.maxVelocity.valueOf()

    this.seedX = random(1, 10000)
    this.seedY = random(1, 10000)
    this.t = 0
    this.noiseStep = controls.particleNoiseStep.valueOf()
    this.v = createVector(
      randomGaussian(controls.particleInitialVelocityXMean.valueOf(), controls.particleInitialVelocityXStd.valueOf()),
      randomGaussian(controls.particleInitialVelocityYMean.valueOf(), controls.particleInitialVelocityYStd.valueOf())
    )
    // this.v = createVector(randomUniform(-.5, .5), randomUniform(-.5, .5))
  }

  update() {
    this.x += this.v.x
    this.y += this.v.y

    this.t += this.noiseStep
    this.v.x += 0.01 * (noise(this.seedX + this.t) - .5)
    // this.v.y += noise(this.seedY + this.t) - .5
    this.v.y += noise(this.seedY + this.t) - .8
    this.v.limit(this.maxVelocity)  // comment this line if you want keep speeding up

    if (this.x + this.radius < 0 || this.x - this.radius > width)
      this.destroy()
    if (this.y + this.radius < 0 || this.y - this.radius > height)
      this.destroy()
  }

  show() {
    if (controls.showNoteCaption < .5) {
      push()
      noStroke()
      fill(this.color, this.color, this.color, this.color)
      ellipse(this.x, this.y, this.radius, this.radius)
      pop()
    }
    if (controls.showNoteCaption > .5) {
      push()
      textAlign(CENTER, CENTER)
      textSize(3 * this.radius)
      noStroke()
      fill(this.color, .5, .5, .9)
      text(this.caption, this.x, this.y)
      pop()
    }
  }
}

let scene = new Scene()
scene.circles = []

function setupMidi(onMidiEnabled) {
  WebMidi
    .enable()
    .then(onMidiEnabled)
    .catch(err => console.error(err))
}

function onMidiEnabled() {
  console.log(`Available midi devices:`, WebMidi.inputs)
  WebMidi.inputs.forEach((device, index) => {
    console.log(index, device.name)
  })
  let deviceID = DEFAULT_MIDI_DEVICE_ID
  if (WebMidi.inputs.length == 1)
    deviceID = 0
  if (WebMidi.inputs.length > 0) {
    deviceID = parseInt(prompt(`Available MIDI Devices: \n ${WebMidi.inputs.map((d, i) => 'Device ' + i + ': ' + d.name + '\n')}`))
    if (!WebMidi.inputs.map((x, i) => i).find((d, i) => i === deviceID))
      deviceID = DEFAULT_MIDI_DEVICE_ID

    console.log('Midi Input Device id:', deviceID)
    const myKeyboard = WebMidi.inputs[deviceID]
    myKeyboard.addListener('noteon', noteOn, { channels: [1] })
    myKeyboard.addListener('noteoff', noteOff, { channels: [1] })
  } else {
    console.err('No MIDI device is found. Refresh after connecting a new device.')
    window.alert('No MIDI device is found. Refresh after connecting a new device.')
  }
}

function noteOn(e) {
  const pitch = e.rawData[1]

  // Update tonic counter
  // tonalEstimator.update(pitch, Math.max(e.note.attack, .01))
  tonalEstimator.update(pitch, Math.max(1, .01))
  estimation = tonalEstimator.estimate()
  // console.log('tonic estimation:', estimation.prediction.name)

  // New particle
  if (e.note.rawAttack < 1)
    return
  const x = map(pitch, controls.minPitch, controls.maxPitch, 0, width)
  const y = controls.bottomBorder * height
  push()
  colorMode(HSL)
  scene.circles.push(new Circle(
    x, y,
    color(
      pitch2hue(tonalEstimator.estimate().prediction.pitch), // hue
      random(controls.particleMinSaturation * 1, controls.particleMaxSaturation * 1),  // saturation
      random(controls.particleMinLightness * 1, controls.particleMaxLightness * 1),  // lightness
      random(controls.particleMinAlpha * 1, controls.particleMaxAlpha * 1)     // alpha
    ),
    map(e.note.rawAttack, 0, 128, controls.particleMinRadius * 1, controls.particleMaxRadius * 1), // radius
    e.note.number, // pitch
    NOTE_NAMES[estimation.prediction.pitch][e.note.number % 12]  // caption
  ))
  pop()
}

function noteOff(e) {
  const pitch = e.rawData[1]
  console.log('off', pitch)
}

function myBackground() {
  const targetHue = pitch2hue(estimation.prediction.pitch)
  const delta = (targetHue - bgHue + 360) % 360
  // console.log(delta, bgHue)
  const sign = Math.abs(delta) < 180 ? 1 : -1
  // If too far from the target hue
  if (abs(delta) > controls.bgTransitionSpeed.valueOf()) {
    bgHue += sign * controls.bgTransitionSpeed.valueOf()
    bgHue += 3600
    bgHue %= 360
  }

  background(color(
    bgHue, // Hue
    controls.bgSaturation * 1,    // Saturation
    controls.bgLightness * 1,     // Lightness
    controls.bgAlpha * 1          // Alpha
  ))
}

function pitch2hue(pitch) {
  const hues = [
    .2199,
    .1480,
    .1273,
    .0886,
    .0571,
    .9993,
    .9063,
    .7800,
    .6463,
    .4797,
    .5332,
    .4329
  ]
  const i = (pitch) * 7 % 12
  return hues[i] * 360
}

function plotEstimation(est) {
  noStroke()
  let centerX = 200, centerY = 200
  const R = 150
  const r = R * .5
  const waveRadius = 80
  const sorted = est.results.sort((a, b) => b.pitch - a.pitch)
  let xs = []
  let ys = []
  fill(bgHue, .7, .7, .9)

  // Calculate the outer envolope
  beginShape()
  est.results
    .map((obj) => {
      const theta0 = obj.pitch * 7 * PI / 6 - PI / 2 - PI / 12
      return { ...obj, angle: (theta0 + 10 * TWO_PI) % TWO_PI }
    })
    .sort((a, b) => a.angle - b.angle)
    .forEach(
      obj => {
        const W = map(obj.counter, 0, controls.tonalEstimatorWindowSize * 1, 5, waveRadius)
        const waveX = (r + W) * cos(obj.angle) + centerX
        const waveY = (r + W) * sin(obj.angle) + centerY
        curveVertex(
          waveX,
          waveY
        )
        xs.push(waveX)
        ys.push(waveY)
      }
    )
  endShape(CLOSE)

  // Tonal "center"
  const avg_x = xs.reduce((a, b) => a + b) / 12
  const avg_y = ys.reduce((a, b) => a + b) / 12
  push()
  strokeWeight(0.1 * r)
  stroke(color(bgHue, .5, .5))

  // Draw central vector
  line(centerX, centerY, avg_x, avg_y)
  fill(bgHue, .3, .3, .9)
  noStroke()
  ellipse(avg_x, avg_y, .2 * r, .2 * r)
  pop()

  // Central caption
  push()
  fill(bgHue, .2, .1, .98)
  textAlign(CENTER, CENTER)
  textSize(0.8 * r)
  text(est.prediction.name, avg_x, avg_y)
  pop()

  // Caption, sector of each key 
  for (const key of est.results) {
    const i = key.pitch
    const theta0 = i * 7 * PI / 6 - PI / 2 - PI / 12
    const deltaTheta = PI / 6
    push()
    translate(centerX, centerY)
    stroke(pitch2hue(key.pitch), .7, .7, 1)
    const W = map(key.counter, 0, controls.tonalEstimatorWindowSize * 1, 5, 60)
    strokeWeight(W)
    strokeCap(SQUARE)
    arc(0, 0, R, R, theta0, theta0 + deltaTheta)

    push()
    // noFill()
    textSize(.3 * r)
    textAlign(CENTER, CENTER)
    fill(color(pitch2hue(key.pitch), .3, .5, .9))
    noStroke()
    text(key.name, R * cos(theta0 + PI / 12), R * sin(theta0 + PI / 12))
    pop()

    pop()
  }
}

function plotEstimationBar(est) {
  let offsetX = 10
  let offsetY = 10
  let textHeight = 30
  for (const key of est.results) {
    offsetY += textHeight
    textAlign(BASELINE, LEFT)
    push()
    textSize(textHeight)
    fill(pitch2hue(key.pitch), .7, .7, 1)
    text(key.name, offsetX, offsetY)

    stroke(0)
    rect(
      2 * textHeight,
      offsetY - textHeight,
      map(key.counter, 0, controls.tonalEstimatorWindowSize * 1, 0, 100),
      .9 * textHeight
    )
    pop()
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight)
}

function setup() {
  createCanvas(windowWidth, windowHeight)
  setupMidi(onMidiEnabled)
  colorMode(HSL, 360, 1, 1, 1)
  initControls()
  initButtons()
}

function draw() {
  estimation = tonalEstimator.estimate()
  myBackground()
  scene.update()
  plotEstimation(estimation)
  drawControls()
  drawButtons()
  // stroke(0)
  // push()
  // fill(0)
  // noStroke()
  // textSize(30)
  // text(new Date(), 0, 30)
  // pop()
}