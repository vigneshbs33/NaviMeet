import { getDistance, buildMarkerContent, calculateDefaultMidpoint } from '../utils/mapUtils.js';
import { searchTransitNearby, calculateRoute } from '../services/mapServices.js';

let map;
let markers = [];
let polylines = [];
let locations = [];
let destination = null;
let currentPlaces = [];
let currentPlaceIndex = 0;
let currentBounds = null;
let isDrawingRoutes = false;

// Step 6 (continued): This function initializes the map when "Find Meeting Point" is clicked.
export function initMap() {
    try {
        map = new google.maps.Map(document.getElementById("map"), {
            center: { lat: 12.9716, lng: 77.5946 }, // Default: Bangalore
            zoom: 12,
        });
        return map;
    } catch (error) {
        console.error("Failed to initialize map:", error);
        throw error; // Let caller handle UI feedback
    }
}

export function setLocations(newLocations) {
    locations = newLocations.filter(loc => loc.lat && loc.lng && !isNaN(loc.lat) && !isNaN(loc.lng));
}

export function setDestination(newDestination) {
    destination = newDestination && newDestination.lat && newDestination.lng && !isNaN(newDestination.lat) && !isNaN(newDestination.lng)
        ? newDestination
        : null;
}

export function clearMarkers() {
    markers.forEach(m => m.setMap(null));
    markers = [];
}

export function clearRoutes() {
    polylines.forEach(line => line.setMap(null));
    polylines = [];
}

export async function findMergeZone(routes, dest) {
    if (!routes || !Array.isArray(routes) || routes.length === 0 || routes.some(route => !Array.isArray(route) || route.length === 0)) {
        console.error("Invalid routes in findMergeZone:", routes);
        throw new Error("Invalid routes provided to findMergeZone");
    }

    const routePoints = routes.map(route => 
        route.map(point => ({
            lat: typeof point.lat === "function" ? point.lat() : point.lat,
            lng: typeof point.lng === "function" ? point.lng() : point.lng
        }))
    );

    const potentialMergePoints = [];
    const indicesToCheck = routePoints.map(route => [
        Math.floor(route.length * 0.25),
        Math.floor(route.length * 0.75)
    ]);

    for (let i = 0; i < 2; i++) {
        const points = indicesToCheck.map((indices, routeIndex) => routePoints[routeIndex][indices[i]]);
        const avgPoint = {
            lat: points.reduce((sum, p) => sum + p.lat, 0) / points.length,
            lng: points.reduce((sum, p) => sum + p.lng, 0) / points.length
        };

        const distToDest = getDistance(avgPoint, dest);
        if (distToDest < 500) continue;

        potentialMergePoints.push(avgPoint);
    }

    if (potentialMergePoints.length === 0) {
        const midpoint = calculateDefaultMidpoint(locations);
        return [{ lat: midpoint.lat, lng: midpoint.lng, name: "Fallback Merge Point" }];
    }

    return potentialMergePoints.map((point, idx) => ({
        lat: point.lat,
        lng: point.lng,
        name: `Merge Point ${idx + 1}`
    }));
}

