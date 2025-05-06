import { buildings, food, parking, resources, shorthandInputs, buildingNames, permit_names } from './data.js';
import { umbc_polygons } from './polygons.js';

// Define the geographical bounds for UMBC's campus
var umbcBounds = [
    [39.2500, -76.7150], // Southwest corner
    [39.2600, -76.7050]  // Northeast corner
];

// initialize the map centered on UMBC
var map = L.map('map', {
    maxBounds: umbcBounds, // Set the max bounds
    maxBoundsViscosity: 1.0 // Ensures the map bounces back when dragged out of bounds
}).setView([39.2557, -76.7110], 16.5); // Zoom level adjusted for campus view

var selectedParkStart = "";
var selectedParkEnd = "";

var sel_destination_flag = 0;
var sel_start_flag = 0;

let activeMarkers = [];


// add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 22
}).addTo(map);

const pawPrintIcon = L.icon({
    iconUrl: 'assets/pawprint.png', // Replace with the actual path to your pawprint image
    iconSize: [32, 32], // Size of the icon
    iconAnchor: [16, 16], // Anchor point of the icon
    popupAnchor: [0, -16] // Offset the popup
});


// Add invisible clickable building areas
function addClickableBuildings() {
    // Define building information with polygon coordinates and details

    // Create invisible polygons for each building
    for (const [key, building] of Object.entries(umbc_polygons)) {
        if (!(key in buildings)) {
            console.warn(`Key "${key}" missing in buildings`);
        }
        // Create invisible polygon
        const correctedCoords = building.map(coord => [coord[1], coord[0]]);

        const polygon = L.polygon(correctedCoords, {
            color: 'transparent',       // Invisible border
            fillColor: 'transparent',   // Invisible fill
            fillOpacity: 0,             // Completely transparent
            weight: 0                   // No border
        }).addTo(map);
        
        // Change cursor to pointer when hovering over building
        polygon.on('mouseover', function() {
            this.setStyle({
                fillOpacity: 0.5,       // Slight highlight on hover
                //fillColor: '#FDB515'    // UMBC gold
                fillColor: '#007176' // UMBC AOK Teal
            });
            document.getElementById('map').style.cursor = 'pointer';
        });
        
        // Remove highlight when mouse leaves
        polygon.on('mouseout', function() {
            this.setStyle({
                fillOpacity: 0,
                fillColor: 'transparent'
            });
            document.getElementById('map').style.cursor = '';
        });
        
        // Create popup content with HTML formatting
        if ("info" in buildings[key]){
            const popupContent = `
                <div class="building-popup">
                    <h3>${buildings[key].info.name}</h3>
                    <p>${buildings[key].info.description}</p>
                    <p><strong>Hours:</strong><br>${buildings[key].info.hours}</p>
                    <p><strong>Facilities:</strong></p>
                    <ul>
                        ${buildings[key].info.facilities.map(facility => `<li>${facility}</li>`).join('')}
                    </ul>
                </div>
            `;
            
            
            // Bind popup to polygon
            polygon.bindPopup(popupContent, {
                maxWidth: 300,
                className: 'building-info-popup'
            });
        }
    }
}

// Call the function to add clickable buildings
addClickableBuildings();


//function to handle search
document.getElementById('search-place').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form submission from reloading page

    let searchQuery = document.getElementById('search-input').value.trim().toLowerCase();

    console.log(searchQuery);
        
    if (shorthandInputs[searchQuery]) {
        buildingName = shorthandInputs[searchQuery];
        map.flyTo(buildings[buildingName].coordinates, 19); // Zoom in and move to location

        // Create popup content with HTML formatting
        if ("info" in buildings[buildingName]){
            const popupContent = `
                <div class="building-popup">
                    <h3>${buildings[buildingName].info.name}</h3>
                    <p>${buildings[buildingName].info.description}</p>
                    <p><strong>Hours:</strong><br>${buildings[buildingName].info.hours}</p>
                    <p><strong>Facilities:</strong></p>
                    <ul>
                        ${buildings[buildingName].info.facilities.map(facility => `<li>${facility}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
    } else {
        alert("Location not found!");
    }
});

