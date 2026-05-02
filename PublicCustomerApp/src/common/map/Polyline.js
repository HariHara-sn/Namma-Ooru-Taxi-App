

class Polyline {

    constructor(id, name, coordinates, color = "#212121", width = "small") {
        this.id = id;
        this.name = name;
        this.coordinates = coordinates
        // color must be in hex code
        this.color = color
        this.width = width
        this.type = "polyline"
        this.focus = false
        this.padding = [0, 0, 0, 0]
        this.pattern = "default"
    }

    setColor(color){
        this.color = color
    }

    setFocus(focus) {
        this.focus = focus
    }

    setPadding(padding) {
        this.padding = padding
    }

    setPattern(pattern){
        this.pattern = pattern
    }

}

export default Polyline