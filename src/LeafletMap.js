import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
import "./App.css";

// Function to create a custom marker icon
const createCustomIcon = (imgUrl) => {
  return divIcon({
    html: `
      <div class="marker-container">
        <img src="${imgUrl}" class="marker-image" />
      </div>
    `,
    className: "custom-marker",
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -40],
  });
};

// USA Bounds
const US_BOUNDS = [
  [24.396308, -125.0],
  [49.384358, -66.93457],
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
      maxBounds={US_BOUNDS}
      maxBoundsViscosity={1.0}
      minZoom={4}
      maxZoom={18}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
      />

      {stateBorders && (
        <GeoJSON
          data={stateBorders}
          style={() => ({
            color: "#f2a049",
            weight: 1.5,
            opacity: 0.5,
            fillOpacity: 0,
          })}
        />
      )}

      {markers
        .filter((marker) => marker.latitude && marker.longitude)
        .map((marker) => (
          <StoreMarker key={marker.id} marker={marker} isSelected={marker.id === selectedStoreId} />
        ))}
    </MapContainer>
  );
}

function StoreMarker({ marker, isSelected }) {
  const markerRef = useRef(null);
  const map = useMap();

  useEffect(() => {
    if (isSelected && markerRef.current) {
      markerRef.current.openPopup();
      map.setView([marker.latitude, marker.longitude], 15, { animate: true });
    }
  }, [isSelected, map, marker.latitude, marker.longitude]);

  return (
    <Marker
      position={[marker.latitude, marker.longitude]}
      icon={createCustomIcon(marker.img_url)}
      ref={markerRef}
    >
      <Popup>
        <div className="popup-content">
          <h3>{marker.name}</h3>
          <p>{marker.address}</p>
          <p>
            <em>{marker.quote}</em>
          </p>
        </div>
      </Popup>
    </Marker>
  );
}

export default LeafletMap;
