import { gql } from '@apollo/client';


const GetLocations = (deviceId, deviceImei, startTime, endTime) => {
  let variableQuery = ""

  if (deviceImei) {
    variableQuery = `deviceId: "${deviceId}", deviceImei: "${deviceImei}", startTime: ${startTime}, endTime: ${endTime}`
  } else {
    variableQuery = `deviceId: "${deviceId}", startTime: ${startTime}, endTime: ${endTime}`
  }
  return gql`
      query GETLOCATIONS {
        getRecentLocations(${variableQuery}) {
            raw {
                time
                latitude
                longitude
                speed
                engineOn,
                heading,
                activity,
                accuracy
            }
            compressed{
              dataBase64
              sessionId
            }
          }
      }
  `
}


export default GetLocations

