import { NavLink, Outlet } from 'react-router-dom'

export default function AppLayout() {
  return (
    <div className="app">
      <nav className="top-nav" aria-label="주요 메뉴">
        <NavLink to="/" end className="top-nav-brand">
          벤치마크 결과
        </NavLink>
        <div className="top-nav-links">
          <NavLink
            to="/plan-v1"
            className={({ isActive }) =>
              isActive ? 'top-nav-link is-active' : 'top-nav-link'
            }
          >
            Plan V1
          </NavLink>
          <NavLink
            to="/plan-v2"
            className={({ isActive }) =>
              isActive ? 'top-nav-link is-active' : 'top-nav-link'
            }
          >
            Plan V2
          </NavLink>
        </div>
      </nav>
      <Outlet />
    </div>
  )
}
