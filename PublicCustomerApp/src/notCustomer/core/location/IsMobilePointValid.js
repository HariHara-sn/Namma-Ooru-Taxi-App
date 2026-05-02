import { utils } from "../../utils/Utils";
import findDistance from "./FindDistance";

export default function (currentLoc, PrevLoc) {
    const distance = findDistance(currentLoc, PrevLoc);

    const timeDiffBetweenTwoPoints = currentLoc.time - PrevLoc.time
    const speed = distance / (timeDiffBetweenTwoPoints / 3600000);

    const currentActivity = currentLoc.activity

    if (currentActivity === "STILL" && (distance > 0.2 || speed > 10)) {
        return [false, speed, distance]
    }
    if ((currentActivity === "RUNNING" || currentActivity === "WALKING" || currentActivity === "UNKNOWN") && speed > 25) {
        return [false, speed, distance]
    }
    if ((speed > currentLoc.speed * 3)) {
        return [false, speed, distance]
    }
    const isValid = speed < 180
    if (distance > 0.1) {
        console.log(distance, speed, currentLoc.speed, utils.getReadableTimeFromMs(currentLoc.time), currentLoc.accuracy,PrevLoc.accuracy)
    }
    return [isValid, speed, distance]

}