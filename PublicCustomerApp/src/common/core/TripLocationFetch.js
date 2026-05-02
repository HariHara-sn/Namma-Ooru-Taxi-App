import { useLazyQuery, useQuery } from "@apollo/client";
import useUserStore from "../store/useUserStore";
import GetLocations from "./LocationGetGraphqlQuery";
import { useEffect } from "react";
import processData from "./DataProcessorDriver";

function TripLocationFetch({ startTime, endTime, tripId, setLoading, setError, onDataProcessed }) {
    const { userInfo } = useUserStore()

    const { data, loading, error } = useQuery(GetLocations(tripId, false, startTime, endTime), {
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

    // useEffect(() => {
    //     setLoading(loading);
    // }, [loading]);


    useEffect(() => {
        setError(error);
    }, [error]);

    return (
        <></>
    )
}

export default TripLocationFetch