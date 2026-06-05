import './LandingPage.css'
import PawMap from '../components/PawMap'

/* ─── Data ─────────────────────────────────────────────────────────────── */
const features = [
  {
    id: 'walking',
    icon: '🚶',
    iconBg: '#e0f6e8',
    badge: 'Location-Based',
    badgeColor: '#f97316',
    badgeBg: '#ffefea',
    title: 'Walking Partner Matching',
    desc: 'Use your location to find nearby pet owners looking for walking companions. Filter by pet type, size, and availability.',
    linkColor: '#ff6b35',
    borderColor: 'rgba(16,185,129,0.25)',
    shadow: '0px 8px 24px 0px rgba(16,185,129,0.12)',
  },
  {
    id: 'blind-date',
    icon: '💕',
    iconBg: '#f2edff',
    badge: 'Smart Matching',
    badgeColor: '#8d5ce5',
    badgeBg: '#f2ecff',
    title: 'Pet Blind Date',
    desc: 'Help your furry friend find their perfect companion. Post mating requests and browse compatible matches nearby.',
    linkColor: '#8d5ce5',
    borderColor: 'rgba(141,92,229,0.25)',
    shadow: '0px 8px 24px 0px rgba(141,92,229,0.12)',
  },
  {
    id: 'health',
    icon: '🏥',
    iconBg: '#e0f6ff',
    badge: 'Health Management',
    badgeColor: '#2ec4b6',
    badgeBg: '#e0f8f5',
    title: 'Pet Health Records',
    desc: 'Keep all vaccine records, vet visits, and health checkups organized. Never miss an important appointment again.',
    linkColor: '#2ec4b6',
    borderColor: 'rgba(46,196,182,0.25)',
    shadow: '0px 8px 24px 0px rgba(46,196,182,0.12)',
  },
  {
    id: 'marketplace',
    icon: '🛍️',
    iconBg: '#fff5d9',
    badge: 'Community Trading',
    badgeColor: '#d9a500',
    badgeBg: '#fff8df',
    title: 'Second-Hand Marketplace',
    desc: 'Buy and sell pre-loved pet supplies within your community. Reduce waste and save money on quality pet items.',
    linkColor: '#d9a500',
    borderColor: 'rgba(217,165,0,0.25)',
    shadow: '0px 8px 24px 0px rgba(217,165,0,0.12)',
  },
]

const steps = [
  {
    num: '01',
    icon: '👤',
    title: 'Create Your Profile',
    desc: 'Sign up and create profiles for you and your pet. Add photos, breed info, and personality traits.',
    borderColor: 'rgba(249,115,22,0.15)',
    shadow: '0px 8px 24px 0px rgba(249,115,22,0.12)',
  },
  {
    num: '02',
    icon: '📍',
    title: 'Enable Location',
    desc: 'Allow location access to see nearby pet owners. Your privacy is protected — only approximate location is shared.',
    borderColor: 'rgba(46,196,182,0.15)',
    shadow: '0px 8px 24px 0px rgba(46,196,182,0.12)',
  },
  {
    num: '03',
    icon: '🤝',
    title: 'Connect & Enjoy',
    desc: 'Match with walking partners, find playmates, manage health records, and explore the marketplace.',
    borderColor: 'rgba(141,92,229,0.15)',
    shadow: '0px 8px 24px 0px rgba(141,92,229,0.12)',
  },
]

const nearbyPets = [
  { name: 'Max', dist: '0.3 km', emoji: '🐕' },
  { name: 'Luna', dist: '0.8 km', emoji: '🐶' },
  { name: 'Buddy', dist: '1.2 km', emoji: '🦮' },
  { name: 'Mochi', dist: '1.5 km', emoji: '🐩' },
]

/* ─── Components ────────────────────────────────────────────────────────── */
function Navbar() {
  return (
    <nav className="lp-navbar">
      <div className="lp-logo">
        <span className="lp-logo-circle">🐾</span>
        <span className="lp-logo-text">PawPal</span>
      </div>

      <ul className="lp-nav-links">
        <li><a href="#">Find Walking Partners</a></li>
        <li><a href="#">Pet Blind Date</a></li>
        <li><a href="#">Marketplace</a></li>
        <li><a href="#">Pet Health</a></li>
      </ul>

      <div className="lp-nav-cta">
        <a href="#" className="lp-btn-outline">Log In</a>
        <a href="#" className="lp-btn-primary lp-btn-pill">Get Started</a>
      </div>
    </nav>
  )
}