// Step 6 (continued): Called when "Efficient Mode" is selected; finds an optimal merge point.
// WARNING: This app uses Google Maps APIs (Maps JavaScript, Places, Directions), which may incur costs based on your API key usage. I, the developer, am not responsible for any charges, errors, or issues arising from API requests.
export async function findEfficientMergePoint() {
    if (locations.length < 2) {
        alert("Need at least two locations for Efficient Mode.");
        return;
    }

    // Validate locations upfront to avoid unnecessary API calls
    const validLocations = locations.filter(loc => {
        if (!loc.lat || !loc.lng || isNaN(loc.lat) || isNaN(loc.lng)) {
            console.warn(`Invalid location coordinates for ${loc.name}:`, loc);
            return false;
        }
        return true;
    });

    if (validLocations.length < 2) {
        alert("Need at least two valid locations for Efficient Mode.");
        return;
    }

    clearMarkers();
    clearRoutes();
    const bounds = new google.maps.LatLngBounds();

    // Add markers for all locations
    validLocations.forEach(loc => {
        const marker = new google.maps.Marker({
            map,
            position: { lat: loc.lat, lng: loc.lng },
            title: loc.name,
            icon: buildMarkerContent("blue"),
        });
        markers.push(marker);
        bounds.extend(marker.position);
    });

    // Add destination marker if it exists
    if (destination) {
        if (!destination.lat || !destination.lng || isNaN(destination.lat) || isNaN(destination.lng)) {
            console.error("Invalid destination coordinates:", destination);
            destination = null; // Reset invalid destination
        } else {
            const destMarker = new google.maps.Marker({
                position: destination,
                map,
                title: "Final Destination",
                icon: buildMarkerContent("red"),
            });
            markers.push(destMarker);
            bounds.extend(destMarker.position);
        }
    }

    // Calculate a weighted midpoint based on location density
    const midpoint = calculateDefaultMidpoint(validLocations);
    currentBounds = bounds;

    try {
        if (!destination) {
            // Without destination: Find a transit station near the midpoint
            const results = await searchTransitNearby(map, midpoint, "transit_station");
            currentPlaces = results.length > 0 ? results.map((r, i) => ({
                lat: r.lat,
                lng: r.lng,
                name: r.name || `Transit Hub ${i + 1}`
            })) : [{ lat: midpoint.lat, lng: midpoint.lng, name: "Central Point" }];
            currentPlaceIndex = 0;
            displayMeetingPoint(currentPlaces[0].lat, currentPlaces[0].lng, currentPlaces[0].name, bounds, 0);
            await drawRoutesToMergePointAndDestination([currentPlaces[0]]);
        } else {
            // With destination: Calculate routes and find merge points
            const routePromises = validLocations.map(async loc => {
                try {
                    const route = await calculateRoute(loc, destination);
                    if (!route || !route.routes || !route.routes[0] || !route.routes[0].overview_path || route.routes[0].overview_path.length === 0) {
                        throw new Error("Invalid route data");
                    }
                    return route;
                } catch (error) {
                    console.error(`Failed to calculate route for ${loc.name} to destination:`, error);
                    return null;
                }
            });

            const routes = (await Promise.all(routePromises)).filter(r => r !== null);

            if (routes.length < 2) {
                console.warn("Not enough valid routes; using weighted midpoint as fallback");
                currentPlaces = [{ lat: midpoint.lat, lng: midpoint.lng, name: "Fallback Merge Point" }];
                currentPlaceIndex = 0;
                displayMeetingPoint(currentPlaces[0].lat, currentPlaces[0].lng, currentPlaces[0].name, bounds, 0);
                await drawRoutesToMergePointAndDestination([currentPlaces[0]]);
            } else {
                const mergePoints = await findMergeZone(routes.map(r => r.routes[0].overview_path), destination);

                // Refine all merge points with transit stations for better practicality
                currentPlaces = await Promise.all(mergePoints.map(async (point, idx) => {
                    try {
                        const results = await searchTransitNearby(map, point, "transit_station");
                        return {
                            lat: results[0]?.lat || point.lat,
                            lng: results[0]?.lng || point.lng,
                            name: results[0]?.name || `Merge Point ${idx + 1}`
                        };
                    } catch (error) {
                        console.error(`Failed to refine merge point ${idx + 1} with transit station:`, error);
                        return { lat: point.lat, lng: point.lng, name: `Merge Point ${idx + 1}` };
                    }
                }));

                if (currentPlaces.length === 0 || !currentPlaces[0].lat || !currentPlaces[0].lng) {
                    console.error("No valid merge points found; using fallback");
                    currentPlaces = [{ lat: midpoint.lat, lng: midpoint.lng, name: "Fallback Merge Point" }];
                }

                currentPlaceIndex = 0;
                displayMeetingPoint(currentPlaces[0].lat, currentPlaces[0].lng, currentPlaces[0].name, bounds, 0);
                await drawRoutesToMergePointAndDestination([currentPlaces[0]]);
            }
        }
    } catch (error) {
        console.error("Efficient Mode error:", error);
        currentPlaces = [{ lat: midpoint.lat, lng: midpoint.lng, name: "Fallback Point" }];
        currentPlaceIndex = 0;
        displayMeetingPoint(midpoint.lat, midpoint.lng, "Fallback Point", bounds, 0);
        await drawRoutesToMergePointAndDestination([currentPlaces[0]]);
    }

    map.fitBounds(bounds);
}