// Add autocomplete functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const autocompleteContainer = document.createElement('div');
    autocompleteContainer.className = 'autocomplete-items';
    searchInput.parentNode.appendChild(autocompleteContainer);
    
    // Get all location keys for autocomplete
    const locationKeys = Object.keys(shorthandInputs);
    
    // Show suggestions as user types
    searchInput.addEventListener('input', function() {
        
        const value = this.value.toLowerCase().trim();
        
        // Clear previous suggestions
        autocompleteContainer.innerHTML = '';
        
        if (!value) return false;
        
        // Filter matching locations
        const matches = locationKeys.filter(key => 
            key.toLowerCase().includes(value)
        );
        
        // Show only top 5 matches to avoid overwhelming the UI
        matches.slice(0, 5).forEach(match => {
            console.log(match);
            const item = document.createElement('div');
            item.innerHTML = shorthandInputs[match];
            item.addEventListener('click', function() {
                searchInput.value = match;
                autocompleteContainer.innerHTML = '';
                // Move map to selected location
                map.flyTo(buildings[shorthandInputs[match]].coordinates, 19);
            });
            autocompleteContainer.appendChild(item);
        });
    });
    
    // Hide suggestions when clicking elsewhere
    document.addEventListener('click', function(e) {
        if (e.target !== searchInput) {
            autocompleteContainer.innerHTML = '';
        }
    });
});

document.addEventListener("DOMContentLoaded", function() {
    // Select all dropdowns
    const dropdowns = document.querySelectorAll('.dropdown');

    // Add click event to each dropdown
    dropdowns.forEach(dropdown => {
        dropdown.querySelector('button').addEventListener('click', function() {
            // Toggle the active class to show/hide the dropdown content
            dropdown.classList.toggle('active');
        });
    });
});

// ------------- Filtering --------------

function updateMarkers() {
    // Clear old markers
    activeMarkers.forEach(m => map.removeLayer(m));
    activeMarkers = [];

    const checkedPermits = Array.from(document.querySelectorAll('#permit-filters input:checked'))
        .map(cb => cb.value);

    for (const lot of Object.values(parking)) {
        const matchingPermits = lot.permit.filter(p => checkedPermits.includes(p));

        matchingPermits.forEach((permit, index) => {
            const icon = L.divIcon({
                className: '',
                html: `<div class="permit-marker" style="background-color: ${getColor(permit)};">${permit}</div>`,
                iconSize: [25, 25],
                iconAnchor: [12, 12]
            });
            
            const offset = getOffset(index); // use index to space out markers
            const offsetCoords = [
                lot.coordinates[0] + offset[0],
                lot.coordinates[1] + offset[1]
            ];

            const all_permit_names = [];
            for (let i = 0; i < lot.permit.length; i++) {
                all_permit_names.push(permit_names[lot.permit[i]]);
            }
            all_permit_names.join(", ");

            const popupContent = `
                <div class="parking-popup">
                    <h3>${lot.name}</h3>
                    <p><strong>Permits permitted:</strong><br>${all_permit_names}</p>
                    <p><strong>Hours enforced:</strong><br>${lot.hours}</p>
                    <button class="set-start-btn" data-lat="${offsetCoords[0]}" data-lng="${offsetCoords[1]}"><strong>Set as Start Location</strong></button><br>
                    <button class="set-destination-btn" data-lat="${offsetCoords[0]}" data-lng="${offsetCoords[1]}"><strong>Set as Destination</strong></button>
                </div>
            `;

            

            const marker = L.marker(offsetCoords, { icon })
                .bindPopup(popupContent, {
                    maxWidth: 300,
                    className: 'parking-info-popup'});
            
                    marker.on('popupopen', function() {
                        const destinationBtn = document.querySelector('.set-destination-btn');
                        const startBtn = document.querySelector('.set-start-btn');
                    
                        if (destinationBtn) {
                            destinationBtn.addEventListener('click', function () {
                                const lat = parseFloat(this.getAttribute('data-lat'));
                                const lng = parseFloat(this.getAttribute('data-lng'));
                    
                                document.getElementById('route-end').value = lot.name;
                    
                                selectedParkEnd = lot;
                                sel_destination_flag = 1;
                                marker.closePopup();
                            });
                        }
                    
                        if (startBtn) {
                            startBtn.addEventListener('click', function () {
                                const lat = parseFloat(this.getAttribute('data-lat'));
                                const lng = parseFloat(this.getAttribute('data-lng'));
                    
                                document.getElementById('route-start').value = lot.name;
                                selectedParkStart = lot;
                                sel_start_flag = 1;
                    
                                marker.closePopup();
                            });
                        }
                    });                    
            marker.addTo(map);
            activeMarkers.push(marker);
        });

    
    }
}

