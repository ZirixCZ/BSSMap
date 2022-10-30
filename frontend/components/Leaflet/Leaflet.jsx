import React, {useEffect, useState} from "react";
import {ExpoLeaflet} from "expo-leaflet";
import * as Location from 'expo-location';
import {View} from "react-native";
import celltowers from "../../db/celltowers.json";
import Navbar from "../Navbar/Navbar";

const Leaflet = () => {

    const [provider, setProvider] = useState(null);
    const [mapMarkers, setMapMarkers] = useState(null);
    const [userCurrentLocation, setUserCurrentLocation] = useState({
        coords: {
            latitude: 50,
            longitude: 15
        }
    });

    const [locationNotGranted, setLocationNotGranted] = useState(null);

    useEffect(() => {

        const getCurrentPosition = async () => {
            let {status} = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLocationNotGranted('Permission to access location was denied');
                return;
            }

            return Location.getCurrentPositionAsync({});
        }
        getCurrentPosition().then((location) => setUserCurrentLocation(location))

    }, []);

    const mapLayers = [
        {
            attribution: '&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
            baseLayerIsChecked: true,
            baseLayerName: "OpenStreetMap.Mapnik",
            url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        },
    ]

    // Does a binary search of the celltower array
    function biSearch(array, condition, start = 0, end = array.length - 1, ...funcParameters) {
        let mid = Math.floor((start + end) / 2);
        // condition should return 0 if condition is true 1 if the mid is bigger -1 if the mid is smaller
        switch (condition(array[mid].lat, ...funcParameters)) {
            case 0:
                return mid;
            case 1:
                return biSearch(array, condition, start, mid + 1);
            case -1:
                return biSearch(array, condition, mid - 1, end);
        }
        throw Error("condition output is not -1, 0 or 1!!!");
    }
    // Slices array so that only the towers within the lat offset are left
    function linearSearchSubArray(array, index, offset){
        let result = [];
        // looks at smaller indexes if they still count
        let temp = index;
        while (result.length === 0) {
            temp--;
            if (array[temp].lat < userCurrentLocation.coords.latitude - offset) result.push(temp + 1);
            if (array[temp] === undefined) throw Error("Index out of range of array");
        }
        // looks at bigger indexes if they still count
        temp = index;
        while (result.length === 1) {
            temp++;
            if (array[temp].lat > userCurrentLocation.coords.latitude + offset) result.push(temp - 1);
            if (array[temp] === undefined) throw Error("Index out of range of array");
        }
        return array.slice(...result);
    }
    // makes an array of towers with chosen operator
    let celltowersOperator = Array.from(celltowers).filter((tower) =>
        tower.operators.includes(provider === 1 ? "o2" : provider === 2 ? "tmobile" : provider === 3 ? "vodafone" : provider === 4 ? "poda" : null)
    );
    // searches the array to ectract only the ones near the user
    let celltowersNearBy = []
    if (celltowersOperator.length > 0) {
        let location = biSearch(
            celltowersOperator,
            (lat, offset) => {
                // returns 1 if the towers lat is bigger then users position + offset, -1 when smaller and 0 if its within
                return lat > userCurrentLocation.coords.latitude + offset ? 1 : lat < userCurrentLocation.coords.latitude - offset ? -1 : 0;
            },
            0,
            celltowersOperator.length - 1,
            0.1
        );

        celltowersNearBy = linearSearchSubArray(celltowersOperator, location, 0.1).filter((tower) => {return userCurrentLocation.coords.longitude + 0.1 > tower.lng && userCurrentLocation.coords.longitude - 0.1 < tower.lng; });
    }


    useEffect(() => {
        setMapMarkers(
            celltowersNearBy.map((tower) => {
                return {
                    position: {
                        lat: tower.lat,
                        lng: tower.lng,
                    },
                    icon: "<span>📡</span>",
                    size: [32, 32],
                };
            })
        );
    }, [provider])

    return (
        <View style={{backgroundColor: "black", flex: 1}}>
            <View style={{height: "12%"}}>
                <Navbar func={(provider => setProvider(provider))}/>
            </View>
            <ExpoLeaflet
                backgroundColor={"white"}
                onMessage={(message) => ""}
                mapLayers={mapLayers}
                mapMarkers={mapMarkers}
                mapCenterPosition={{
                    lat: userCurrentLocation.coords.latitude,
                    lng: userCurrentLocation.coords.longitude,
                }}
                zoom={10}
            />
        </View>
    )

}

export default Leaflet;
