// Calculate the distance between two points using the Haversine formula
export function getDistance(point1, point2) {
    const R = 6371e3; // Earth's radius in meters
    const lat1 = Number(point1.lat) * (Math.PI / 180);
    const lat2 = Number(point2.lat) * (Math.PI / 180);
    const deltaLat = (Number(point2.lat) - Number(point1.lat)) * (Math.PI / 180);
    const deltaLng = (Number(point2.lng) - Number(point1.lng)) * (Math.PI / 180);

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Build a custom marker icon with a specified color and optional label
// Usage: Use in NaviMeet to create markers (e.g., blue for locations, red for destination, green for meeting points).
export function buildMarkerContent(color, label = null) {
    let pinSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 26 34">
            <path fill="${color}" d="M13 0C5.8 0 0 5.8 0 13c0 9.3 13 21 13 21s13-11.7 13-21C26 5.8 20.2 0 13 0zm0 18c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z"/>
        </svg>
    `;

    if (label) {
        pinSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 26 34">
                <path fill="${color}" d="M13 0C5.8 0 0 5.8 0 13c0 9.3 13 21 13 21s13-11.7 13-21C26 5.8 20.2 0 13 0zm0 18c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z"/>
                <text x="13" y="12" font-size="10" font-weight="bold" fill="white" text-anchor="middle" dy=".3em">${label}</text>
            </svg>
        `;
    }

    const svgBlob = new Blob([pinSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    return {
        url: url,
        scaledSize: new google.maps.Size(26, 34),
        labelOrigin: label ? new google.maps.Point(13, 10) : null
    };
}

// Calculate the default midpoint of a list of locations
export function calculateDefaultMidpoint(locations) {
    const midpoint = {
        lat: locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length,
        lng: locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length
    };
    console.log("Calculated midpoint:", midpoint);
    return midpoint;
}