
const markerTypes = [
    'default', "car_red", "car_yellow", "car_green", "people_common", "circle_red", 
    "circle_yellow", "circle_green", "circle_selected_red", "circle_selected_yellow", "circle_selected_green",
    'marker_start', 'marker_end', 'waypoint'
]
const markerSizes = [24, 36, 48, 64]

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
    constructor(id, name, lng, lat, type = "default", size = 36, selected=false) {

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
        this.angle = 0
        this.focus = false
        this.animate = true
        this.animationTime = 8000
        this.showToolTip = false
        this.doRotation = true
        this.padding = [0,0,0,0]
        this.title = ""
        this.snippet = ""
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