function HeroSection() {
  return (
    <section className="lp-hero">
      <div className="lp-hero-left">
        <span className="lp-badge">🐾&nbsp;&nbsp;Pet Social Companion App</span>

        <h1 className="lp-hero-heading">
          Connect, Walk &<br />
          Care for Your<br />
          Pet Together
        </h1>

        <p className="lp-hero-desc">
          Find nearby walking partners, match your pet for companionship, manage
          health records, and trade pet supplies — all in one place.
        </p>

        <div className="lp-hero-cta">
          <a href="#" className="lp-btn-primary lp-btn-pill lp-btn-lg">Start for Free →</a>
          <a href="#" className="lp-btn-secondary lp-btn-pill lp-btn-lg">▶&nbsp; Watch Demo</a>
        </div>

        <div className="lp-stats">
          <div className="lp-stat">
            <span className="lp-stat-num">10K+</span>
            <span className="lp-stat-label">Pet Owners</span>
          </div>
          <div className="lp-stat-divider" />
          <div className="lp-stat">
            <span className="lp-stat-num">5K+</span>
            <span className="lp-stat-label">Walks Matched</span>
          </div>
          <div className="lp-stat-divider" />
          <div className="lp-stat">
            <span className="lp-stat-num">4.9★</span>
            <span className="lp-stat-label">App Rating</span>
          </div>
        </div>
      </div>

      <div className="lp-hero-illustration">
        {/* Live Google Map with geolocation */}
        <PawMap />

        {/* Pet cards below the map */}
        <div className="lp-pet-cards">
          {nearbyPets.map(pet => (
            <div className="lp-pet-card" key={pet.name}>
              <div className="lp-pet-avatar">{pet.emoji}</div>
              <span className="lp-pet-name">{pet.name}</span>
              <span className="lp-pet-dist">📍 {pet.dist}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  return (
    <section className="lp-features">
      <div className="lp-section-header">
        <p className="lp-section-label">FEATURES</p>
        <h2 className="lp-section-title">
          Everything Your Pet Needs<br />in One Place
        </h2>
        <p className="lp-section-desc">
          From walking partners to health records, PawPal covers every aspect of pet ownership.
        </p>
      </div>

      <div className="lp-cards-grid">
        {features.map(f => (
          <div
            key={f.id}
            className="lp-feature-card"
            style={{
              border: `2px solid ${f.borderColor}`,
              boxShadow: `0px 2px 6px rgba(0,0,0,0.04), ${f.shadow}`,
            }}
          >
            <div className="lp-feature-icon" style={{ background: f.iconBg }}>
              {f.icon}
            </div>
            <span
              className="lp-feature-badge"
              style={{ color: f.badgeColor, background: f.badgeBg }}
            >
              {f.badge}
            </span>
            <h3 className="lp-feature-title">{f.title}</h3>
            <p className="lp-feature-desc">{f.desc}</p>
            <a href="#" className="lp-feature-link" style={{ color: f.linkColor }}>
              Learn more →
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}

function HowItWorksSection() {
  return (
    <section className="lp-how">
      <h2 className="lp-how-title">Get Started in 3 Simple Steps</h2>
      <div className="lp-steps-row">
        {steps.map(s => (
          <div
            key={s.num}
            className="lp-step-card"
            style={{
              border: `2px solid ${s.borderColor}`,
              boxShadow: `0px 2px 6px rgba(0,0,0,0.04), ${s.shadow}`,
            }}
          >
            <span className="lp-step-num">{s.num}</span>
            <span className="lp-step-icon">{s.icon}</span>
            <h3 className="lp-step-title">{s.title}</h3>
            <p className="lp-step-desc">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function CTABanner() {
  return (
    <section className="lp-cta-banner">
      <h2 className="lp-cta-title">Ready to Find Your Pet's New Best Friend?</h2>
      <p className="lp-cta-desc">
        Join thousands of happy pet owners. Free to use, no credit card required.
      </p>
      <a href="#" className="lp-cta-btn">Join PawPal for Free →</a>
    </section>
  )
}

function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-brand">
        <p className="lp-footer-logo">🐾 PawPal</p>
        <p className="lp-footer-tagline">
          Your pet's social companion.<br />
          Connect, walk, and care together.
        </p>
      </div>

      <div className="lp-footer-links">
        <div className="lp-footer-col">
          <p className="lp-footer-col-title">Features</p>
          <a href="#">Walking Partners</a>
          <a href="#">Pet Blind Date</a>
          <a href="#">Health Records</a>
          <a href="#">Marketplace</a>
        </div>
        <div className="lp-footer-col">
          <p className="lp-footer-col-title">Company</p>
          <a href="#">About Us</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact</a>
        </div>
      </div>
    </footer>
  )
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="lp-root">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTABanner />
      <Footer />
    </div>
  )
}