export async function drawRoutesToMergePointAndDestination(mergePoints) {
    if (isDrawingRoutes) return;
    isDrawingRoutes = true;
    clearRoutes();

    const bounds = new google.maps.LatLngBounds();
    locations.forEach(loc => bounds.extend({ lat: loc.lat, lng: loc.lng }));
    if (destination) bounds.extend(destination);

    try {
        let currentPoints = [...locations];
        for (let i = 0; i < mergePoints.length; i++) {
            const mergePoint = mergePoints[i];
            bounds.extend(mergePoint);

            await Promise.all(currentPoints.map(async loc => {
                if (getDistance(loc, mergePoint) < 50) return;
                try {
                    const result = await calculateRoute(loc, mergePoint);
                    const renderer = new google.maps.DirectionsRenderer({
                        map,
                        suppressMarkers: true,
                        polylineOptions: { strokeColor: "#FFA500", strokeWeight: 4 },
                        directions: result,
                        routeIndex: 0,
                        draggable: false
                    });
                    polylines.push(renderer);
                    result.routes[0].overview_path.forEach(point => bounds.extend(point));
                } catch (error) {
                    console.error(`Failed to draw route from ${loc.name}:`, error);
                }
            }));

            currentPoints = [mergePoint];
            if (i < mergePoints.length - 1) {
                const nextMerge = mergePoints[i + 1];
                if (getDistance(mergePoint, nextMerge) >= 50) {
                    try {
                        const result = await calculateRoute(mergePoint, nextMerge);
                        const renderer = new google.maps.DirectionsRenderer({
                            map,
                            suppressMarkers: true,
                            polylineOptions: { strokeColor: "#FFA500", strokeWeight: 4 },
                            directions: result,
                            routeIndex: 0,
                            draggable: false
                        });
                        polylines.push(renderer);
                        result.routes[0].overview_path.forEach(point => bounds.extend(point));
                    } catch (error) {
                        console.error("Failed to draw route between merge points:", error);
                    }
                }
                currentPoints = [nextMerge];
            }
        }

        if (destination && getDistance(currentPoints[0], destination) >= 50) {
            try {
                const result = await calculateRoute(currentPoints[0], destination);
                const renderer = new google.maps.DirectionsRenderer({
                    map,
                    suppressMarkers: true,
                    polylineOptions: { strokeColor: "#00d4ff", strokeWeight: 4 },
                    directions: result,
                    routeIndex: 0,
                    draggable: false
                });
                polylines.push(renderer);
                result.routes[0].overview_path.forEach(point => bounds.extend(point));
            } catch (error) {
                console.error("Failed to draw route to destination:", error);
            }
        }
    } catch (error) {
        console.error("Route drawing error:", error);
    }

    isDrawingRoutes = false;
    map.fitBounds(bounds);
}

// Step 6 (continued): Called for non-efficient place types (e.g., restaurant, cafe).
// WARNING: This app uses Google Maps APIs (Maps JavaScript, Places, Directions), which may incur costs based on your API key usage. I, the developer, am not responsible for any charges, errors, or issues arising from API requests.
export async function updateMapWithPlace(placeType) {
    clearMarkers();
    clearRoutes();
    const bounds = new google.maps.LatLngBounds();

    locations.forEach(loc => {
        const marker = new google.maps.Marker({
            map,
            position: { lat: loc.lat, lng: loc.lng },
            title: loc.name,
            icon: buildMarkerContent("blue"),
        });
        markers.push(marker);
        bounds.extend(marker.position);
    });

    if (destination) {
        const destMarker = new google.maps.Marker({
            position: destination,
            map,
            title: "Final Destination",
            icon: buildMarkerContent("red"),
        });
        markers.push(destMarker);
        bounds.extend(destMarker.position);
    }

    const midpoint = calculateDefaultMidpoint(locations);
    currentBounds = bounds;

    const typeMap = {
        "restaurant": "restaurant",
        "cafe": "cafe",
        "shopping_mall": "shopping_mall",
        "park": "park",
        "popular_places": "point_of_interest",
        "transit_station": "transit_station"
    };
    const effectiveType = typeMap[placeType] || "transit_station";

    try {
        const results = await searchTransitNearby(map, midpoint, effectiveType);
        currentPlaces = results.length > 0 ? results.map((r, i) => ({
            lat: r.lat,
            lng: r.lng,
            name: r.name || `${placeType.replace("_", " ")} ${i + 1}`
        })) : [{ lat: midpoint.lat, lng: midpoint.lng, name: "Fallback Point" }];
        currentPlaceIndex = 0;
        displayMeetingPoint(currentPlaces[0].lat, currentPlaces[0].lng, currentPlaces[0].name, bounds, 0);
        await drawRoutesToMergePointAndDestination([currentPlaces[0]]);
    } catch (error) {
        console.error("Place search error:", error);
        currentPlaces = [{ lat: midpoint.lat, lng: midpoint.lng, name: "Fallback Point" }];
        currentPlaceIndex = 0;
        displayMeetingPoint(midpoint.lat, midpoint.lng, "Fallback Point", bounds, 0);
        await drawRoutesToMergePointAndDestination([currentPlaces[0]]);
    }

    map.fitBounds(bounds);
}

