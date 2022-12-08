export interface Estimation {
  prediction: {
    counter: any
    name: string
    pitch: number
  }
  results: {
    counter: any
    name: string
    pitch: number
  }[]
}

export interface Controls {
  [key: string]: boolean | number
  minPitch: number
  maxPitch: number

  maxVelocity: number
  bgTransitionSpeed: number
  particleNoiseStep: number

  particleInitialVelocityXMean: number
  particleInitialVelocityXStd: number
  particleInitialVelocityYMean: number
  particleInitialVelocityYStd: number

  particleMinSaturation: number
  particleMaxSaturation: number
  particleMinLightness: number
  particleMaxLightness: number
  particleMinAlpha: number
  particleMaxAlpha: number

  particleMinRadius: number
  particleMaxRadius: number
  bottomBorder: number
  bgSaturation: number
  bgLightness: number
  bgAlpha: number
  tonalEstimatorWindowSize: number

  showNoteCaption: boolean
  plotTonalEstimation: boolean
}
