import { GUI } from 'dat.gui'

import P5 from 'p5'
import { MainScene } from './scene'
import { Estimation, Controls } from './types'
import { pitch2hue } from './palette'
const PI = Math.PI

export const gui = new GUI()

export let controls: Controls = {
  minPitch: 36,
  maxPitch: 96,

  maxVelocity: 0.75,
  bgTransitionSpeed: 3,
  particleNoiseStep: 0.1,

  particleInitialVelocityXMean: 0,
  particleInitialVelocityXStd: 3,
  particleInitialVelocityYMean: 0,
  particleInitialVelocityYStd: 5,

  particleMinSaturation: .7,
  particleMaxSaturation: 1,
  particleMinLightness: .3,
  particleMaxLightness: .75,
  particleMinAlpha: .6,
  particleMaxAlpha: .9,

  particleMinRadius: 5,
  particleMaxRadius: 40,
  bottomBorder: .9,
  bgSaturation: .85,
  bgLightness: .85,
  bgAlpha: .9,
  tonalEstimatorWindowSize: 15,

  showNoteCaption: false,
  plotTonalEstimation: true,
  plotTonalRanking: false
}

export const sketch = (p: P5) => {
  let bgHue = 160

  const initMIDIControls = () => {
    const devices = [...scene.midiMonitor.deviceStates.keys()]
    const midiInputOptions = gui.addFolder('Midi Input Devices')
    midiInputOptions.open()
    console.log('midi devices to controls', scene.midiMonitor.initialized, devices)
    for (const d of devices) {
      controls[d] = scene.midiMonitor.deviceStates.get(d) as boolean
      const controller = midiInputOptions.add(controls, d)
      controller.onFinishChange(() => {
        console.log('GUI changed midi ports')
        const devicesToUse = devices.filter(d => controls[d])
        localStorage.setItem('midi devices', JSON.stringify(devicesToUse))
        scene.midiMonitor.setMIDIInputDevices(devicesToUse)
      })
    }
  }


  let scene: MainScene
  const initControls = () => {
    const midiOptions = gui.addFolder('Input')
    // midiOptions.open()
    midiOptions.add(controls, 'showNoteCaption')
    midiOptions.add(controls, 'minPitch', 0, 64, 1)
    midiOptions.add(controls, 'maxPitch', 72, 127, 1)

    const particleBehaviorOptions = gui.addFolder('Particle Behavior')
    // particleBehaviorOptions.open()
    particleBehaviorOptions.add(controls, 'maxVelocity', 0, 5, .05).name('Max Speed')
    particleBehaviorOptions.add(controls, 'particleNoiseStep', 0, .5, .05).name('Noise Step')

    particleBehaviorOptions.add(controls, 'particleInitialVelocityXMean', -50, 50, 1).name('vx mean')
    particleBehaviorOptions.add(controls, 'particleInitialVelocityXStd', 0, 50, 1).name('vx std')
    particleBehaviorOptions.add(controls, 'particleInitialVelocityYMean', -50, 50, 1).name('vy mean')
    particleBehaviorOptions.add(controls, 'particleInitialVelocityYStd', 0, 50, 1).name('vy std')

    particleBehaviorOptions.add(controls, 'particleMinSaturation', 0, 1, .01).name('Min Saturation')
    particleBehaviorOptions.add(controls, 'particleMaxSaturation', 0, 1, .01).name('Max Saturation')
    particleBehaviorOptions.add(controls, 'particleMinLightness', 0, 1, .01).name('Min Lightness')
    particleBehaviorOptions.add(controls, 'particleMaxLightness', 0, 1, .01).name('Max Lightness')
    particleBehaviorOptions.add(controls, 'particleMinAlpha', 0, 1, .01).name('Min Alpha')
    particleBehaviorOptions.add(controls, 'particleMaxAlpha', 0, 1, .01).name('Max Alpha')

    particleBehaviorOptions.add(controls, 'particleMinRadius', 3, 20, .5).name('Min Radius')
    particleBehaviorOptions.add(controls, 'particleMaxRadius', 30, 60, .5).name('Max Radius')
    particleBehaviorOptions.add(controls, 'bottomBorder', 0, 1, .02).name('Bottom Y')

    const bgOptions = gui.addFolder('Background')
    // bgOptions.open()
    bgOptions.add(controls, 'bgTransitionSpeed', .1, 10, .1).name('BG Transition Speed')
    bgOptions.add(controls, 'bgSaturation', 0, 1, .01).name('BG Saturation')
    bgOptions.add(controls, 'bgLightness', 0, 1, .01).name('BG Lightness')
    bgOptions.add(controls, 'bgAlpha', 0, 1, .01).name('BG Alpha')

    const tonalityOptions = gui.addFolder('Tonality Options')
    tonalityOptions.open()
    tonalityOptions.add(scene.estimator, 'windowSize', 1, 45, 1).name('Estimator Window Size').onFinishChange(() => {
      scene.estimator.window.length = 0
      scene.estimator.counter.fill(0)
    })
    tonalityOptions.add(controls, 'plotTonalEstimation').name('Show Tonal Distribution')
    tonalityOptions.add(controls, 'plotTonalRanking').name('Show Tonal Ranking')

    gui.width = 600
  }

  p.keyPressed = () => {
    if (p.key === 'c' || p.key === 'C') {
      scene.groups.circles.length = 0
    }
  }

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight)
    p.colorMode(p.HSL, 360, 1, 1, 1)

    // Add about btn to the gui controls
    gui.add({ About: () => { window.open('https://github.com/PromethiumL/TonalPalette') } }, 'About').name('Go To GitHub Page')

    // Add event listener before monitor (in scene) being created below.
    window.addEventListener('onMidiInitialized', initMIDIControls)

    scene = new MainScene(p, controls)
    scene.groups.circles = []

    initControls()
  }

  p.draw = () => {
    myBackground()
    const estimation = scene.estimator?.estimate()
    if (estimation) {
      if (controls.plotTonalEstimation)
        plotEstimation(estimation)

      if (controls.plotTonalRanking)
        plotEstimationBar(estimation)
    }
    scene.update()
  }

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight)
  }

  const plotEstimationBar = (est: Estimation) => {
    let offsetX = 10
    let textHeight = 30
    let offsetY = 10
    if (controls.plotTonalEstimation)
      offsetY = p.height - textHeight * 12 - textHeight
    for (const key of est.results) {
      offsetY += textHeight
      p.textAlign(p.LEFT, p.BASELINE)
      p.push()
      p.textSize(textHeight)
      p.fill(pitch2hue(key.pitch), .7, .7, 1)
      p.text(key.name, offsetX, offsetY)

      p.stroke(128)
      p.rect(
        2 * textHeight,
        offsetY - textHeight,
        p.map(key.counter, 0, controls.tonalEstimatorWindowSize * 1, 0, 100),
        .9 * textHeight
      )
      p.pop()
    }
  }

  const plotEstimation = (est: Estimation) => {
    p.noStroke()
    let centerX = 200, centerY = 200
    const R = 150  // Outer radius
    const r = R * .5  // Inner radius
    const waveRadius = 80
    // const sorted = est.results.sort((a, b) => b.pitch - a.pitch)
    let xs: number[] = []
    let ys: number[] = []
    p.fill(bgHue, .7, .7, .9)

    // Calculate the outer envelope
    p.beginShape()
    est.results
      .map((obj) => {
        const theta0 = obj.pitch * 7 * PI / 6 - PI / 2 - PI / 12
        return { ...obj, angle: (theta0 + 10 * p.TWO_PI) % p.TWO_PI }
      })
      .sort((a, b) => a.angle - b.angle)
      .forEach(
        (obj) => {
          const W = p.map(obj.counter, 0, scene.estimator.windowSize, 5, waveRadius)
          const waveX = (r + W) * p.cos(obj.angle) + centerX
          const waveY = (r + W) * p.sin(obj.angle) + centerY
          p.curveVertex(
            waveX,
            waveY
          )
          xs.push(waveX)
          ys.push(waveY)
        }
      )
    p.endShape(p.CLOSE)

    // Tonal "center"
    const avg_x = xs.reduce((a, b) => a + b) / 12
    const avg_y = ys.reduce((a, b) => a + b) / 12
    p.push()
    p.strokeWeight(0.1 * r)
    p.stroke(p.color(bgHue, .5, .5))


    // Caption, sector of each key 
    for (const key of est.results) {
      const i = key.pitch
      const theta0 = i * 7 * PI / 6 - PI / 2 - PI / 12
      const deltaTheta = PI / 6
      p.push()
      p.translate(centerX, centerY)
      p.stroke(pitch2hue(key.pitch), .7, .7, 1)
      const W = p.map(key.counter, 0, controls.tonalEstimatorWindowSize * 1, 5, 60)
      p.strokeWeight(W)
      p.strokeCap(p.SQUARE)
      p.arc(0, 0, R, R, theta0, theta0 + deltaTheta)

      p.push()
      // noFill()
      p.textSize(.3 * r)
      p.textAlign(p.CENTER, p.CENTER)
      p.fill(p.color(pitch2hue(key.pitch), .3, .5, .9))
      p.noStroke()
      p.text(key.name, R * Math.cos(theta0 + PI / 12), R * Math.sin(theta0 + PI / 12))
      p.pop()

      p.pop()
    }

    // Draw central vector
    p.line(centerX, centerY, avg_x, avg_y)
    p.fill(bgHue, .5, .5, .7)
    p.noStroke()
    p.ellipse(avg_x, avg_y, .2 * r, .2 * r)
    p.pop()

    // Central caption
    p.push()
    p.fill(bgHue, .2, .1, .98)
    p.textAlign(p.CENTER, p.CENTER)
    p.textSize(0.8 * r)
    p.text(est.prediction.name, avg_x, avg_y)
    p.pop()

  }

  const myBackground = () => {
    if (scene.estimator?.estimation) {
      const targetHue = pitch2hue(scene.estimator.estimation.prediction.pitch)
      const delta = (targetHue - bgHue + 360) % 360
      const sign = Math.abs(delta) < 180 ? 1 : -1
      // If too far from the target hue
      if (Math.abs(delta) > controls.bgTransitionSpeed.valueOf()) {
        bgHue += sign * controls.bgTransitionSpeed.valueOf()
        bgHue += 3600
        bgHue %= 360
      }
    }

    p.background(p.color(
      bgHue, // Hue
      controls.bgSaturation * 1,    // Saturation
      controls.bgLightness * 1,     // Lightness
      controls.bgAlpha * 1          // Alpha
    ))
  }
}