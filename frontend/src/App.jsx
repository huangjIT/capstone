import SignupForm from './components/SignupForm'
import LoginForm from './components/LoginForm'
import './App.css'

function App() {
  return (
    <main className="auth-page">
      <header className="auth-header">
        <h1 className="auth-h1">Pet Social</h1>
        <p className="auth-subtitle">Register or log in to continue.</p>
      </header>

      <section className="auth-grid" aria-label="Authentication">
        <div className="auth-card">
          <SignupForm />
        </div>
        <div className="auth-card">
          <LoginForm />
        </div>
      </section>
    </main>
  )
}

export default App