function getOffset(index) {
    const delta = 0.00007; // Small nudge in degrees
    const offsets = [
        [delta, delta],
        [-delta, delta],
        [delta, -delta],
        [-delta, -delta],
        [0, delta],
        [delta, 0],
        [0, -delta],
        [-delta, 0]
    ];
    return offsets[index % offsets.length]; // Cycle if more than 8
}

function getColor(permit) {
    const colors = {
        A: '#d9534f',
        B: '#047d00',
        C: '#ffc800',
        D: '#7300b5',
        E: '#7300b5',
        P: '#292b2c',
        Ev: '#008da6',
        '♿': '#0099ff'
    };
    return colors[permit] || '#666';
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('#permit-filters input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        console.log(`Checked: ${cb.value}`);
        updateMarkers(); // This function should handle adding/removing markers
      });
    });
});


//#region ROUTING
// Custom Google router
L.Routing.Google = L.Class.extend({
    initialize: function(options) {
        this.options = {
            travelMode: 'WALKING',
            unitSystem: google.maps.UnitSystem.IMPERIAL,
            ...options
        };
    },

    // The main routing function called by L.Routing.control
    route: function(waypoints, callback, context, options) {
        var _this = this; // Keep reference to 'this' for the callback
        // Combine default router options, per-route options from control, if any
        var routeOpts = L.Util.extend({}, this.options, options);

        // Check if Google Maps API is ready
        if (typeof google === 'undefined' || !google.maps || !google.maps.DirectionsService) {
            return callback.call(context, {
                status: -1, // Use a custom error status
                message: "Google Maps API not loaded or ready."
            });
        }

        var directionsService = new google.maps.DirectionsService();

        // Extract L.LatLng objects from LRM waypoints
        var originLatLng = waypoints[0].latLng;
        var destinationLatLng = waypoints[waypoints.length - 1].latLng;

        // Build the Google Directions Request object
        var request = {
            origin: { lat: originLatLng.lat, lng: originLatLng.lng },
            destination: { lat: destinationLatLng.lat, lng: destinationLatLng.lng },
            travelMode: routeOpts.travelMode,
            unitSystem: routeOpts.unitSystem
            // Add more options from routeOpts if needed (e.g., provideRouteAlternatives)
        };

        // Handle intermediate waypoints if present (optional, more complex)
        if (waypoints.length > 2) {
            request.waypoints = waypoints.slice(1, -1).map(function(wp) {
                return { location: { lat: wp.latLng.lat, lng: wp.latLng.lng }, stopover: true };
            });
            // request.optimizeWaypoints = true; // Optional
        }

        // Perform the routing request
        directionsService.route(request, function(response, status) {
            if (status === google.maps.DirectionsStatus.OK) {
                try {
                    // Convert the Google response to the format LRM expects
                    const lrmRoutes = [_this._convertRoute(response)]; // LRM expects an array of route objects
                    // Call LRM's callback with error=null, routes=array
                    callback.call(context, null, lrmRoutes);
                } catch (e) {
                     console.error("Error converting Google route:", e);
                     callback.call(context, { status: -2, message: "Error processing Google Directions response: " + e.message });
                }
            } else {
                // Pass the Google error status/message back to LRM's callback
                console.error("Google Directions request failed:", status);
                callback.call(context, { status: status, message: "Google Directions request failed: " + status });
            }
        });

        return this; // LRM expects the router instance to be returned
    },

    // Private helper method to convert Google route format to LRM format
    _convertRoute: function(googleRouteResponse) {
        var route = googleRouteResponse.routes[0]; // Get the first route
        var leg = route.legs[0]; // Assuming only one leg (no complex waypoints)
        var coordinates = []; // Array for route geometry (L.LatLng)
        var instructions = []; // Array for LRM instructions
        var currentCoordIndex = 0; // Keep track of coordinate index for instructions

        // Process each step in the leg
        leg.steps.forEach(function(step, i) {
            // Decode the polyline for this step's path
            var stepPath = google.maps.geometry.encoding.decodePath(step.polyline.points);
            var stepCoords = stepPath.map(function(latLng) {
                return L.latLng(latLng.lat(), latLng.lng());
            });

            // Add coordinates to the main array, avoiding duplicates at step boundaries
            if (coordinates.length > 0 && stepCoords.length > 0) {
                if (coordinates[coordinates.length - 1].equals(stepCoords[0])) {
                    stepCoords = stepCoords.slice(1); // Remove duplicate start point
                }
            }
            coordinates = coordinates.concat(stepCoords);

            // Create the instruction object for LRM
            // *** This is the SIMPLE version WITHOUT type/modifier for icons ***
            instructions.push({
                text: step.instructions,       // Raw HTML instructions from Google
                distance: step.distance.value, // Meters
                time: step.duration.value,     // Seconds
                index: currentCoordIndex       // Index in the coordinates array for start of step
                // No 'type' or 'modifier' properties in this reverted version
            });

            // Update the starting index for the next step
            currentCoordIndex = coordinates.length;
        });

        // Construct the object LRM expects
        return {
            name: route.summary || '', // Road names summary from Google (might be empty for walking)
            summary: {
                totalDistance: leg.distance.value, // Meters
                totalTime: leg.duration.value      // Seconds
            },
            coordinates: coordinates,          // Array of L.LatLng for the route line
            instructions: instructions,        // Array of instruction objects
            waypoints: [], // LRM waypoints; can be complex, start simple
                           // Could use route.legs[0].start_location/end_location, but LRM often recalculates
            inputWaypoints: [] // Original input waypoints if needed by LRM features
        };
    }
});

