import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { label: 'Colors', to: '/colors' },
  { label: 'Typography', to: '/typography' },
  { label: 'Components', to: '/components' },
]

export default function Layout() {
  return (
    <div className="layout">
      <nav className="nav">
        <NavLink to="/" className="nav-logo">✦ Golden</NavLink>
        <span className="nav-version">v1.0</span>
      </nav>

      <div className="layout-body">
        <aside className="sidebar">
          <p className="sidebar-section-label">Documentation</p>
          <ul className="sidebar-nav">
            {navItems.map(({ label, to }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </aside>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
