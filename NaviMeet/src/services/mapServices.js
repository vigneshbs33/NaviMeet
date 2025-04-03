const routeCache = new Map();

export async function calculateRoute(origin, destination) {
    const key = `${origin.lat},${origin.lng}-${destination.lat},${destination.lng}`;
    if (routeCache.has(key)) {
        return routeCache.get(key);
    }

    const directionsService = new google.maps.DirectionsService();
    const result = await new Promise((resolve, reject) => {
        directionsService.route({
            origin: new google.maps.LatLng(origin.lat, origin.lng),
            destination: new google.maps.LatLng(destination.lat, destination.lng),
            travelMode: google.maps.TravelMode.DRIVING,
        }, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                resolve(result);
            } else {
                reject(new Error(`Directions request failed: ${status}`));
            }
        });
    });

    routeCache.set(key, result);
    return result;
}

export async function searchTransitNearby(map, location, type) {
    const placesService = new google.maps.places.PlacesService(map);
    return new Promise((resolve, reject) => {
        placesService.nearbySearch({
            location: new google.maps.LatLng(location.lat, location.lng),
            radius: 2000,
            type: type,
        }, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                resolve(results.map(place => ({
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                    name: place.name,
                })));
            } else {
                reject(new Error(`Places search failed: ${status}`));
            }
        });
    });
}