/* we need a custom formatter because default LRM formatter doesn't handle
    Google's html tags well */
L.Routing.HtmlFormatter = L.Routing.Formatter.extend({
    options: {
        ...L.Routing.Formatter.prototype.options
    },

    formatInstruction: function(instruction, i) {
        return instruction.text;
    }
});

// Custom itinerary builder to handle proper formatting
L.Routing.CustomItineraryBuilder = L.Routing.ItineraryBuilder.extend({

    // to store the steps container <tbody> reference
    _stepsContainer: null,

    // override createStepsContainer to store the reference
    createStepsContainer: function() {
        // call parent implementation first to get the actual steps container
        var container = L.Routing.ItineraryBuilder.prototype.createStepsContainer.call(this);
        this._stepsContainer = container; // store it
        return container;
    },

    // override createStep to perform custom DOM creation and use innerHTML
    createStep: function(text, distance, stepsContainer_param_ignored) {

    // retrieve the stored container reference (the <tbody>)
    var actualStepsContainer = this._stepsContainer;

    // validate the stored container before attempting to append it
    if (!actualStepsContainer || typeof actualStepsContainer.appendChild !== 'function') {
         console.error("Invalid stored _stepsContainer! Cannot create or append step.");
         
         return null;
    }

    try {
        // create the row element <tr>, don't append to actualStepsContainer yet
        var step = L.DomUtil.create('tr', '');

        // create icon Cell
        var iconCell = L.DomUtil.create('td', 'leaflet-routing-icon', step);
        // Add icon logic here later if needed

        // create instruction cell
        var instructionCell = L.DomUtil.create('td', 'leaflet-routing-instruction-text', step);
        instructionCell.innerHTML = text; // Render HTML

        // distance cell
        var distanceCell = L.DomUtil.create('td', 'leaflet-routing-instruction-distance', step);
        distanceCell.textContent = distance;

        // append the created step <tr> to the stored container <tbody>
        actualStepsContainer.appendChild(step);

        // return the element
        return step;

    } catch (e) {
        console.error("Error during custom createStep execution:", e);
        return null;
    }
    }
});

