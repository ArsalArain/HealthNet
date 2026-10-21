import { useState, useEffect, useRef, useCallback } from 'react'

export function useLiveLocation() {
  const [location, setLocation] = useState({
    lat:         null,
    lng:         null,
    accuracy:    null,
    status:      'pending',
    error:       null,
    lastUpdated: null
  })

  const watchId      = useRef(null)
  const lastLat      = useRef(null)
  const lastLng      = useRef(null)
  const MIN_CHANGE_M = 1      // update state if moved just 1 meter

  // Haversine in meters
  const metersApart = (lat1, lng1, lat2, lng2) => {
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

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({ ...prev, status: 'unsupported' }))
      return
    }

    setLocation(prev => ({ ...prev, status: 'pending' }))

    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current)
    }

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newLat = pos.coords.latitude
        const newLng = pos.coords.longitude

        // Update if first reading OR moved 1+ meter
        if (
          lastLat.current === null ||
          metersApart(
            lastLat.current, lastLng.current,
            newLat, newLng
          ) >= MIN_CHANGE_M
        ) {
          lastLat.current = newLat
          lastLng.current = newLng

          setLocation({
            lat:         newLat,
            lng:         newLng,
            accuracy:    Math.round(pos.coords.accuracy),
            status:      'granted',
            error:       null,
            lastUpdated: new Date()
          })
        }
      },
      (err) => {
        const messages = {
          1: 'Location permission denied. Please allow location access.',
          2: 'Location unavailable. Check your GPS.',
          3: 'Location timed out. Retrying...'
        }
        setLocation(prev => ({
          ...prev,
          status: 'denied',
          error:  messages[err.code] || 'Unknown error'
        }))
      },
      {
        enableHighAccuracy: true,   // use GPS chip not WiFi
        timeout:            5000,   // 5 second timeout per reading
        maximumAge:         2000    // accept readings up to 2s old
      }
    )
  }, [])

  const stopTracking = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
  }, [])

  useEffect(() => {
    startTracking()
    return () => stopTracking()
  }, [])

  return { location, startTracking, stopTracking }
}
