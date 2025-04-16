import { buildings, food, parking, resources, shorthandInputs, polyBuildings, buildingNames } from './data.js';

// initialize the map centered on UMBC
var map = L.map('map').setView([39.2557, -76.7110], 16.5); // Zoom level adjusted for campus view

// add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 22
}).addTo(map);

// Add invisible clickable building areas
function addClickableBuildings() {
    // Define building information with polygon coordinates and details

    // Create invisible polygons for each building
    for (const [key, building] of Object.entries(polyBuildings)) {
        // Create invisible polygon
        const polygon = L.polygon(building.polygon, {
            color: 'transparent',       // Invisible border
            fillColor: 'transparent',   // Invisible fill
            fillOpacity: 0,             // Completely transparent
            weight: 0                   // No border
        }).addTo(map);
        
        // Change cursor to pointer when hovering over building
        polygon.on('mouseover', function() {
            this.setStyle({
                fillOpacity: 0.2,       // Slight highlight on hover
                fillColor: '#FDB515'    // UMBC gold
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
        const popupContent = `
            <div class="building-popup">
                <h3>${building.info.name}</h3>
                <p><strong>Hours:</strong><br>${building.info.hours}</p>
                <p>${building.info.description}</p>
                <p><strong>Facilities:</strong></p>
                <ul>
                    ${building.info.facilities.map(facility => `<li>${facility}</li>`).join('')}
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

//#region ROUTING
// Leaflet Routing Machine
const routeCtrl = L.Routing.control({
    waypoints: [
      L.latLng(buildings["Information Technology/Engineering Building"].coordinates),
      L.latLng(buildings["Retriever Soccer Park Ticket Booth"].coordinates)
    ],
    // OSRM routing service
    router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1'
    }),
    routeWhileDragging: true,
    position: 'bottomleft',
    fitSelectedRoutes: true,
    addWaypoints: false,
    collapsible: true,
    units: 'imperial'
  }).addTo(map);

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

/* the following block of code will hide the routing search container
    when we wide the routing instructions box */
// Get the routing container element
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