var customFormatter = new L.Routing.HtmlFormatter ({units: 'imperial'});
var customItineraryBuilder = new L.Routing.CustomItineraryBuilder({});
// we'll want the user to be able to choose their travel mode
let travel = 'WALKING'; // Can be 'WALKING', 'BICYCLING', 'TRANSIT'
// Routing Control
const routeCtrl = L.Routing.control({
    waypoints: [
      L.latLng(buildings["Administration Building"].coordinates),
      L.latLng(buildings["Retriever Soccer Park Ticket Booth"].coordinates)
    ],
    /*/ OSRM routing service
    router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1'
    }),*/
    // Google Router
    router: new L.Routing.Google({
        travelMode: travel,
        unitSystem: google.maps.UnitSystem.IMPERIAL
    }),
 UI_pawprints
    lineOptions: {
        styles: [{
            color: 'transparent',  // Change to a visible color
            opacity: 1,     // Make it visible
            weight: 1       // Increase weight to make it thicker
        }]
    },    

    formatter: customFormatter,
    itineraryBuilder: customItineraryBuilder,

    routeWhileDragging: true,
    position: 'bottomleft',
    fitSelectedRoutes: true,
    addWaypoints: false,
    collapsible: true,
  }).addTo(map);

  routeCtrl.on('routeselected', function(event) {
    const routeCoordinates = event.route.coordinates;

    // Clear previous paw prints
    activeMarkers.forEach(marker => map.removeLayer(marker));
    activeMarkers = [];

    const intervalDistance = 25; // in meters (change to make closer/farther)
    let accumulatedDistance = 0;
    let lastPrintCoord = routeCoordinates[0];

    for (let i = 1; i < routeCoordinates.length; i++) {
        const currentCoord = routeCoordinates[i];
        const segmentDistance = lastPrintCoord.distanceTo(currentCoord);

        accumulatedDistance += segmentDistance;

        while (accumulatedDistance >= intervalDistance) {
            // Calculate how far along the segment to place the paw print
            const overshoot = accumulatedDistance - intervalDistance;
            const fraction = 1 - (overshoot / segmentDistance);

            const lat = lastPrintCoord.lat + fraction * (currentCoord.lat - lastPrintCoord.lat);
            const lng = lastPrintCoord.lng + fraction * (currentCoord.lng - lastPrintCoord.lng);

            const pawPrintMarker = L.marker([lat, lng], { icon: pawPrintIcon }).addTo(map);
            activeMarkers.push(pawPrintMarker);

            // Prepare for next interval
            accumulatedDistance -= intervalDistance;
            lastPrintCoord = L.latLng(lat, lng);
        }

        lastPrintCoord = currentCoord;
    }
});

