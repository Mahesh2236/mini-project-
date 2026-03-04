import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { translations } from "./GovHeader";

export default function NavBar({ lang }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const t = translations[lang];

  const links = [
    { path: "/", label: t.nav_home },
    { path: "/detect", label: t.nav_detect },
    { path: "/report", label: t.nav_report },
    { path: "/about", label: t.nav_about },
  ];

  return (
    <nav className="gov-navbar" role="navigation" aria-label="Main navigation">
      <div className="nav-inner">
        <div className="desktop-nav">
          {links.map((link) => (
            <Link key={link.path} to={link.path} className={`nav-link ${location.pathname === link.path ? "active" : ""}`}>
              {link.label}
            </Link>
          ))}
        </div>
        <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" aria-expanded={menuOpen}>☰</button>
      </div>
      {menuOpen && (
        <div className="mobile-nav">
          {links.map((link) => (
            <Link key={link.path} to={link.path} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>{link.label}</Link>
          ))}
        </div>
      )}
    </nav>
  );
}
