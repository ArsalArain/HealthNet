import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveLocation } from '../hooks/useLiveLocation'
import { getAuthUser, clearAuthSession } from '../utils/authStorage'
import { toast } from 'react-toastify'
import '../styles/NearestHospital.css'

// Haversine in meters for frontend re-fetch logic
function metersApart(lat1, lng1, lat2, lng2) {
  const R    = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── MAIN PAGE ───────────────────────────────────────────────
export default function NearestHospital({ embed = false }) {
  const { location, startTracking } = useLiveLocation()
  const navigate = useNavigate()
  const user = getAuthUser()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  const [hospitals,        setHospitals]        = useState([])
  const [loading,          setLoading]          = useState(false)
  const [filters,          setFilters]          = useState({
    emergency: false, specialty: '', limit: 5
  })
  const [selectedHospital, setSelectedHospital] = useState(null)
  const [liveResources,    setLiveResources]    = useState(null)
  const [loadingResources, setLoadingResources] = useState(false)
  const [lastFetched,      setLastFetched]      = useState(null)
  const [moveCount,        setMoveCount]        = useState(0)

  const lastFetchLat = useRef(null)
  const lastFetchLng = useRef(null)
  const fetchTimer   = useRef(null)

  // Re-fetch hospitals every 1 meter of movement
  // OR every 5 seconds even if standing still
  const MIN_MOVE_M   = 1       // 1 meter triggers re-fetch
  const MAX_INTERVAL = 5000    // 5 second fallback refresh

  // ── Fetch hospitals ─────────────────────────────────────
  const fetchHospitals = useCallback(async (lat, lng, silent = false) => {
    if (!lat || !lng) return
    if (!silent) setLoading(true)
    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        limit: String(filters.limit),
        ...(filters.emergency && { emergency: 'true' }),
        ...(filters.specialty && { specialty: filters.specialty })
      })
      const flaskHost = window.location.hostname || 'localhost'
      const res  = await fetch(
        `http://${flaskHost}:5002/api/hospitals/nearest?${params}`
      )
      const data = await res.json()
      if (data.success) {
        setHospitals(data.hospitals)
        setLastFetched(new Date())
        lastFetchLat.current = lat
        lastFetchLng.current = lng
      }
    } catch (e) {
      console.error('Fetch hospitals failed:', e)
    }
    if (!silent) setLoading(false)
  }, [filters])

  // ── Re-fetch on every 1 meter movement ──────────────────
  useEffect(() => {
    if (location.status !== 'granted' || !location.lat) return

    const moved =
      lastFetchLat.current === null ||
      metersApart(
        lastFetchLat.current, lastFetchLng.current,
        location.lat, location.lng
      ) >= MIN_MOVE_M

    clearTimeout(fetchTimer.current)

    if (moved) {
      // Patient moved 1+ meter — fetch immediately
      setMoveCount(c => c + 1)
      fetchHospitals(location.lat, location.lng)
    } else {
      // Standing still — refresh every 5 seconds anyway
      fetchTimer.current = setTimeout(() => {
        fetchHospitals(location.lat, location.lng)
      }, MAX_INTERVAL)
    }

    return () => clearTimeout(fetchTimer.current)
  }, [location.lat, location.lng, location.status, fetchHospitals])

  // ── Fetch live resources ─────────────────────────────────
  const fetchLiveResources = async (hospitalId, silent = false) => {
    if (!silent) {
      setLoadingResources(true)
      setLiveResources(null)
    }
    try {
      const flaskHost = window.location.hostname || 'localhost'
      const res  = await fetch(
        `http://${flaskHost}:5002/api/hospitals/${hospitalId}/resources/live`
      )
      const data = await res.json()
      if (data.success) setLiveResources(data.resources)
    } catch (e) {
      console.error('Fetch resources failed:', e)
    }
    if (!silent) {
      setLoadingResources(false)
    }
  }

  const handleRefresh = async () => {
    try {
      const promises = []
      if (location.lat && location.lng) {
        promises.push(fetchHospitals(location.lat, location.lng, true))
      }
      if (selectedHospital) {
        promises.push(fetchLiveResources(selectedHospital._id, true))
      }
      if (promises.length > 0) {
        await Promise.all(promises)
      }
      toast.success('Hospitals and resources refreshed.')
    } catch (e) {
      toast.error('Failed to refresh data.')
    }
  }

  const handleSelectHospital = (hospital) => {
    setSelectedHospital(hospital)
    fetchLiveResources(hospital._id)
  }

  const content = (
    <div className="nh-page" style={{ height: '100%', minHeight: 'calc(100vh - 120px)' }}>
      {/* LOCATION STATUS BAR */}
      <LocationStatusBar location={location} onRetry={startTracking} />

      {/* FILTER BAR */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        onApply={() => fetchHospitals(location.lat, location.lng)}
      />

      {/* MAIN CONTENT */}
      {location.status === 'unsupported' ? (
        <UnsupportedScreen />
      ) : location.status === 'denied' ? (
        <LocationDeniedScreen onRetry={startTracking} />
      ) : location.status === 'pending' ? (
        <LocationLoadingScreen />
      ) : (
        <div className={`nh-grid ${selectedHospital ? 'with-panel' : ''}`}>
          {/* Hospital list */}
          <div className="nh-list">
            {loading && hospitals.length === 0 ? (
              <LoadingSkeletons count={3} />
            ) : hospitals.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                {loading && (
                  <div className="nh-refreshing">
                    <span className="loading-spin" /> Updating...
                  </div>
                )}
                {hospitals.map((hospital, index) => (
                  <HospitalCard
                    key={hospital._id}
                    hospital={hospital}
                    index={index}
                    isSelected={selectedHospital?._id === hospital._id}
                    onSelect={() => handleSelectHospital(hospital)}
                  />
                ))}
              </>
            )}
          </div>

          {/* Detail panel */}
          {selectedHospital && (
            <HospitalDetailPanel
              hospital={selectedHospital}
              resources={liveResources}
              loading={loadingResources}
              onClose={() => {
                setSelectedHospital(null)
                setLiveResources(null)
              }}
            />
          )}
        </div>
      )}
    </div>
  );

  if (embed) {
    return content;
  }

  return (
    <div className="hn-shell">
      {/* SIDEBAR */}
      <aside className={`hn-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        {sidebarOpen && (
          <>
            <div className="hn-brand">
              <h2>HealthNet</h2>
              <p>Patient Portal</p>
              <p className="hn-brand-user">
                {user?.username || 'Patient'}
              </p>
            </div>

            <nav className="hn-nav">
              <button
                type="button"
                className="hn-nav-btn"
                onClick={() => navigate('/patient/profile?section=profile')}
              >
                <span className="hn-nav-icon">👤</span>
                <span className="hn-nav-label">Profile</span>
              </button>
              <button
                type="button"
                className="hn-nav-btn"
                onClick={() => navigate('/patient/profile?section=booking')}
              >
                <span className="hn-nav-icon">📅</span>
                <span className="hn-nav-label">Smart Booking</span>
              </button>
              <button
                type="button"
                className="hn-nav-btn active"
                onClick={() => navigate('/nearest-hospitals')}
              >
                <span className="hn-nav-icon">📍</span>
                <span className="hn-nav-label">Nearest Hospitals</span>
              </button>
              <button
                type="button"
                className="hn-nav-btn"
                onClick={() => navigate('/patient/profile?section=search')}
              >
                <span className="hn-nav-icon">🔍</span>
                <span className="hn-nav-label">Find Doctors/Hospitals</span>
              </button>
              <button
                type="button"
                className="hn-nav-btn"
                onClick={() => navigate('/patient/profile?section=appointments')}
              >
                <span className="hn-nav-icon">🏥</span>
                <span className="hn-nav-label">Appointments</span>
              </button>
              <button
                type="button"
                className="hn-nav-btn"
                onClick={() => navigate('/patient/profile?section=settings')}
              >
                <span className="hn-nav-icon">⚙️</span>
                <span className="hn-nav-label">Settings</span>
              </button>
            </nav>

            <div className="hn-logout-wrap">
              <button onClick={handleLogout} className="hn-logout-btn">
                🚪 Logout
              </button>
            </div>
          </>
        )}
      </aside>

      {/* MAIN CONTENT */}
      <main className="hn-main">
        {/* TOP BAR */}
        <header className="hn-topbar">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hn-sidebar-toggle"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
          <h1 className="hn-title">Nearest Hospitals</h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              className="hn-sidebar-toggle"
              onClick={handleRefresh}
              aria-label="Refresh page"
              title="Refresh page"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ verticalAlign: "middle" }}
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
            </button>
            <button
              type="button"
              className="btn-primary"
              style={{
                backgroundColor: '#f97316',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
              onClick={() => navigate('/patient/profile?section=booking')}
            >
              Book Appointment
            </button>
            <div className="hn-date-pill">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <section className="hn-content-area" style={{ padding: 0 }}>
          {content}
        </section>
      </main>
    </div>
  );
}

// ── LOCATION STATUS BAR ────────────────────────────────────
function LocationStatusBar({ location, onRetry }) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (location.status !== 'granted') return
    const id = setInterval(() => setTick(t => t + 1), 2000)
    return () => clearInterval(id)
  }, [location.status])

  return (
    <div className={`nh-location-bar status-${location.status}`}>

      {location.status === 'granted' && (
        <>
          <span className="live-dot" />
          <div className="location-info">
            <strong>🟢 Live GPS Active — tracking every 1 meter</strong>
            <span>
              Accuracy: ±{location.accuracy}m &nbsp;·&nbsp;
              Lat: {location.lat?.toFixed(6)} &nbsp;
              Lng: {location.lng?.toFixed(6)} &nbsp;·&nbsp;
              Updated: {location.lastUpdated?.toLocaleTimeString()}
            </span>
          </div>
        </>
      )}

      {location.status === 'pending' && (
        <>
          <span className="pending-dot" />
          <strong>⏳ Getting your GPS location...</strong>
        </>
      )}

      {location.status === 'denied' && (
        <>
          <span>🔴</span>
          <div className="location-info">
            <strong>Location access denied</strong>
            <span>{location.error}</span>
          </div>
          <button className="btn-retry" onClick={onRetry}>
            📍 Enable Location
          </button>
        </>
      )}

      {location.status === 'unsupported' && (
        <>
          <span>⚪</span>
          <strong>GPS not supported on this device</strong>
        </>
      )}
    </div>
  )
}

// ── FILTER BAR ─────────────────────────────────────────────
function FilterBar({ filters, onChange, onApply }) {
  const specialties = [
    'General Physician','Cardiologist','Neurologist',
    'Pulmonologist','Orthopedic Surgeon','Gynecologist',
    'Pediatrician','Urologist','Dermatologist',
    'ENT Specialist','Ophthalmologist','Psychiatrist',
    'General Surgeon','Endocrinologist'
  ]

  return (
    <div className="nh-filters">
      <select
        value={filters.specialty}
        onChange={e => onChange(f => ({ ...f, specialty: e.target.value }))}
      >
        <option value="">All Specialties</option>
        {specialties.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <label className="filter-check">
        <input
          type="checkbox"
          checked={filters.emergency}
          onChange={e => onChange(f => ({
            ...f, emergency: e.target.checked
          }))}
        />
        🚨 Emergency Only
      </label>

      <select
        value={filters.limit}
        onChange={e => onChange(f => ({
          ...f, limit: parseInt(e.target.value)
        }))}
      >
        <option value={3}>Show 3</option>
        <option value={5}>Show 5</option>
        <option value={10}>Show 10</option>
        <option value={31}>Show All 31</option>
      </select>

      <button className="btn-search" onClick={onApply}>
        🔍 Search
      </button>
    </div>
  )
}

// ── HOSPITAL CARD ──────────────────────────────────────────
function HospitalCard({ hospital, index, isSelected, onSelect }) {
  const km = hospital.distance_km
  const distColor =
    km < 2  ? '#22c55e' :
    km < 5  ? '#f59e0b' :
    km < 15 ? '#f97316' : '#ef4444'

  const resPct = hospital.resource_summary?.availability_percent || 0

  return (
    <div
      className={[
        'nh-card',
        isSelected  ? 'selected' : '',
        index === 0 ? 'nearest'  : ''
      ].filter(Boolean).join(' ')}
      onClick={onSelect}
    >
      {/* Badges */}
      <div className="card-badges">
        <span className="rank-badge">#{hospital.rank}</span>
        {index === 0 && (
          <span className="badge-nearest">🏆 Nearest</span>
        )}
        {hospital.emergency && (
          <span className="badge-er">🚨 24/7 ER</span>
        )}
        {hospital.resource_summary?.critical_alerts > 0 && (
          <span className="badge-alert">
            ⚠️ {hospital.resource_summary.critical_alerts} alerts
          </span>
        )}
      </div>

      {/* Info */}
      <h3 className="card-name">{hospital.name}</h3>
      <p className="card-meta">{hospital.type} · {hospital.city}</p>
      <p className="card-address">📌 {hospital.address}</p>
      <p className="card-phone">📞 {hospital.phone || '041-XXXXXXX'}</p>

      {/* Distance */}
      <div className="distance-block" style={{ borderColor: distColor }}>
        <span className="dist-km" style={{ color: distColor }}>
          {hospital.distance_label}
        </span>
        <span className="dist-drive">🚗 {hospital.estimated_drive}</span>
      </div>

      {/* Resource bar */}
      <div className="res-bar-wrap">
        <span>Resources: {resPct}% available</span>
        <div className="res-bar-track">
          <div
            className="res-bar-fill"
            style={{
              width:      `${resPct}%`,
              background: resPct > 70 ? '#22c55e' :
                          resPct > 40 ? '#f59e0b' : '#ef4444'
            }}
          />
        </div>
      </div>

      {/* Emergency quick chips */}
      <div className="er-quick">
        {Object.entries(hospital.emergency_resources || {}).map(
          ([name, status]) => (
            <span
              key={name}
              className={`er-chip ${status.available ? 'ok' : 'no'}`}
              title={`${name}: ${status.units} available`}
            >
              {status.available ? '✅' : '❌'} {name.split(' ')[0]}
            </span>
          )
        )}
      </div>

      {/* Actions */}
      <div className="card-actions">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`}
          target="_blank"
          rel="noreferrer"
          className="btn-dir"
          onClick={e => e.stopPropagation()}
        >
          🗺️ Directions
        </a>
        <a
          href={`tel:${hospital.phone}`}
          className="btn-call"
          onClick={e => e.stopPropagation()}
        >
          📞 Call
        </a>
        <button className="btn-res" onClick={onSelect}>
          📋 Resources
        </button>
      </div>
    </div>
  )
}

