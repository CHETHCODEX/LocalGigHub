import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  MapPin,
  Navigation,
  Search,
  Loader2,
  Radar,
  Route,
} from "lucide-react";
import { Link } from "react-router-dom";
import GigMapView from "../components/map/GigMapView";
import {
  fetchGigsByLocation,
  getCurrentBrowserLocation,
} from "../utils/locationService";
import { formatDistance, formatTravelTime } from "../utils/locationHelpers";

const GigCard = ({ gig, idx }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: idx * 0.1 }}
    className="glass-card p-6 flex flex-col h-full hover:border-neonPurple/50 transition-colors group cursor-pointer"
  >
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-lg font-bold group-hover:text-neonPurple transition-colors leading-tight line-clamp-2">
        {gig.title}
      </h3>
      <div className="bg-neonBlue/20 text-neonBlue text-xs px-2 py-1 rounded-md font-bold whitespace-nowrap">
        ₹{gig.price}
      </div>
    </div>

    <p className="text-sm text-gray-400 mb-4 line-clamp-2">{gig.desc}</p>

    <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-auto">
      <div className="flex items-center gap-1.5 bg-surfaceElevated px-2.5 py-1.5 rounded-full">
        <MapPin size={14} /> {gig.location}
      </div>
      {gig.distanceKm !== null && gig.distanceKm !== undefined && (
        <div className="flex items-center gap-1.5 bg-neonBlue/10 text-neonBlue px-2.5 py-1.5 rounded-full">
          <Navigation size={14} /> {formatDistance(gig.distanceKm)}
        </div>
      )}
      <div className="flex items-center gap-1.5 bg-surfaceElevated px-2.5 py-1.5 rounded-full">
        <Clock size={14} /> {gig.duration}
      </div>
      {gig.travel && (
        <div className="flex items-center gap-1.5 bg-surfaceElevated px-2.5 py-1.5 rounded-full">
          <Route size={14} /> {formatTravelTime(gig.travel)}
        </div>
      )}
    </div>

    <Link
      to={`/gig/${gig._id}`}
      className="mt-6 w-full py-2.5 bg-surfaceElevated text-center rounded-lg font-semibold hover:bg-neonPurple hover:text-white transition-colors"
    >
      View Details
    </Link>
  </motion.div>
);

const Marketplace = () => {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [distanceKm, setDistanceKm] = useState(15);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [selectedGigId, setSelectedGigId] = useState(null);

  useEffect(() => {
    fetchGigs();
  }, [category, distanceKm]);

  const fetchGigs = async () => {
    try {
      setLoading(true);
      const data = await fetchGigsByLocation({
        category,
        search,
        lat: userLocation?.lat,
        lng: userLocation?.lng,
        maxDistanceKm: distanceKm,
      });
      setGigs(data);
      setSelectedGigId((current) => current || data[0]?._id || null);
    } catch (err) {
      console.error("Error fetching gigs:", err);
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = async () => {
    try {
      setLocationError(null);
      const coords = await getCurrentBrowserLocation();
      setUserLocation(coords);
    } catch (error) {
      setLocationError(
        "Location access denied. You can still browse all gigs.",
      );
    }
  };

  useEffect(() => {
    detectLocation();
  }, []);

  useEffect(() => {
    fetchGigs();
  }, [userLocation]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchGigs();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold mb-2">Local Opportunities</h1>
          <p className="text-gray-400">
            Explore gigs on the map, filter by distance, and see travel time
            instantly.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search gigs..."
              className="bg-surface border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-neonPurple w-full sm:w-48"
            />
            <button
              type="submit"
              className="bg-neonPurple hover:bg-neonPurple/90 px-4 py-2 rounded-lg"
            >
              <Search size={18} />
            </button>
          </form>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-surface border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="retail">Retail</option>
            <option value="food">Food & Beverage</option>
            <option value="delivery">Delivery</option>
            <option value="tutoring">Tutoring</option>
            <option value="events">Events</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6 mb-8">
        <div className="glass-card p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 text-neonBlue font-semibold mb-1">
                <Radar size={18} /> Interactive Map View
              </div>
              <p className="text-sm text-gray-400">
                Pinpoint gigs nearby and click markers to inspect opportunities
                in context.
              </p>
            </div>
            <button
              type="button"
              onClick={detectLocation}
              className="bg-neonBlue/10 hover:bg-neonBlue/20 text-neonBlue border border-neonBlue/30 px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Use My Location
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-5 mb-5">
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
                Distance Filter
              </div>
              <input
                type="range"
                min="3"
                max="50"
                value={distanceKm}
                onChange={(e) => setDistanceKm(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="min-w-[120px] rounded-2xl bg-surfaceElevated px-4 py-3 text-center">
              <div className="text-xs uppercase tracking-[0.2em] text-gray-500">
                Radius
              </div>
              <div className="text-2xl font-bold text-neonBlue">
                {distanceKm} km
              </div>
            </div>
          </div>

          {locationError && (
            <p className="text-sm text-yellow-400 mb-4">{locationError}</p>
          )}

          <div className="relative">
            <GigMapView
              gigs={gigs}
              userLocation={userLocation}
              selectedGigId={selectedGigId}
              onSelectGig={setSelectedGigId}
              radiusKm={distanceKm}
            />
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
            Geo Search
          </div>
          <h2 className="text-2xl font-bold mb-3">Nearby Gig Intelligence</h2>
          <div className="space-y-4 text-sm text-gray-300">
            <div className="rounded-2xl bg-surfaceElevated px-4 py-4 border border-white/10">
              <div className="font-semibold text-white mb-1">
                Auto-detect location
              </div>
              <div>
                {userLocation
                  ? `Tracking gigs near ${userLocation.lat.toFixed(3)}, ${userLocation.lng.toFixed(3)}`
                  : "Location not detected yet. Enable location for nearby gigs."}
              </div>
            </div>
            <div className="rounded-2xl bg-surfaceElevated px-4 py-4 border border-white/10">
              <div className="font-semibold text-white mb-1">
                Route estimator
              </div>
              <div>
                Each gig card shows estimated walk and drive time from your
                current location.
              </div>
            </div>
            <div className="rounded-2xl bg-surfaceElevated px-4 py-4 border border-white/10">
              <div className="font-semibold text-white mb-1">
                Dynamic distance sort
              </div>
              <div>
                When your location is enabled, results automatically reorder so
                the closest gigs stay first.
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 size={40} className="animate-spin text-neonPurple" />
        </div>
      ) : gigs.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">
            No gigs available at the moment.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Check back later or try a different search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {gigs.map((gig, idx) => (
            <div
              key={gig._id}
              className="h-full"
              onMouseEnter={() => setSelectedGigId(gig._id)}
            >
              <GigCard gig={gig} idx={idx} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Marketplace;
