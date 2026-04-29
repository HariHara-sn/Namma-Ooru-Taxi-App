const Controller = require('../Controller')
const Passanger = require('../../Models/Passanger')
const Driver = require('../../Models/Driver')
const Trip = require('../../Models/Trip')
const RideStatus = require('../../Core/PublicRides/RideStatus')
const SOS = require('../../Models/Sos')
const SOSEvents = require('../../Core/PublicRides/SOSEvents')
const EmergencyContacts = require('../../Models/EmergencyContacts')
const SendSMS = require('../../Core/SMSService/SendSMS')

class SOSController extends Controller {
    constructor() {
        super()
    }
    SosTriggered = async (req, res) => {
        try {
            const { tripId, location } = req.body
            const authPassengerId = req.passanger?.id

            if (!tripId) return res.status(400).json({ success: false, message: 'tripId is required' })
            if (!authPassengerId) return res.status(401).json({ success: false, message: 'Unauthorized' })

            const trip = await Trip.getTripById(tripId)
            if (!trip) return res.status(400).json({ success: false, message: 'Trip not found' })

            const passanger = await Passanger.getPassangerWithId(authPassengerId)
            if(!passanger) return res.status(400).json({ success: false, message: 'Passanger not found' })

            const tripPassengerId = trip?.passangerId?.toString?.()
            if (tripPassengerId && tripPassengerId !== authPassengerId) {
                return res.status(403).json({ success: false, message: 'Passenger not part of this trip' })
            }

            if(trip.status !== RideStatus.PICKEDUP) return res.status(400).json({ success: false, message: 'Trip is not ongoing' })
            const result = await SOS.addSOS(tripId, authPassengerId, 'passanger', trip.regionalOffice, trip.regionCode)
            if(!result) return res.status(400).json({ success: false, message: 'Failed to add SOS' })

            // If location [lon, lat] provided, append as first tracking point
            if (Array.isArray(location) && location.length >= 2) {
                const initialPoint = { latitude: location[1], longitude: location[0], time: new Date().getTime() }
                try { await SOS.addTrackingData(String(result.insertedId), initialPoint, authPassengerId) } catch (_) { /* no-op */ }
            }

            if(authPassengerId) {
                const emergencyContacts = await EmergencyContacts.getForPassenger(authPassengerId, 'pr_passanger')
                
                if(emergencyContacts) {
                    const emergencyContactsArray = emergencyContacts.contacts || []
                    console.log('emergencyContactsArray', emergencyContactsArray)
                    for(const contact of emergencyContactsArray) {
                        const url = `${process.env.SOS_TRACKING_URL}?eventId=${result.insertedId}`
                        
                        const response = await SendSMS.sendMessage(contact.phone, passanger.name, 'Namma Ooru Taxi', url)
                        console.log('response', response)
                    }
                }
            }

            return res.status(200).json({ 
                success: true, 
                message: result.alreadyExists ? 'SOS already exists' : 'SOS triggered successfully',
                sosEventId: result.insertedId,
                alreadyExists: !!result.alreadyExists
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    updateSosTrackingData = async (req, res) => {
        try {
            const passangerId = req.passanger?.id
            const { eventId, points } = req.body
            if (!passangerId) return res.status(401).json({ success: false, message: 'Unauthorized' })
            if (!eventId) return res.status(400).json({ success: false, message: 'eventId is required' })
            if (!points || (Array.isArray(points) && points.length === 0)) {
                return res.status(400).json({ success: false, message: 'points required: {latitude, longitude, time} or array' })
            }

            const normalized = (Array.isArray(points) ? points : [points]).map(p => ({
                latitude: p.latitude,
                longitude: p.longitude,
                time: p.time
            }))

            const result = await SOS.addTrackingData(eventId, normalized, passangerId)
            if (result?.invalidId) return res.status(400).json({ success: false, message: 'Invalid eventId' })
            if (!result?.acknowledged) return res.status(400).json({ success: false, message: 'Failed to update tracking data' })
            return res.status(200).json({ success: true, message: 'Tracking data updated' })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    getSosTrackingData = async (req, res) => {
        try {
            
            const { eventId } = req.query
          
            if (!eventId) return res.status(400).json({ success: false, message: 'eventId is required' })

            const data = await SOS.getTrackingData(eventId)
            if (!data) return res.status(404).json({ success: false, message: 'SOS event not found' })
            return res.status(200).json({ success: true, trackingData: data.trackingData || [], status: data.status })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    getSosEventDetails = async (req, res) => {
        try {
            
            const { eventId } = req.query
           
            if (!eventId) return res.status(400).json({ success: false, message: 'eventId is required' })

            const sosEvent = await SOS.getEventById(eventId)
            if (!sosEvent) return res.status(404).json({ success: false, message: 'SOS event not found' })
           

            // Trip with passenger details if available
            const tripWithPassengerArr = await Trip.getTripWithPassangerDetails(sosEvent.tripId)
            const tripBase = tripWithPassengerArr?.[0] || await Trip.getTripById(sosEvent.tripId)

            // Driver details (includes ownVehicleInfo)
            let driver = null
            if (tripBase?.driverId) {
                try { driver = await Driver.getDriverWithId(tripBase.driverId) } catch (_) { /* ignore */ }
            }

            // Passenger details (from join or fallback)
            let passengerDetails = tripBase?.passangerDetails
            if (!passengerDetails && tripBase?.passangerId) {
                try { passengerDetails = await Passanger.getPassangerWithId(tripBase.passangerId) } catch (_) { /* ignore */ }
            }

            // Compute duration
            const duration = tripBase?.finalDuration || (tripBase?.startTime && tripBase?.endTime ? (tripBase.endTime - tripBase.startTime) : null)

            return res.status(200).json({
                success: true,
                sosEvent: {
                    _id: sosEvent._id,
                    status: sosEvent.status,
                    createdAt: sosEvent.createdAt,
                    updatedOn: sosEvent.updatedOn,
                    trackingData: sosEvent.trackingData || [],
                    regionOfficeId: sosEvent.regionOfficeId,
                    regionCode: sosEvent.regionCode,
                },
                trip: {
                    _id: tripBase?._id,
                    status: tripBase?.status,
                    startTime: tripBase?.startTime,
                    endTime: tripBase?.endTime,
                    duration,
                    finalDistance: tripBase?.finalDistance,
                    driverWaitTime: tripBase?.driverWaitTime,
                    routeType: tripBase?.routeType,
                    startLocation: tripBase?.startLocation,
                    endLocation: tripBase?.endLocation,
                    stops: tripBase?.stops || [],
                    passangerDetails: passengerDetails ? {
                        _id: passengerDetails._id,
                        name: passengerDetails.name,
                        phone: passengerDetails.phone,
                        email: passengerDetails.email,
                        gender: passengerDetails.gender
                    } : null
                },
                driver: driver ? {
                    _id: driver._id,
                    name: driver.name,
                    phone: driver.phone,
                    email: driver.email,
                    location: driver.location,
                    liveStats: driver.liveStats,
                    ownVehicleInfo: driver.ownVehicleInfo || null
                } : null
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    stopSosTracking = async (req, res) => {
        try {
            const passangerId = req.passanger?.id
            const { eventId, reason, status } = req.body
            if (!passangerId) return res.status(401).json({ success: false, message: 'Unauthorized' })
            if (!eventId) return res.status(400).json({ success: false, message: 'eventId is required' })

            const finalStatus = status && [ 'resolved', 'rejected' ].includes(String(status).toLowerCase())
                ? String(status).toLowerCase()
                : SOSEvents.RESOLVED

            const result = await SOS.stopTracking(eventId, passangerId, reason, finalStatus)
            if (result?.invalidId) return res.status(400).json({ success: false, message: 'Invalid eventId' })
            if (!result?.acknowledged) return res.status(400).json({ success: false, message: 'Failed to stop tracking' })
            return res.status(200).json({ success: true, message: `SOS ${finalStatus}`, status: finalStatus })
        } catch (error) {
            this.handleError(error, res)
        }
    }
}
module.exports = SOSController