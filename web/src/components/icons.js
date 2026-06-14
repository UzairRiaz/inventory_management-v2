import React from 'react';

const svgProps = {
  viewBox: '0 0 24 24',
  width: 20,
  height: 20,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export const icons = {
  home: (p) => (
    <svg {...svgProps} {...p}>
      <path d="M3 11.5L12 4l9 7.5" />
      <path d="M5 21V10a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v11" />
    </svg>
  ),
  users: (p) => (
    <svg {...svgProps} {...p}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  cart: (p) => (
    <svg {...svgProps} {...p}>
      <circle cx="9" cy="20" r="1" />
      <circle cx="20" cy="20" r="1" />
      <path d="M1 1h4l2.68 13.39A2 2 0 0 0 9.6 16h8.82a2 2 0 0 0 1.96-1.63L23 6H6" />
    </svg>
  ),
  dollar: (p) => (
    <svg {...svgProps} {...p}>
      <path d="M12 1v22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  settings: (p) => (
    <svg {...svgProps} {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  box: (p) => (
    <svg {...svgProps} {...p}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4.46a2 2 0 0 0 2 0l7-4.46A2 2 0 0 0 21 16z" />
    </svg>
  ),
  truck: (p) => (
    <svg {...svgProps} {...p}>
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  ledger: (p) => (
    <svg {...svgProps} {...p}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v19" />
    </svg>
  ),
  activity: (p) => (
    <svg {...svgProps} {...p}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  note: (p) => (
    <svg {...svgProps} {...p}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  ),
  profit: (p) => (
    <svg {...svgProps} {...p}>
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 3 3 5-6" />
    </svg>
  ),
  warehouse: (p) => (
    <svg {...svgProps} {...p}>
      <path d="M3 21h18M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-6h6v6" />
    </svg>
  ),
  search: (p) => (
    <svg {...svgProps} {...p}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  chevron: (p) => (
    <svg {...svgProps} {...p}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
  plus: (p) => (
    <svg {...svgProps} {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
};

export function Icon({ name, size = 20, className }) {
  const Component = icons[name];
  if (!Component) return null;
  return <span className={className} style={{ display: 'inline-flex' }}><Component width={size} height={size} /></span>;
}

export const sectionIconMap = {
  H: 'home',
  CST: 'users',
  SAL: 'cart',
  S: 'cart',
  PAY: 'dollar',
  NEW: 'plus',
  SET: 'settings',
  ACT: 'activity',
  INV: 'box',
};
