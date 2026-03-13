import React, { useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, Circle } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import {
  formatDistance,
  formatTravelTime,
  getCoordinatesFromGig,
} from "../../utils/locationHelpers";
import "leaflet/dist/leaflet.css";

// Custom gig marker — purple pin with price label
const createGigIcon = (price, isActive) =>
  L.divIcon({
    className: "",
    html: `
      <div style="
        display:flex;flex-direction:column;align-items:center;
        filter:drop-shadow(0 4px 8px rgba(139,92,246,0.6));
      ">
        <div style="
          background:${isActive ? "#a855f7" : "#7c3aed"};
          color:#fff;
          font-size:11px;font-weight:700;
          padding:4px 8px;border-radius:20px;
          white-space:nowrap;
          border:2px solid ${isActive ? "#e879f9" : "#a855f7"};
          box-shadow:0 0 ${isActive ? "12px" : "6px"} rgba(139,92,246,0.8);
          transition:all 0.2s;
        ">₹${price}</div>
        <div style="
          width:0;height:0;
          border-left:6px solid transparent;
          border-right:6px solid transparent;
          border-top:8px solid ${isActive ? "#a855f7" : "#7c3aed"};
          margin-top:-1px;
        "></div>
      </div>`,
    iconSize: [50, 40],
    iconAnchor: [25, 40],
    popupAnchor: [0, -42],
  });

// Custom user-location marker — pulsing blue dot
const userIcon = L.divIcon({
  className: "",
  html: `
    <div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
      <div style="
        position:absolute;width:24px;height:24px;
        background:rgba(59,130,246,0.25);border-radius:50%;
        animation:pulse-ring 1.8s ease-out infinite;
      "></div>
      <div style="
        width:12px;height:12px;
        background:#3b82f6;border-radius:50%;
        border:2px solid #fff;
        box-shadow:0 0 8px rgba(59,130,246,0.9);
        position:relative;z-index:1;
      "></div>
    </div>
    <style>
      @keyframes pulse-ring{0%{transform:scale(1);opacity:0.8}100%{transform:scale(2.4);opacity:0}}
    </style>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
});

const defaultCenter = [20.5937, 78.9629];

const GigMapView = ({
  gigs,
  userLocation,
  selectedGigId,
  onSelectGig,
  radiusKm,
}) => {
  const [activeGigId, setActiveGigId] = useState(selectedGigId || null);

  const markers = useMemo(
    () =>
      gigs
        .map((gig) => {
          const coords = getCoordinatesFromGig(gig);
          return coords ? { gig, coords } : null;
        })
        .filter(Boolean),
    [gigs],
  );

  const center =
    userLocation?.lat && userLocation?.lng
      ? [userLocation.lat, userLocation.lng]
      : markers[0]
        ? [markers[0].coords.lat, markers[0].coords.lng]
        : defaultCenter;

  return (
    <div className="glass-card overflow-hidden h-[520px] border border-white/10">
      <MapContainer center={center} zoom={11} className="h-full w-full z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLocation?.lat && userLocation?.lng && (
          <>
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userIcon}
            >
              <Popup>Your current location</Popup>
            </Marker>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={(radiusKm || 10) * 1000}
              pathOptions={{
                color: "#3b82f6",
                fillColor: "#3b82f6",
                fillOpacity: 0.08,
              }}
            />
          </>
        )}

        {markers.map(({ gig, coords }) => (
          <Marker
            key={gig._id}
            position={[coords.lat, coords.lng]}
            icon={createGigIcon(gig.price, activeGigId === gig._id)}
            eventHandlers={{
              click: () => {
                setActiveGigId(gig._id);
                onSelectGig?.(gig._id);
              },
            }}
          >
            <Popup>
              <div className="min-w-[220px] text-slate-900">
                <div className="font-bold text-base mb-1">{gig.title}</div>
                <div className="text-sm mb-2">{gig.location}</div>
                <div className="text-sm mb-1">
                  {formatDistance(gig.distanceKm)}
                </div>
                <div className="text-sm mb-3">
                  {formatTravelTime(gig.travel)}
                </div>
                <Link
                  to={`/gig/${gig._id}`}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  View gig
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {activeGigId && (
        <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
          <div className="mx-auto max-w-sm bg-surface/90 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 pointer-events-auto">
            <div className="text-xs uppercase tracking-[0.2em] text-neonBlue mb-1">
              Map focus
            </div>
            <div className="text-sm text-gray-300">
              Viewing gig marker for the selected opportunity.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GigMapView;
