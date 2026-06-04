import { useEffect, useMemo, useState } from 'react'

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
}

export default function SignupForm() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [latitude, setLatitude] = useState(null)
  const [longitude, setLongitude] = useState(null)
  const [locationError, setLocationError] = useState('')

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLatitude(null)
      setLongitude(null)
      setLocationError('Geolocation is not supported by this browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude)
        setLongitude(position.coords.longitude)
        setLocationError('')
      },
      (error) => {
        setLatitude(null)
        setLongitude(null)
        setLocationError(error?.message || 'Location permission denied.')
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 0,
      },
    )
  }, [])

  const locationValue = useMemo(() => {
    if (latitude == null || longitude == null) return ''
    return `${latitude}, ${longitude}`
  }, [latitude, longitude])

  function onChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function onSubmit(event) {
    event.preventDefault()

    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
      latitude,
      longitude,
    }

    // No backend integration in this sprint — log the payload for now.
    // Example payload shape expected by backend:
    // {
    //   name: "John Doe",
    //   email: "johndoe@example.com",
    //   password: "SecurePassword123!",
    //   latitude: 43.4516,
    //   longitude: -80.4925
    // }
    console.log('Signup payload:', payload)
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <h2 className="auth-title">Sign up</h2>

      <label className="auth-label">
        Name
        <input
          className="auth-input"
          name="name"
          type="text"
          value={form.name}
          onChange={onChange}
          autoComplete="name"
          required
        />
      </label>

      <label className="auth-label">
        Email
        <input
          className="auth-input"
          name="email"
          type="email"
          value={form.email}
          onChange={onChange}
          autoComplete="email"
          required
        />
      </label>

      <label className="auth-label">
        Password
        <input
          className="auth-input"
          name="password"
          type="password"
          value={form.password}
          onChange={onChange}
          autoComplete="new-password"
          required
        />
      </label>

      <label className="auth-label">
        Location
        <input
          className="auth-input"
          name="location"
          type="text"
          value={locationValue}
          readOnly
          placeholder={
            locationError
              ? 'Location unavailable (permission denied)'
              : 'Fetching your location…'
          }
          aria-describedby="signup-location-help"
        />
      </label>

      <p id="signup-location-help" className="auth-help">
        {latitude != null && longitude != null
          ? 'Location captured automatically.'
          : locationError
            ? `Continuing without location. (${locationError})`
            : 'We’ll try to capture your location automatically.'}
      </p>

      <button className="auth-button" type="submit">
        Create account
      </button>
    </form>
  )
}
