import lz4 from 'lz4js';
import * as msgpack from '@msgpack/msgpack';
import { decode as atob } from 'base-64';
import LocationDataOutput from './LocationDataOutput';
import LocationDataOrder from './LocationDataOrder';
import Activities from './Activities';



export default function getRawGPSDataFromCombinedData(data, options) {
    let { compressed, raw } = data


    /* 
        Clone of container to store converted compressed data 
    */

    const compressedToRawTempStore = LocationDataOutput()

    /*
        This is the order in which compressed byte array will be received from the server
    */
    const locationOrder = LocationDataOrder

    if (!compressed && !raw) return []
    if (!compressed) compressed = []
    if (!raw) raw = []

    for (let i = 0; i < compressed.length; i++) {
        const session = compressed[i];
        const base64 = session.dataBase64  //BASE_64_TEST
        let splittedSession = null;
        if (base64) {
            splittedSession = base64.split("|")
        } else {
            splittedSession = session.data
        }
        if (!splittedSession) continue
        for (let j = 0; j < splittedSession.length; j++) {
            let dataBuffer = null;
            if (base64) {
                const base64Data = splittedSession[j]
                const binaryString = atob(base64Data);
                dataBuffer = new Uint8Array(binaryString.length);

                for (let i = 0; i < binaryString.length; i++) {
                    dataBuffer[i] = binaryString.charCodeAt(i);
                }
            } else {
                dataBuffer = splittedSession[j]
            }

            if (!dataBuffer) continue

            const decompressedSize = (dataBuffer[0]) | (dataBuffer[1] << 8) | (dataBuffer[2] << 16) | (dataBuffer[3] << 24);
            const src = dataBuffer.slice(4);

            /* Crate a byte array to store uncompressed data */
            const dst = new Uint8Array(decompressedSize);
            /* Decompress the data */
            lz4.decompressBlock(src, dst, 0, src.length, 0);
            /* Deserialize the data */
            const decodedOutput = msgpack.decode(dst);
            /* Store the data in the temp store */
            const type = locationOrder[j];
            if(!type) continue
            console.log(decodedOutput.length,"AJIN", type)
            compressedToRawTempStore[type] = compressedToRawTempStore[type].concat(decodedOutput);
        }
        /* Bor required later */
        if(compressedToRawTempStore.activities.length < compressedToRawTempStore.lats.length){
            compressedToRawTempStore.activities = new Array(compressedToRawTempStore.lats.length).fill(0);
        }
    }

    const compressedInRaw = []
    let prevTime = 0
    for (let i = 0; i < compressedToRawTempStore.lats.length; i++) {
        const lat = compressedToRawTempStore.lats[i];
        const lon = compressedToRawTempStore.lons[i];
        const time = compressedToRawTempStore.times[i]
        const speed = compressedToRawTempStore.speeds[i]
        const accuracy = compressedToRawTempStore.accuracies[i]
        const altitude = compressedToRawTempStore.altitudes[i]
        const altitude_accuracy = compressedToRawTempStore.altitude_accuracies[i]
        const heading = compressedToRawTempStore.headings[i]
        const battery = compressedToRawTempStore.batteries[i]
        const engineState = compressedToRawTempStore.engineStates[i]
        const activity = compressedToRawTempStore.activities[i]
        prevTime = time
        if (time < options?.range?.start) {
            continue
        }
        if (time > options?.range?.end) {
            continue
        }
        const location = {
            latitude: lat,
            longitude: lon,
            time: time,
            speed: speed,
            accuracy: accuracy,
            altitude: altitude,
            altitude_accuracy: altitude_accuracy,
            heading: heading,
            battery: battery,
            engineOn: engineState,
            activity: Activities.find(ac => ac.type === activity)?.values[0]
        }
        compressedInRaw.push(
            location
        )
        // console.log(compressedToRawTempStore.activities.length, compressedToRawTempStore.lats.length,i)

    }

    /* Sorting Based on Time */

    // compressedInRaw.sort((a, b) => a.time - b.time);
    if (options.range) {
        raw = raw.filter(data => {
            const dataTime = parseInt(data.time);
            const startTime = parseInt(options?.range?.start);
            const endTime = parseInt(options?.range?.end);
            return dataTime >= startTime && dataTime <= endTime;
        });
    }
    raw = [...compressedInRaw, ...raw];
    raw = raw.sort((a, b) => a.time - b.time);
    /* Delete unwanted memory */
    delete compressedToRawTempStore.lats
    delete compressedToRawTempStore.lons
    delete compressedToRawTempStore.times
    delete compressedToRawTempStore.speeds
    delete compressedToRawTempStore.accuracies
    delete compressedToRawTempStore.altitudes
    delete compressedToRawTempStore.altitude_accuracies
    delete compressedToRawTempStore.headings
    delete compressedToRawTempStore.batteries

    return raw

}