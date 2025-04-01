import db from "./database"

const database = client.db('RetrieverRoutes');
//const movies = database.collection('movies');
const buildings = database.collection('Buildings');
const Food = database.collection('Food');
const parkingLots = database.collection('ParkingLots');
const resources = database.collection('ResourcesOffices');

// initialize the map centered on UMBC
var map = L.map('map').setView([39.2557, -76.7110], 16.5); // Zoom level adjusted for campus view

// add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 22
}).addTo(map);

document.getElementById('search-place').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form submission from reloading page

    //let searchQuery = document.getElementById('search-input').value.trim().toLowerCase();

    console.log(searchQuery);

    query = { BuildingName: searchQuery };
    location = buildings.findOne(query);
    // find a way to reference just the coordinates from the found document
    coords = location.distinct("Coords", {Coords: {$exists : true}});

    if (location) {
        map.flyTo(coords); // Zoom in and move to location
    } else {
        alert("Location not found!");
    }
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