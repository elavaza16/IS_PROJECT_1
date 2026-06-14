import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";

// fix icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function LocationMap({ onLocationFound }) {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        setPosition(coords);

        // send to parent component
        onLocationFound?.(coords);
      },
      (err) => {
        console.error("Location error:", err);
      }
    );
  }, []);

  if (!position) {
    return <p>Loading map...</p>;
  }

  return (
    <MapContainer
      center={position}
      zoom={16}
      style={{ height: "300px", width: "100%", borderRadius: "12px" }}
    >
      {/* OpenStreetMap tiles (FREE) */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />

      {/* User marker */}
      <Marker position={position}>
        <Popup>You are here (Emergency location)</Popup>
      </Marker>
    </MapContainer>
  );
}