export class SceneObject {
  alive = true
  update() { }
  show() { }
  destroy() {
    this.alive = false
  }
}
