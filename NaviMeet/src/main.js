import { initMap, setLocations, setDestination, findEfficientMergePoint, updateMapWithPlace, changeMeetingPoint, shareMeetingPoint } from './core/meetingPoint.js';


export { initMap, setLocations, setDestination, findEfficientMergePoint, updateMapWithPlace, changeMeetingPoint, shareMeetingPoint };


document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".remove-btn").forEach(button => {
        button.addEventListener("click", () => removeLocation(button.parentElement));
    });

    document.getElementById("addLocation").addEventListener("click", addLocation);
});

function addLocation() {
    const locationsDiv = document.getElementById("locations");
    const index = locationsDiv.children.length + 1;
    const locationInputDiv = document.createElement("div");
    locationInputDiv.classList.add("location-input");

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `Enter Location ${index}`;
    input.classList.add("location");

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "❌";
    removeBtn.classList.add("remove-btn");
    removeBtn.addEventListener("click", () => removeLocation(locationInputDiv));

    locationInputDiv.appendChild(input);
    locationInputDiv.appendChild(removeBtn);
    locationsDiv.appendChild(locationInputDiv);
}

function removeLocation(element) {
    const locationsDiv = document.getElementById("locations");
    if (locationsDiv.children.length > 2) locationsDiv.removeChild(element);
    else alert("At least two locations are required.");
}