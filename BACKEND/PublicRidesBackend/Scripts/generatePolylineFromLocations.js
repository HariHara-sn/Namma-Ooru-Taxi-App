const polyline = require('@mapbox/polyline');

const locations = [

    [
        13.0845233,
        80.2502604
    ],
    [
        13.0863426,
        80.2504964
    ],
    [
        13.0877228,
        80.2507968
    ],
    [
        13.0901067,
        80.2512045
    ],
    [
        13.0901067,
        80.2512045
    ],
    [
        13.0914242,
        80.2510757
    ],
    [
        13.0941753,
        80.2510586
    ],
    [
        13.09635,
        80.2513161
    ]
]

const encodedLocations = polyline.encode(locations, 6);
console.log(encodedLocations);