// Autocomplete for routing inputs
document.addEventListener('DOMContentLoaded', function() {
    const startInput = document.getElementById('route-start');
    const endInput = document.getElementById('route-end');
    
    const startAutocomplete = document.createElement('div');
    const endAutocomplete = document.createElement('div');
    startAutocomplete.className = 'autocomplete-items';
    endAutocomplete.className = 'autocomplete-items';
    startInput.parentNode.appendChild(startAutocomplete);
    endInput.parentNode.appendChild(endAutocomplete);

    // Handling autocomplete
    function setupAutocomplete(input, autocompleteContainer) {
        input.addEventListener('input', function() {
            const value = this.value.toLowerCase().trim();
            
            // Clear previous suggestions
            autocompleteContainer.innerHTML = '';
            
            if (!value) return false;
            
            // Filter matching locations
            const matches = Object.keys(shorthandInputs).filter(key => 
                key.toLowerCase().includes(value)
            );
            
            // Show top 5 matches
            matches.slice(0, 5).forEach(match => {
                const item = document.createElement('div');
                item.innerHTML = shorthandInputs[match];
                item.addEventListener('click', function() {
                    input.value = shorthandInputs[match];
                    autocompleteContainer.innerHTML = '';
                });
                autocompleteContainer.appendChild(item);
            });
        });
    }

    // Setup autocomplete for both inputs
    setupAutocomplete(startInput, startAutocomplete);
    setupAutocomplete(endInput, endAutocomplete);

    // Handle routing form submission
    document.getElementById('routing-search').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const startLocation = startInput.value.trim().toLowerCase();
        const endLocation = endInput.value.trim().toLowerCase();

        // Check if locations exist
        if (shorthandInputs[startLocation] && shorthandInputs[endLocation]) {
            // Update routing control waypoints
            routeCtrl.setWaypoints([
                L.latLng(buildings[shorthandInputs[startLocation]].coordinates),
                L.latLng(buildings[shorthandInputs[endLocation]].coordinates)
            ]);
        } else if (sel_destination_flag && !sel_start_flag) {
            routeCtrl.setWaypoints([
                L.latLng(buildings[shorthandInputs[startLocation]].coordinates),
                L.latLng(selectedParkEnd.coordinates)
            ]);
            sel_destination_flag = 0;
            document.getElementById('route-end').value = "";
        }else if (sel_start_flag && !sel_destination_flag) {
            routeCtrl.setWaypoints([
                L.latLng(selectedParkStart.coordinates),
                L.latLng(buildings[shorthandInputs[endLocation]].coordinates)
            ]);
            sel_start_flag = 0;
            document.getElementById('route-start').value = "";
        }else if (sel_start_flag && sel_start_flag) {
            routeCtrl.setWaypoints([
                L.latLng(selectedParkStart.coordinates),
                L.latLng(selectedParkEnd.coordinates)
            ]);
            sel_start_flag = 0;
            sel_destination_flag = 0;
            document.getElementById('route-end').value = "";
            document.getElementById('route-start').value = "";
        } else {
            alert("Invalid waypoint(s)");
        }
    });


    // Hide suggestions when clicking elsewhere
    document.addEventListener('click', function(e) {
        if (e.target !== startInput && e.target !== endInput) {
            startAutocomplete.innerHTML = '';
            endAutocomplete.innerHTML = '';
        }
    });
});


const routingContainer = document.querySelector('.leaflet-routing-container');
const routingSearchContainer = document.getElementById('routing-search-container');

// Observer to watch for class changes on the routing container
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.attributeName === 'class') {
            // Check if routing container is collapsed
            const isCollapsed = routingContainer.classList.contains('leaflet-routing-container-hide');
            // Toggle search container visibility
            routingSearchContainer.classList.toggle('hidden', isCollapsed);
        }
    });
});

// Start observing the routing container for class changes
observer.observe(routingContainer, {
    attributes: true
});

// Error handling
routeCtrl.on('routingerror', function(e) {
    console.log('Routing error:', e);
});
//#endregion
