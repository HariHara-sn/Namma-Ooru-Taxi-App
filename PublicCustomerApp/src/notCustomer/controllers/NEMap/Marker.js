
const markerTypes = ['driver', 'marker_start','location_pin', 'marker_end', 'marker_waypoint', 'car', 'default', "car_red", "car_yellow", "car_green"]
   

const markerSizes = [24, 36, 48, 64,75, 128]

class Marker {

    /**
     * Represents a marker on the map.
     * @param {string} id - The ID of the marker.
     * @param {string} name - The name of the marker.
     * @param {number} lng - The longitude of the marker.
     * @param {number} lat - The latitude of the marker.
     * @param {string} type - The type of the marker. Default is "default".
     * @param {number} size - The size of the marker. Default is 36.
     */
    constructor(id, name, lng, lat, type = "default", size = 36, selected=false, angle=0) {

        // if (!markerTypes.includes(type)) {
        //     throw new Error("Invalid marker type");
        // }
       

        if (!markerSizes.includes(size)) {
            throw new Error("Invalid marker size");
        }


        this.id = id;
        this.name = name;
        this.lng = lng;
        this.lat = lat;
        this.type = type;
        this.size = size;
        this.selected = selected;
        this.angle = angle
        this.focus = false
        this.animate = true
        this.animationTime = 1000
        this.showToolTip = false
        this.doRotation = true
        this.padding = [0,0,0,0]
    }

    setAnimationTime(time){
        this.animationTime = time
    }

    setFocus(focus){
        this.focus = focus
    }

    setSnippet(snippet){
        this.snippet = snippet
    }

    setTitle(title){
        this.title = title
    }

    setAngle(angle){
        this.angle = angle
    }

    setAnimate(animate){
        this.animate = animate
    }

    setAnimationTime(animationTime){
        this.animationTime = animationTime
    }

    setShowToolTip(showToolTip){
        this.showToolTip = showToolTip
    }

    setDoRotation(doRotation){
        this.doRotation = doRotation
    }

    setPadding(padding){
        this.padding = padding
    }

}

export default Marker