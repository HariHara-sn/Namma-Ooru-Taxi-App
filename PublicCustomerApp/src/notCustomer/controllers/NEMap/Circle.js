class Circle{

    constructor(id, name, lat, lng, radius, fillColor="#212121",strokeColor="#32a852",strokeWidth="small"){
        this.id = id;
        this.name = name;
        this.lat = lat
        this.lng = lng
        this.radius = radius
        // color must be in hex code
        this.fillColor = fillColor
        this.type = "circle"
        this.focus = false
        this.padding = [20,20,20,20]
        this.strokeColor = strokeColor
        this.strokeWidth = strokeWidth
    }

    setFocus(focus){
        this.focus = focus
        
    }
    setPadding(padding){
        this.padding = padding
    }

}

export default Circle