export function displayMeetingPoint(lat, lng, label, bounds, index) {
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        console.error("Invalid coordinates for meeting point:", { lat, lng, label });
        document.getElementById("meetingPoint").innerHTML = "Invalid meeting point coordinates.";
        return;
    }

    const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        title: label,
        icon: buildMarkerContent("green", destination ? `M${index + 1}` : null),
    });
    markers.push(marker);
    bounds.extend(marker.position);

    const placeType = document.getElementById("placeType").value;
    let html = placeType === "efficient" && destination
        ? `<strong>Merge Point:</strong> ${label}<br><strong>Coordinates:</strong> ${lat.toFixed(5)}, ${lng.toFixed(5)}<br><a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank">Open in Google Maps</a>`
        : `<strong>Meeting Point:</strong> ${label}<br><strong>Coordinates:</strong> ${lat.toFixed(5)}, ${lng.toFixed(5)}<br><a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank">Open in Google Maps</a>`;
    document.getElementById("meetingPoint").innerHTML = html;
    document.getElementById("changeMeetingPoint").style.display = currentPlaces.length > 1 ? "block" : "none";
    document.getElementById("shareMeetingPoint").style.display = "block";
}

// Step 7 (continued): Cycles through alternative meeting points when "Change Meeting Point" is clicked.
export async function changeMeetingPoint() {
    if (currentPlaces.length <= 1) return;

    currentPlaceIndex = (currentPlaceIndex + 1) % currentPlaces.length;
    let nextPlace = currentPlaces[currentPlaceIndex];

    if (nextPlace.name.startsWith("Merge Point")) {
        try {
            const results = await searchTransitNearby(map, nextPlace, "transit_station");
            nextPlace = {
                lat: results[0]?.lat || nextPlace.lat,
                lng: results[0]?.lng || nextPlace.lng,
                name: results[0]?.name || nextPlace.name
            };
            currentPlaces[currentPlaceIndex] = nextPlace;
        } catch (error) {
            console.error("Failed to refine merge point:", error);
        }
    }

    clearMarkers();
    locations.forEach(loc => {
        const marker = new google.maps.Marker({
            map,
            position: { lat: loc.lat, lng: loc.lng },
            title: loc.name,
            icon: buildMarkerContent("blue"),
        });
        markers.push(marker);
        currentBounds?.extend(marker.position);
    });
    if (destination) {
        const destMarker = new google.maps.Marker({
            position: destination,
            map,
            title: "Final Destination",
            icon: buildMarkerContent("red"),
        });
        markers.push(destMarker);
        currentBounds?.extend(destMarker.position);
    }
    clearRoutes();
    displayMeetingPoint(nextPlace.lat, nextPlace.lng, nextPlace.name, currentBounds || new google.maps.LatLngBounds(), currentPlaceIndex);
    await drawRoutesToMergePointAndDestination([nextPlace]);
    if (currentBounds) map.fitBounds(currentBounds);
}

// Step 8 (continued): Shares the meeting point details when "Share Meeting Point" is clicked.
export function shareMeetingPoint() {
    const placeType = document.getElementById("placeType").value;
    let shareText = placeType === "efficient" && destination
        ? `Merge Point: ${currentPlaces[currentPlaceIndex].name}\nCoordinates: ${currentPlaces[currentPlaceIndex].lat.toFixed(5)}, ${currentPlaces[currentPlaceIndex].lng.toFixed(5)}\nGoogle Maps: https://www.google.com/maps/search/?api=1&query=${currentPlaces[currentPlaceIndex].lat},${currentPlaces[currentPlaceIndex].lng}`
        : `Meeting Point: ${currentPlaces[currentPlaceIndex].name}\nCoordinates: ${currentPlaces[currentPlaceIndex].lat.toFixed(5)}, ${currentPlaces[currentPlaceIndex].lng.toFixed(5)}\nGoogle Maps: https://www.google.com/maps/search/?api=1&query=${currentPlaces[currentPlaceIndex].lat},${currentPlaces[currentPlaceIndex].lng}`;

    if (navigator.share) {
        navigator.share({
            title: 'NaviMeet Meeting Point',
            text: shareText,
        }).catch(err => fallbackShare(shareText));
    } else {
        fallbackShare(shareText);
    }
}

function fallbackShare(shareText) {
    navigator.clipboard.writeText(shareText).then(() => {
        alert("Meeting point details copied to clipboard!\n\n" + shareText);
    }).catch(() => alert("Please copy manually:\n\n" + shareText));
}