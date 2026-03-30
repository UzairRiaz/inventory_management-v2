
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
// Inline SVG icon components to avoid external icon runtime issues
const IconHome = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 11.5L12 4l9 7.5" />
    <path d="M5 21V10a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v11" />
  </svg>
);
const IconBox = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4.46a2 2 0 0 0 2 0l7-4.46A2 2 0 0 0 21 16z" />
    <path d="M7.5 4.21v6.58" />
  </svg>
);
const IconCart = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="9" cy="20" r="1" />
    <circle cx="20" cy="20" r="1" />
    <path d="M1 1h4l2.68 13.39A2 2 0 0 0 9.6 16h8.82a2 2 0 0 0 1.96-1.63L23 6H6" />
  </svg>
);
const IconDollar = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 1v22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
const IconBook = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v19" />
  </svg>
);
const IconSettings = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M19.14 12.94a1.5 1.5 0 000-1.88l2.03-1.58a.5.5 0 00.12-.64l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96c-.5-.32-1.04-.59-1.6-.8l-.36-2.54A.5.5 0 0013.7 2h-3.4a.5.5 0 00-.5.42l-.36 2.54c-.56.21-1.1.48-1.6.8l-2.39-.96a.5.5 0 00-.6.22L2.71 9.84a.5.5 0 00.12.64L4.86 12a1.5 1.5 0 000 1.88L2.83 15.46a.5.5 0 00-.12.64l1.92 3.32c.14.24.42.34.66.24l2.39-.96c.5.32 1.04.59 1.6.8l.36 2.54c.04.28.28.42.5.42h3.4c.22 0 .46-.14.5-.42l.36-2.54c.56-.21 1.1-.48 1.6-.8l2.39.96c.24.1.52 0 .66-.24l1.92-3.32a.5.5 0 00-.12-.64L19.14 12.94z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const tabs = [
  { label: 'Home', path: '/org/home', icon: IconHome },
  { label: 'Inventory', path: '/org/inventory', icon: IconBox },
  { label: 'Sales', path: '/org/sales', icon: IconCart },
  { label: 'Payments', path: '/org/payments', icon: IconDollar },
  { label: 'Ledger', path: '/org/ledger', icon: IconBook },
  { label: 'Setup', path: '/org/setup', icon: IconSettings },
];

export default function OrgLayout() {
  return (
    <div className="org-layout">
      <Outlet />
      <nav className="nav-tabs nav-tabs-bottom">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}
            >
              <span className="nav-tab-icon"><Icon /></span>
                <span className="nav-tab-label">{tab.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
