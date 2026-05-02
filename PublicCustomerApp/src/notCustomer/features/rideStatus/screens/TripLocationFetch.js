import { useLazyQuery, useQuery } from "@apollo/client";
import { useContext, useEffect } from "react";
// import GlobalContext from "../../../Context/GlobalContext";
import LocationGetGraphqlQuery from '../../../core/location/LocationGetGraphqlQuery'
import GlobalContext from "../../Context/GlobalContext";
import processData from "../../../core/location/DataProcessor";

function TripLocationFetch({ startTime, endTime, tripId, setLoading, setError, onDataProcessed }) {
    const { userInfo } = useContext(GlobalContext)
    console.log("fetching Trip Duration Distance data", startTime, endTime)

    const { data, loading, error } = useQuery(LocationGetGraphqlQuery(tripId, false, startTime, endTime), {
        context: {
            headers: {
                authorization: ("Bearer " + userInfo?.token) || "",
            },
        },
        cacheTime:  5000 //180000, // 3 minutes in milliseconds
    });


    useEffect(() => {
        if (!data) return
        const startTimeMeasure = new Date();
        let processedData;
        processedData = processData({ data: data.getRecentLocations, options: { range: { start: startTime, end: endTime }, mergeLngLats: true } });
        const endTimeMeasure = new Date();
        const executionTime = endTimeMeasure - startTimeMeasure;
        onDataProcessed?.(processedData)
    }, [data, startTime, endTime])


    useEffect(() => {
        setLoading(loading);
    }, [loading]);

    useEffect(() => {
        setError(error);
    }, [error]);

    return (
        <></>
    )
}

export default TripLocationFetch