import React, { useEffect, useState } from "react";
import { Bell, Loader2, MapPin } from "lucide-react";
import {
  fetchAreaAlerts,
  updateLocationPreferences,
} from "../../utils/locationService";
import { formatDistance } from "../../utils/locationHelpers";

const AreaAlertsPanel = ({ currentUser, userLocation }) => {
  const [alerts, setAlerts] = useState([]);
  const [preferredAreasInput, setPreferredAreasInput] = useState("");
  const [radiusKm, setRadiusKm] = useState(10);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const loadAlerts = async () => {
    if (!currentUser?._id) return;
    try {
      setLoading(true);
      const result = await fetchAreaAlerts(currentUser._id);
      setAlerts(result.alerts || []);
    } catch (error) {
      console.error("Failed to load area alerts", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [currentUser?._id]);

  const handleSaveArea = async () => {
    if (
      !currentUser?._id ||
      !userLocation?.lat ||
      !userLocation?.lng ||
      !preferredAreasInput.trim()
    ) {
      setMessage("Enable location and enter an area label first.");
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      await updateLocationPreferences(currentUser._id, {
        location: {
          coordinates: [userLocation.lng, userLocation.lat],
          city: preferredAreasInput.trim(),
          address: preferredAreasInput.trim(),
        },
        preferredAreas: [
          {
            label: preferredAreasInput.trim(),
            city: preferredAreasInput.trim(),
            radiusKm,
            coordinates: [userLocation.lng, userLocation.lat],
          },
        ],
        notificationSettings: {
          nearbyGigAlerts: true,
          preferredAreaAlerts: true,
          maxAlertDistanceKm: radiusKm,
        },
      });
      setMessage("Preferred area saved. Alerts refreshed.");
      loadAlerts();
    } catch (error) {
      setMessage("Failed to save preferred area.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-neonBlue/15 text-neonBlue flex items-center justify-center">
          <Bell size={18} />
        </div>
        <div>
          <h3 className="text-lg font-bold">Area Alerts</h3>
          <p className="text-sm text-gray-400">
            Get notified when gigs appear near your saved zone.
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-5">
        <input
          type="text"
          value={preferredAreasInput}
          onChange={(e) => setPreferredAreasInput(e.target.value)}
          placeholder="Preferred area label"
          className="w-full bg-surfaceElevated border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-neonBlue"
        />
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="2"
            max="40"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="flex-1"
          />
          <div className="text-sm font-semibold text-neonBlue min-w-[70px] text-right">
            {radiusKm} km
          </div>
        </div>
        <button
          type="button"
          onClick={handleSaveArea}
          disabled={saving}
          className="w-full bg-neonBlue hover:bg-blue-500 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
        >
          {saving ? "Saving area..." : "Save Preferred Area"}
        </button>
        {message && <p className="text-xs text-gray-400">{message}</p>}
      </div>

      {loading ? (
        <div className="py-6 flex justify-center">
          <Loader2 size={24} className="animate-spin text-neonBlue" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-surfaceElevated/50 px-4 py-5 text-sm text-gray-400">
          No area-based alerts yet. Save a preferred area to start tracking
          nearby gigs.
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.gigId}
              className="rounded-2xl border border-white/10 bg-surfaceElevated/60 px-4 py-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-neonPurple/15 text-neonPurple flex items-center justify-center shrink-0">
                  <MapPin size={16} />
                </div>
                <div>
                  <div className="font-semibold text-sm">{alert.title}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {alert.reason}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {alert.location} · {formatDistance(alert.distanceKm)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AreaAlertsPanel;
