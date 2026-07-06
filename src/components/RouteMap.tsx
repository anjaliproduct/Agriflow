import { Sparkles } from "lucide-react";
import type { Map as LeafletMap } from "leaflet";
import { useEffect, useRef } from "react";

// Demo coordinates — Karnataka region, India
const STOP_COORDS: Record<string, [number, number]> = {
  "Green Valley Farms":      [13.0844, 77.7243], // East Ridge, ~12 km east
  "Sunrise Organics":        [13.1921, 77.6183], // North Fields, ~18 km north
  "Nandi Fresh Produce":     [13.3627, 77.7312], // Nandi Road, ~38 km north-east
  "Riverbend Farms":         [12.9714, 77.4517], // Riverbend, ~22 km south-west
  "Patel Agro":              [12.8813, 77.5224], // South Canal, ~28 km south
  "Main Collection Center":  [13.0827, 77.5877], // Bangalore
};

type RouteStop = {
  farmName: string;
  time: string;
  status: string;
  produce: string;
  quantity: number;
};

function pinHTML(label: string, time: string, dotBg: string, timeBg = "white", timeColor = "#1e293b") {
  return `
    <div style="display:flex;flex-direction:column;align-items:center;pointer-events:none;">
      <div style="
        width:28px;height:28px;border-radius:50%;
        background:${dotBg};color:white;
        font-size:11px;font-weight:700;
        display:flex;align-items:center;justify-content:center;
        border:2.5px solid white;
        box-shadow:0 2px 10px rgba(0,0,0,0.28);
        flex-shrink:0;
      ">${label}</div>
      <div style="
        margin-top:4px;background:${timeBg};border-radius:6px;
        padding:2px 7px;font-size:9.5px;font-weight:700;
        color:${timeColor};
        box-shadow:0 1px 6px rgba(0,0,0,0.14);
        white-space:nowrap;border:1px solid #e2e8f0;
        font-family:system-ui;
      ">${time}</div>
    </div>
  `;
}

export default function RouteMap({
  stops,
  collectionCenter,
  eta,
  height = 320,
}: {
  stops: RouteStop[];
  collectionCenter: string;
  eta: string;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const container = containerRef.current;

    (async () => {
      const L = (await import("leaflet")).default;

      const centerCoords: [number, number] = STOP_COORDS[collectionCenter] ?? [13.0827, 77.5877];
      const nodes = stops.map((stop) => ({
        ...stop,
        coords: STOP_COORDS[stop.farmName] ?? centerCoords,
      }));

      const allCoords: [number, number][] = [centerCoords, ...nodes.map((n) => n.coords)];

      const map = L.map(container, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
      });
      mapRef.current = map;

      L.control.zoom({ position: "topright" }).addTo(map);
      L.control.attribution({ prefix: "© OpenStreetMap", position: "bottomright" }).addTo(map);

      // CartoDB light tiles — clean, modern look
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);

      map.fitBounds(L.latLngBounds(allCoords), { padding: [48, 48] });

      // Dashed placeholder while road route loads
      const waypoints: [number, number][] = [centerCoords, ...nodes.map((n) => n.coords), centerCoords];
      const placeholder = L.polyline(waypoints, {
        color: "#94a3b8",
        weight: 2.5,
        dashArray: "7 6",
        opacity: 0.5,
      }).addTo(map);

      // Fetch actual road route from public OSRM
      try {
        const coordStr = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(";");
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`,
          { signal: AbortSignal.timeout(6000) },
        );
        const data = await res.json();
        if (data.routes?.[0]?.geometry) {
          map.removeLayer(placeholder);
          L.geoJSON(data.routes[0].geometry, {
            style: { color: "#16a34a", weight: 3.5, opacity: 0.85 },
          }).addTo(map);
        }
      } catch {
        // Fallback: keep dashed line but make it green
        placeholder.setStyle({ color: "#16a34a", dashArray: undefined, opacity: 0.75, weight: 3 });
      }

      // Stop markers
      nodes.forEach((node, i) => {
        const isDone = node.status === "Loaded";
        const isArrived = node.status === "Arrived";
        const dotBg = isDone ? "#16a34a" : isArrived ? "#f59e0b" : "#1e293b";
        const label = isDone ? "✓" : String(i + 1);

        const icon = L.divIcon({
          html: pinHTML(label, node.time, dotBg),
          className: "",
          iconSize: [90, 56],
          iconAnchor: [45, 14],
        });

        L.marker(node.coords, { icon })
          .bindPopup(
            `<div style="font-family:system-ui;min-width:160px;padding:2px 0">
              <p style="font-weight:700;margin:0 0 4px;color:#0f172a;font-size:13px">${node.farmName}</p>
              <p style="color:#64748b;margin:0 0 2px;font-size:12px">${node.produce} · ${node.quantity} kg</p>
              <p style="color:#64748b;margin:0;font-size:12px">Ready at <strong>${node.time}</strong></p>
            </div>`,
            { closeButton: false, offset: [0, 10] },
          )
          .addTo(map);
      });

      // Collection center star marker
      const centerIcon = L.divIcon({
        html: pinHTML("★", `ETA ${eta}`, "#15803d", "#f0fdf4", "#15803d"),
        className: "",
        iconSize: [100, 56],
        iconAnchor: [50, 14],
      });
      L.marker(centerCoords, { icon: centerIcon })
        .bindPopup(
          `<div style="font-family:system-ui;padding:2px 0">
            <p style="font-weight:700;margin:0;color:#0f172a;font-size:13px">${collectionCenter}</p>
            <p style="color:#64748b;margin:2px 0 0;font-size:12px">ETA ${eta}</p>
          </div>`,
          { closeButton: false, offset: [0, 10] },
        )
        .addTo(map);
    })();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200">
      <div ref={containerRef} style={{ height }} />
      {/* AI badge */}
      <div className="absolute left-3 top-3 z-[1000] flex items-center gap-1.5 rounded-full border border-green-100 bg-white/96 px-3 py-1.5 shadow-md backdrop-blur-sm">
        <Sparkles size={12} className="text-green-600" />
        <span className="text-[11px] font-semibold text-green-700">
          AI-optimized · {stops.length} stops
        </span>
      </div>
    </div>
  );
}
