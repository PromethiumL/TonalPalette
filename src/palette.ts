/* 
 * This palette mapping is contributed by Safiyah.
 */
export const pitch2hue = (pitch: number) => {
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