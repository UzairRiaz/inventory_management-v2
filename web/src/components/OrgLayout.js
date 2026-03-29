import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const tabs = [
  { label: 'Home', path: '/org/home' },
  { label: 'Inventory', path: '/org/inventory' },
  { label: 'Sales', path: '/org/sales' },
  { label: 'Payments', path: '/org/payments' },
  { label: 'Ledger', path: '/org/ledger' },
  { label: 'Setup', path: '/org/setup' },
];

export default function OrgLayout() {
  return (
    <div className="org-layout">
      <nav className="nav-tabs">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
