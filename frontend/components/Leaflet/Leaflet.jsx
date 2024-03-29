import React, {useEffect, useState} from "react";
import {ExpoLeaflet} from "expo-leaflet";
import * as Location from "expo-location";
import {View} from "react-native";
import celltowers from "../../db/celltowers.json";
import Navbar from "../Navbar/Navbar";

const Leaflet = ({navigation, route, props}) => {
    const [mapMarkers, setMapMarkers] = useState(null);
    const [userLoc, setuserLoc] = useState({
        position: {
            lat: 49.88865,
            lng: 15.41015,
        },
    });
    const [celltowersInRange, setCelltowersInRange] = useState(null);
    const [locationLoaded, setLocationLoaded] = useState(false);
    const [locationNotGranted, setLocationNotGranted] = useState(null);
    const [closestMarker, setClosestMarker] = useState({
        position: {
            lat: null,
            lng: null,
        },
    });

    useEffect(() => {
        console.log(props)
    }, [props]);

    // gets user location
    useEffect(() => {
        const getCurrentPosition = async () => {
            let {status} = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                setLocationNotGranted("Permission to access location was denied");
                return;
            }

            return Location.getCurrentPositionAsync({});
        };

        getCurrentPosition().then((location) => {
            setuserLoc({
                position: {
                    lat: location.coords.latitude,
                    lng: location.coords.longitude,
                },
            });
            setLocationLoaded(true);
        });
    }, []);

    // loads map
    const mapLayers = [
        {
            attribution: '&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
            baseLayerIsChecked: true,
            baseLayerName: "OpenStreetMap.Mapnik",
            url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        },
    ];

    // makes a list of CTs using the current provider and distance
    useEffect(() => {
        if (locationLoaded) {
            setCelltowersInRange(
                Array.from(celltowers)
                    .filter((tower) =>
                        tower.operators.includes(
                            route.params.provider === 1
                                ? "o2"
                                : route.params.provider === 2
                                    ? "tmobile"
                                    : route.params.provider === 3
                                        ? "vodafone"
                                        : route.params.provider === 4
                                            ? "poda"
                                            : null
                        )
                    )
                    .filter(
                        (tower) =>
                            userLoc.position.lng + 0.16 > tower.lng &&
                            userLoc.position.lng - 0.16 < tower.lng &&
                            userLoc.position.lat + 0.1 > tower.lat &&
                            userLoc.position.lat - 0.1 < tower.lat
                    )
            );
        }
    }, [route.params.provider, locationLoaded]);

    // displays the CT list
    useEffect(() => {
        if (celltowersInRange === null || celltowersInRange === undefined || celltowersInRange[0] === undefined) {
            setMapMarkers([]);
            return;
        }

        setMapMarkers(
            celltowersInRange.map((tower) => {
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
    }, [celltowersInRange]);
    
    // figures out closest CT and removes its icon (a new icon is displayed later)
    useEffect(() => {
        if (mapMarkers === null || mapMarkers === undefined || mapMarkers[0] === undefined) {
            setClosestMarker({
                position: {
                    lat: null,
                    lng: null,
                },
            });
            return;
        }

        // console.log("");
        // console.log("");
        // console.log("---Start of new search---");
        // console.log(mapMarkers[0], userLoc);

        let tempClosestMarker = {
            position: {
                lat: mapMarkers[0].position.lat,
                lng: mapMarkers[0].position.lng,
            },
        };

        mapMarkers.forEach((marker, index) => {
            let currentDist = [Math.abs(userLoc.position.lat - marker.position.lat), Math.abs(userLoc.position.lng - marker.position.lng)];

            let closestDist = [
                Math.abs(userLoc.position.lat - tempClosestMarker.position.lat),
                Math.abs(userLoc.position.lng - tempClosestMarker.position.lng),
            ];

            // console.log("/// NEW CYCLE ///");
            // console.log("Current cycled marker's distance from the user:", currentDist, Math.sqrt(currentDist[0]**2 + currentDist[1]**2));
            // console.log("Closest marker's distance from the user:", closestDist, Math.sqrt(closestDist[0]**2 + closestDist[1]**2));

            if (Math.sqrt(currentDist[0] ** 2 + currentDist[1] ** 2) < Math.sqrt(closestDist[0] ** 2 + closestDist[1] ** 2)) {
                // console.log("|||CHANGED CLOSEST CELLTOWER|||");
                tempClosestMarker = {
                    position: {
                        lat: marker.position.lat,
                        lng: marker.position.lng,
                    },
                    index: index,
                };
            }
        });

        setClosestMarker({
            position: {
                lat: tempClosestMarker.position.lat,
                lng: tempClosestMarker.position.lng,
            },
        });
        mapMarkers.splice(tempClosestMarker.index, 1);
    }, [mapMarkers, userLoc]);

    return (
        <View style={{backgroundColor: "black", flex: 1}}>
            <ExpoLeaflet
                backgroundColor={"white"}
                onMessage={(message) => ""}
                mapLayers={mapLayers}
                // logic for displaying CTs and user location (adds icon for the closest CT)
                mapMarkers={
                    Array.isArray(mapMarkers) && mapMarkers.length > 0
                        ? mapMarkers
                            .concat({
                                position: {
                                    lat: closestMarker.position.lat,
                                    lng: closestMarker.position.lng,
                                },
                                icon: "<span>🦄</span>",
                                size: [32, 32],
                            })
                            .concat({
                                position: {
                                    lat: userLoc.position.lat,
                                    lng: userLoc.position.lng,
                                },
                                icon: "<span>📍</span>",
                                size: [32, 32],
                            })
                        : locationLoaded
                            ? [
                                {
                                    position: {
                                        lat: userLoc.position.lat,
                                        lng: userLoc.position.lng,
                                    },
                                    icon: "<span>📍</span>",
                                    size: [32, 32],
                                },
                            ]
                            : []
                }
                mapCenterPosition={{
                    lat: userLoc.position.lat,
                    lng: userLoc.position.lng,
                }}
                zoom={locationLoaded ? 15 : 6}
            />
            <View>
                <Navbar provider={route.params.provider}/>
            </View>
        </View>
    );
};

export default Leaflet;