// ── HOSPITAL DETAIL PANEL ──────────────────────────────────
function HospitalDetailPanel({ hospital, resources, loading, onClose }) {
  const [activeTab, setActiveTab] = useState('All')
  const tabs = ['All','Test','Specialist','Equipment','Medicine','Ward']

  const filtered =
    activeTab === 'All'
      ? Object.values(resources || {}).flat()
      : (resources?.[activeTab] || [])

  const statusIcon = s =>
    s === 'Out Of Stock' ? '🔴' :
    s === 'Maintenance'  ? '🔧' :
    s === 'Low Stock'    ? '🟡' : '🟢'

  return (
    <div className="nh-panel">

      {/* Header */}
      <div className="panel-head">
        <div>
          <h2>{hospital.name}</h2>
          <p>{hospital.distance_label} · {hospital.estimated_drive}</p>
        </div>
        <button className="btn-close" onClick={onClose}>✕</button>
      </div>

      {/* Actions */}
      <div className="panel-actions">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`}
          target="_blank"
          rel="noreferrer"
          className="btn-primary"
        >
          🗺️ Get Directions
        </a>
        <a href={`tel:${hospital.phone}`} className="btn-secondary">
          📞 {hospital.phone || '041-XXXXXXX'}
        </a>
      </div>

      {/* Info */}
      <div className="panel-info">
        <p>🏥 {hospital.type}</p>
        <p>📌 {hospital.address}</p>
        <p>🏙️ {hospital.city}</p>
      </div>

      {/* Specialties */}
      <div className="panel-specialties">
        {(hospital.specialties || []).map(s => (
          <span key={s} className="spec-chip">{s}</span>
        ))}
      </div>

      {/* Tabs */}
      <div className="panel-tabs">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Resources */}
      <div className="panel-resources">
        {loading ? (
          <div className="res-loading">
            <span className="loading-spin" /> Loading live resources...
          </div>
        ) : filtered.length === 0 ? (
          <p className="res-empty">No resources in this category.</p>
        ) : (
          filtered.map((r, i) => (
            <div
              key={i}
              className={`res-row ${r.available ? 'available' : 'unavailable'}`}
            >
              <span className="res-icon">{statusIcon(r.status)}</span>
              <span className="res-name">{r.name}</span>
              <span className="res-units">{r.units}/{r.total}</span>
              <span className="res-hours">{r.hours}</span>
              <span className={`res-badge badge-${r.status.toLowerCase().replace(/ /g,'-')}`}>
                {r.status}
              </span>
            </div>
          ))
        )}
      </div>

      <p className="panel-footer">
        🕐 Live data · {new Date().toLocaleTimeString()}
      </p>
    </div>
  )
}

// ── SUPPORTING SCREENS ─────────────────────────────────────
function LocationDeniedScreen({ onRetry }) {
  return (
    <div className="nh-screen">
      <span className="screen-icon">📍</span>
      <h2>Location Access Required</h2>
      <p>HealthNet needs GPS to find the nearest hospitals.</p>
      <ol className="screen-steps">
        <li>Click the 🔒 lock icon in your browser address bar</li>
        <li>Set Location to <strong>Allow</strong></li>
        <li>Refresh the page</li>
      </ol>
      <button className="btn-primary-screen" onClick={onRetry}>
        📍 Try Again
      </button>
      <p className="screen-note">
        Or use <a href="/patient/profile">Symptom Checker</a> with
        your city name instead.
      </p>
    </div>
  )
}

// Location Loading Screen
function LocationLoadingScreen() {
  return (
    <div className="nh-screen">
      <div className="pulse-ring" />
      <h2>Finding your GPS location...</h2>
      <p>Please allow location access when your browser asks.</p>
      <p className="screen-note">Make sure GPS is enabled on your device.</p>
    </div>
  )
}

// Unsupported Screen
function UnsupportedScreen() {
  return (
    <div className="nh-screen">
      <span className="screen-icon">⚪</span>
      <h2>GPS Not Supported</h2>
      <p>Your browser does not support location services.</p>
      <p>
        Please use the <a href="/patient/profile">Symptom Checker</a> and
        type your city name.
      </p>
    </div>
  )
}

// Empty State
function EmptyState() {
  return (
    <div className="nh-screen">
      <span className="screen-icon">🏥</span>
      <h2>No Hospitals Found</h2>
      <p>Try removing filters or expanding your search.</p>
    </div>
  )
}

// Loading Skeletons
function LoadingSkeletons({ count }) {
  return Array(count).fill(0).map((_, i) => (
    <div key={i} className="nh-skeleton">
      <div className="skel-line wide"   />
      <div className="skel-line medium" />
      <div className="skel-line short"  />
      <div className="skel-line medium" />
    </div>
  ))
}
