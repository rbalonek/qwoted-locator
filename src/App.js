// src/App.js
import React, { useState } from "react";
import LeafletMap from "./LeafletMap";
import storeData from "./stores.json";
import "leaflet/dist/leaflet.css";
import "./App.css";

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function getDistanceMiles(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const KM_TO_MI = 0.621371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;
  return distanceKm * KM_TO_MI;
}

function App() {
  const [mapCenter, setMapCenter] = useState([39.8283, -98.5795]); // US center
  const [zoomLevel, setZoomLevel] = useState(4);
  const [markers] = useState(storeData);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [showLocationPopup, setShowLocationPopup] = useState(false);

  const findNearestStore = (latitude, longitude) => {
    let nearestStore = null;
    let minDistance = Infinity;

    markers.forEach((store) => {
      const dist = getDistanceMiles(latitude, longitude, store.latitude, store.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearestStore = store;
      }
    });

    if (nearestStore) {
      setMapCenter([nearestStore.latitude, nearestStore.longitude]);
      setZoomLevel(15);
      setSelectedStoreId(nearestStore.id);
    }

    setLoading(false);
  };

  // Handle "Use My Location"
  const handleFindMe = () => {
    if (!navigator.geolocation) {
      alert("Your browser does not support geolocation.");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        findNearestStore(latitude, longitude);
      },
      (error) => {
        console.error("Geo error:", error);
        setLoading(false);

        // Show the location access popup
        setShowLocationPopup(true);
      }
    );
  };
  // Handle ZIP Code / Address Search using Nominatim (OpenStreetMap)
  const handleSearch = async () => {
    if (!searchInput.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchInput)}&countrycodes=US&limit=1`);
      const data = await response.json();

      console.log("Nominatim Response:", data);

      if (data.length > 0) {
        const { lat, lon, display_name } = data[0]; // Get first search result
        console.log("Found Location:", display_name, lat, lon);
        findNearestStore(parseFloat(lat), parseFloat(lon));
      } else {
        alert("Address not found. Please try again.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="search-container">
        <button className="use-location-btn" onClick={handleFindMe}>
          Use My Location
        </button>
        <input type="text" className="search-input" placeholder="Enter ZIP Code or Address" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        <button className="search-btn" onClick={handleSearch}>
          Search
        </button>
      </div>

      {/* Location Denial Popup */}
      {showLocationPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>Enable Location Services</h2>
            <p>You need to enable location access in your browser settings.</p>
            <ul>
              <li>🔹 On Chrome: Go to Settings → Privacy & Security → Site Settings → Location</li>
              <li>🔹 On Safari (iPhone): Settings → Privacy → Location Services</li>
              <li>🔹 On Firefox: Click the lock icon in the address bar</li>
            </ul>
            <button className="close-btn" onClick={() => setShowLocationPopup(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="spinner-overlay">
          <div className="spinner"></div>
        </div>
      )}

      <LeafletMap center={mapCenter} zoom={zoomLevel} markers={markers} selectedStoreId={selectedStoreId} />
    </div>
  );
}

export default App;
