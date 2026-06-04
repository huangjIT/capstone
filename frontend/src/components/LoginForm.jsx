import { useState } from 'react'

const INITIAL_FORM = {
  email: '',
  password: '',
}

export default function LoginForm() {
  const [form, setForm] = useState(INITIAL_FORM)

  function onChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function onSubmit(event) {
    event.preventDefault()

    const payload = {
      email: form.email,
      password: form.password,
    }

    // No backend integration in this sprint — log the payload for now.
    console.log('Login payload:', payload)
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <h2 className="auth-title">Log in</h2>

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
          autoComplete="current-password"
          required
        />
      </label>

      <button className="auth-button" type="submit">
        Log in
      </button>
    </form>
  )
}
