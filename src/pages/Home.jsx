import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="app">
      <section className="hero">
        <p className="hero-eyebrow">Design System</p>
        <h1 className="hero-title">
          Build with <span className="gold">Golden.</span>
        </h1>
        <p className="hero-sub">
          A unified visual language for building consistent,
          accessible, and beautiful products.
        </p>
        <div className="hero-actions">
          <button className="btn-primary" onClick={() => navigate('/colors')}>Get Started →</button>
          <button className="btn-secondary" onClick={() => navigate('/components')}>View Components</button>
        </div>
      </section>

      <div className="stats">
        <div className="stat"><span className="stat-num">5</span><span className="stat-label">Color Scales</span></div>
        <div className="stat"><span className="stat-num">9</span><span className="stat-label">Type Styles</span></div>
        <div className="stat"><span className="stat-num">4+</span><span className="stat-label">Components</span></div>
        <div className="stat"><span className="stat-num">∞</span><span className="stat-label">Possibilities</span></div>
      </div>
    </div>
  )
}
