class Scene {
    update() {
        // console.log(Object.keys(this))
        for (const group of Object.keys(this)) {
            this[group].forEach(obj => obj.update())
            this[group] = this[group].filter(o => o.alive)
            this[group].forEach(obj => obj.show())
        }
    }
}

class SceneObject {
    alive = true
    update() {

    }
    show () {

    }
    destroy() {
        this.alive = false
    }
}