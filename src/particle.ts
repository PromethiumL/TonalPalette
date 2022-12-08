import { SceneObject } from "./sceneObject"
import P5 from 'p5'
import { Controls } from "./types"

export class Particle extends SceneObject {
  alive = true
  caption: string = ''
  pitch: number = 0
  p5!: P5
  x: number = 0
  y: number = 0
  color!: P5.Color
  radius: number = 10
  maxVelocity: number = .5
  seedX: number = 42
  seedY: number = -42
  t: number = 0
  noiseStep!: number
  v!: P5.Vector
  controls!: Controls

  constructor(
    p5: P5,
    controls: Controls,
    x = p5.width / 2,
    y = p5.height,
    color: P5.Color = p5.color('green'),
    radius = 10,
    pitch = 69,
    caption = 'A',
  ) {
    super()
    this.p5 = p5
    this.caption = caption
    this.pitch = pitch
    this.x = x
    this.y = y
    this.color = color
    this.radius = radius
    // suggested maxVelocity: 0.1, 3, and 5 
    this.controls = controls
    this.maxVelocity = controls.maxVelocity

    this.seedX = p5.random(1, 10000)
    this.seedY = p5.random(1, 10000)
    this.t = 0
    this.noiseStep = controls.particleNoiseStep
    this.v = p5.createVector(
      p5.randomGaussian(controls.particleInitialVelocityXMean, controls.particleInitialVelocityXStd),
      p5.randomGaussian(controls.particleInitialVelocityYMean, controls.particleInitialVelocityYStd)
    )
    // this.v = p5.createVector(p5.randomUniform(-.5, .5), p5.randomUniform(-.5, .5))
  }

  update() {
    this.x += this.v.x
    this.y += this.v.y

    this.t += this.noiseStep
    this.v.x += 0.01 * (this.p5.noise(this.seedX + this.t) - .5)
    // this.v.y += noise(this.seedY + this.t) - .5
    this.v.y += this.p5.noise(this.seedY + this.t) - .8
    this.v.limit(this.maxVelocity)  // comment this line if you want keep speeding up

    if (this.x + this.radius < 0 || this.x - this.radius > this.p5.width)
      this.destroy()
    if (this.y + this.radius < 0 || this.y - this.radius > this.p5.height)
      this.destroy()
  }

  show() {
    const p5 = this.p5
    const controls = this.controls
    if (!controls.showNoteCaption) {
      p5.push()
      p5.noStroke()
      p5.fill(this.color)
      p5.ellipse(this.x, this.y, this.radius, this.radius)
      p5.pop()
    }
    if (controls.showNoteCaption) {
      p5.push()
      p5.textAlign(p5.CENTER, p5.CENTER)
      p5.textSize(3 * this.radius)
      p5.noStroke()
      p5.fill(p5.hue(this.color), .5, .5, .9)
      p5.text(this.caption, this.x, this.y)
      p5.pop()
    }
  }
}