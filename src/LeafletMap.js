import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
import logoIcon from "./images/Big Air Logo.png";
import "./App.css";

// Function to create a custom marker icon
const createCustomIcon = (isComingSoon) => {
  return divIcon({
    html: `
      <div class="marker-container ${isComingSoon ? "coming-soon-marker" : "open-park-marker"}">
        <img src="${logoIcon}" class="marker-image" />
      </div>
    `,
    className: "custom-marker",
    iconSize: [30, 40], // This is ignored by divIcon, use CSS instead
    iconAnchor: [15, 40],
    popupAnchor: [0, -40],
  });
};

// **USA Bounds Strictly Enforced**
const US_BOUNDS = [
  [24.396308, -125.0], // Southwest corner (Hawaii excluded)
  [49.384358, -66.93457], // Northeast corner
];

function LeafletMap({ center, zoom, markers, selectedStoreId }) {
  const mapRef = useRef(null);
  const [stateBorders, setStateBorders] = useState(null);

  // Fetch US state borders GeoJSON
  useEffect(() => {
    fetch("https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json")
      .then((response) => response.json())
      .then((data) => setStateBorders(data))
      .catch((error) => console.error("Error fetching state borders:", error));
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "80vh", width: "100%" }}
      whenCreated={(map) => (mapRef.current = map)}
      zoomControl={true}
      maxBounds={US_BOUNDS} // Restrict map to US
      maxBoundsViscosity={1.0} // Prevents dragging outside bounds
      minZoom={4} // Prevent excessive zooming out
      maxZoom={18} // Prevent excessive zooming in
    >
      {/* Minimalist Tile Layer (No Labels, Simplified Roads) */}
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png" />

      {/* US State Borders (Darker, But Not Affecting Other Elements) */}
      {stateBorders && (
        <GeoJSON
          data={stateBorders}
          style={() => ({
            color: "#f2a049", // Medium orange-yellow
            weight: 1.5, // Thin border
            opacity: 0.5, // 50% transparency
            fillOpacity: 0, // No fill, just borders
          })}
        />
      )}

      {/* Render "Coming Soon" markers FIRST (Lower Z-Index) */}
      {markers
        .filter((marker) => marker.comingSoon)
        .map((marker) => (
          <StoreMarker key={marker.id} marker={marker} isSelected={marker.id === selectedStoreId} />
        ))}

      {/* Render Open parks LAST (Higher Z-Index) */}
      {markers
        .filter((marker) => !marker.comingSoon)
        .map((marker) => (
          <StoreMarker key={marker.id} marker={marker} isSelected={marker.id === selectedStoreId} />
        ))}
    </MapContainer>
  );
}

function StoreMarker({ marker, isSelected }) {
  const markerRef = useRef(null);
  const map = useMap();
  const bigAirUrl = `https://www.bigairusa.com/${marker.name.toLowerCase()}`;
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`Big Air Trampoline Park, ${marker.address}`)}`;

  useEffect(() => {
    if (isSelected && markerRef.current) {
      markerRef.current.openPopup();
      map.setView([marker.latitude, marker.longitude], 15, { animate: true });
    }
  }, [isSelected, map, marker.latitude, marker.longitude]);

  return (
    <Marker position={[marker.latitude, marker.longitude]} icon={createCustomIcon(marker.comingSoon)} ref={markerRef}>
      <Popup>
        <div className={`popup-content ${marker.comingSoon ? "coming-soon-overlay" : ""}`}>
          <h3>Big Air {marker.name}</h3>
          <p>{marker.address}</p>
          {marker.comingSoon ? (
            <p>
              <strong>Coming Soon!</strong>
            </p>
          ) : (
            <div className="button-container">
              <a href={bigAirUrl} target="_blank" rel="noopener noreferrer" className="visit-button">
                Visit Website
              </a>
              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="directions-button">
                Get Directions
              </a>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

export default LeafletMap;
