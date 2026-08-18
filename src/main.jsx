import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './styles.css';

const PUBLIC_POINTS = [
  {
    id: 'PUB-0187',
    source: 'public',
    stream: 'JSON/API',
    city: 'Seattle',
    coords: [47.6062, -122.3321],
    urgency: 82,
    signal: 91,
    pains: ['Logistics delay chatter', 'Procurement escalation', 'Public sentiment spike'],
    influencers: ['Civic feeds', 'Port analysts', 'Local trade press'],
    entry: 'Open a verified incident-brief channel with public affairs and operations leads.',
  },
  {
    id: 'PUB-0441',
    source: 'public',
    stream: 'JSON/API',
    city: 'Austin',
    coords: [30.2672, -97.7431],
    urgency: 54,
    signal: 68,
    pains: ['Policy-change uncertainty', 'Hiring freeze rumors', 'Vendor dependency risk'],
    influencers: ['Municipal records', 'Industry reporters', 'Founder network'],
    entry: 'Send a concise risk summary with corroborated public sources and remediation options.',
  },
  {
    id: 'PUB-0773',
    source: 'public',
    stream: 'JSON/API',
    city: 'New York',
    coords: [40.7128, -74.006],
    urgency: 71,
    signal: 74,
    pains: ['Regulatory pressure', 'Customer support backlog', 'Executive visibility event'],
    influencers: ['SEC filings', 'Analyst notes', 'Broadcast media'],
    entry: 'Route to compliance-facing stakeholders with a timeline-driven briefing.',
  },
];

const SHADOW_POINTS = [
  {
    id: 'SHD-A9F2',
    source: 'shadow',
    stream: 'HEX/WS',
    city: 'Denver',
    coords: [39.7392, -104.9903],
    urgency: 94,
    signal: 96,
    pains: ['Encrypted anomaly cluster', 'Identity assurance gaps', 'After-hours access pattern'],
    influencers: ['SOC telemetry', 'Privileged access graph', 'Partner gateway'],
    entry: 'Initiate defensive verification with incident command; preserve evidence chain.',
  },
  {
    id: 'SHD-C10E',
    source: 'shadow',
    stream: 'HEX/WS',
    city: 'Miami',
    coords: [25.7617, -80.1918],
    urgency: 63,
    signal: 79,
    pains: ['Credential spray indicators', 'High-value travel window', 'Supplier handoff ambiguity'],
    influencers: ['Travel telemetry', 'MFA logs', 'Vendor access ledger'],
    entry: 'Trigger identity hardening workflow and notify trusted security contacts.',
  },
  {
    id: 'SHD-FE31',
    source: 'shadow',
    stream: 'HEX/WS',
    city: 'Chicago',
    coords: [41.8781, -87.6298],
    urgency: 88,
    signal: 87,
    pains: ['Data egress bursts', 'Influencer account impersonation', 'Legal-response latency'],
    influencers: ['DLP sensors', 'Brand monitoring', 'Counsel notification queue'],
    entry: 'Escalate to breach-response owners with source confidence and containment scope.',
  },
];

function useLivePoints(mode) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((value) => value + 1), 1400);
    return () => clearInterval(timer);
  }, []);

  return useMemo(() => {
    const base = mode === 'public' ? PUBLIC_POINTS : mode === 'shadow' ? SHADOW_POINTS : [...PUBLIC_POINTS, ...SHADOW_POINTS];
    return base.map((point, index) => ({
      ...point,
      urgency: Math.max(0, Math.min(100, point.urgency + Math.round(Math.sin((tick + index) / 2) * 6))),
      coords: [point.coords[0] + Math.sin(tick / 5 + index) * 0.08, point.coords[1] + Math.cos(tick / 6 + index) * 0.1],
    }));
  }, [mode, tick]);
}

function NexusMap({ points, selectedId, onSelect }) {
  const mapRef = useRef(null);

  useEffect(() => {
    const map = L.map('nexus-map', { zoomControl: false, attributionControl: false }).setView([39.5, -98.35], 4);
    mapRef.current = map;
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 18 }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layer = L.layerGroup().addTo(map);
    points.forEach((point) => {
      const intensity = point.urgency / 100;
      const selected = selectedId === point.id;
      const marker = L.circleMarker(point.coords, {
        radius: 9 + intensity * 16,
        color: selected ? '#d9fff0' : '#00ff94',
        fillColor: point.source === 'shadow' ? '#00f0ff' : '#00ff94',
        fillOpacity: 0.28 + intensity * 0.42,
        opacity: 0.75 + intensity * 0.25,
        weight: selected ? 3 : 1.5,
        className: `pulse-marker urgency-${Math.ceil(point.urgency / 20)}`,
      });
      marker.bindTooltip(`${point.id} / ${point.city} / ${point.urgency}`, { direction: 'top', opacity: 0.9 });
      marker.on('click', () => onSelect(point));
      marker.addTo(layer);
    });
    return () => layer.remove();
  }, [points, selectedId, onSelect]);

  return <div id="nexus-map" className="map-shell" />;
}

function App() {
  const [mode, setMode] = useState('all');
  const points = useLivePoints(mode);
  const [selected, setSelected] = useState(null);
  const active = selected && points.find((point) => point.id === selected.id) ? points.find((point) => point.id === selected.id) : points[0];
  const shadowCount = points.filter((point) => point.source === 'shadow').length;

  return (
    <main className="app-frame">
      <section className="command-bar">
        <div>
          <p className="eyebrow">Sentinel-Nexus Interface</p>
          <h1>Asynchronous Signal Theater</h1>
        </div>
        <div className="status-grid">
          <span>Latency: 17ms</span>
          <span>Streams: {points.length}</span>
          <span>Shadow: {shadowCount}</span>
        </div>
      </section>

      <section className="dashboard-grid">
        <aside className="filter-panel">
          <h2>Signal-to-Noise Filter</h2>
          {['all', 'public', 'shadow'].map((option) => (
            <button key={option} className={mode === option ? 'active' : ''} onClick={() => setMode(option)}>
              {option === 'all' ? 'Fusion View' : option === 'public' ? 'Public Data' : 'Shadow Data'}
            </button>
          ))}
          <div className="decoder-card">
            <span>Decoder</span>
            <strong>{mode === 'shadow' ? 'HEX / encrypted WS' : mode === 'public' ? 'JSON / API' : 'JSON + HEX fusion'}</strong>
          </div>
        </aside>

        <NexusMap points={points} selectedId={active?.id} onSelect={setSelected} />

        <aside className="profile-panel">
          <p className="eyebrow">Target Profile Slide-Out</p>
          <h2>{active?.id} · {active?.city}</h2>
          <div className="urgency-meter"><span style={{ width: `${active?.urgency || 0}%` }} /></div>
          <strong className="urgency-label">Urgency Value {active?.urgency}/100</strong>
          <h3>Vulnerability Profile</h3>
          <ul>{active?.pains.map((pain) => <li key={pain}>{pain}</li>)}</ul>
          <h3>Connected Influencers</h3>
          <div className="chips">{active?.influencers.map((influencer) => <span key={influencer}>{influencer}</span>)}</div>
          <h3>Suggested Entry Point</h3>
          <p className="entry-point">{active?.entry}</p>
        </aside>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
