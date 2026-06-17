import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiTwitter, FiInstagram, FiLinkedin, FiYoutube, FiGithub,
         FiMail, FiMapPin, FiPhone, FiArrowRight, FiNavigation, FiExternalLink } from 'react-icons/fi';
import api from '../../utils/api';
import './Footer.css';

const footerLinks = {
  Products: [
    { to: '/products?category=ai-robots',         label: 'AI Robots' },
    { to: '/products?category=drones-uav',         label: 'Drones & UAV' },
    { to: '/products?category=smart-home',         label: 'Smart Home' },
    { to: '/products?category=security-systems',   label: 'Security Systems' },
    { to: '/products?category=industrial-robotics',label: 'Industrial Robotics' },
    { to: '/products?category=iot-sensors',        label: 'IoT Sensors' },
  ],
  Company: [
    { to: '/about',          label: 'About HalfRobo' },
    { to: '/about#team',     label: 'Our Team' },
    { to: '/about#mission',  label: 'Mission & Vision' },
    { to: '/contact',        label: 'Contact Us' },
    { to: '#',               label: 'Press Kit' },
    { to: '#',               label: 'Careers' },
  ],
  Support: [
    { to: '#', label: 'Help Center' },
    { to: '#', label: 'Documentation' },
    { to: '#', label: 'API Reference' },
    { to: '#', label: 'System Status' },
    { to: '#', label: 'Privacy Policy' },
    { to: '#', label: 'Terms of Service' },
  ],
};

const DEFAULT_SETTINGS = {
  footer_tagline:      "Where AI meets robotics. Building the intelligent machines that will shape tomorrow's world.",
  footer_address:      'Bengaluru, Karnataka, India',
  footer_phone:        '+91 98765 43210',
  footer_email:        'hello@halfrobo.com',
  footer_copyright:    '© 2025 HalfRobo Technologies Pvt. Ltd. All rights reserved.',
  footer_twitter:      '#',
  footer_instagram:    '#',
  footer_linkedin:     '#',
  footer_youtube:      '#',
  footer_github:       '#',
  footer_map_location: 'Bengaluru, Karnataka, India',
  footer_map_show:     'true',
};

export default function Footer() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    api.get('/settings/footer')
      .then(r => { if (r.data?.data) setSettings(prev => ({ ...prev, ...r.data.data })); })
      .catch(() => {});
  }, []);

  const socials = [
    { icon: FiTwitter,   href: settings.footer_twitter   || '#', label: 'Twitter'   },
    { icon: FiInstagram, href: settings.footer_instagram || '#', label: 'Instagram' },
    { icon: FiLinkedin,  href: settings.footer_linkedin  || '#', label: 'LinkedIn'  },
    { icon: FiYoutube,   href: settings.footer_youtube   || '#', label: 'YouTube'   },
    { icon: FiGithub,    href: settings.footer_github    || '#', label: 'GitHub'    },
  ];

  const showMap       = settings.footer_map_show !== 'false';
  const mapLocation   = settings.footer_map_location || 'Bengaluru, Karnataka, India';
  const mapEmbedURL   = `https://maps.google.com/maps?q=${encodeURIComponent(mapLocation)}&output=embed&z=15`;
  const mapOpenURL    = `https://www.google.com/maps/search/${encodeURIComponent(mapLocation)}`;

  return (
    <footer className="footer">
      <div className="footer__glow-line" />
      <div className="container">

        {/* ── Top Section ──────────────────────────── */}
        <div className="footer__top">
          {/* Brand */}
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              <span className="footer__logo-icon">⬡</span>
              <span>Half<span className="text-gradient">Robo</span></span>
            </Link>
            <p className="footer__tagline">{settings.footer_tagline}</p>
            <div className="footer__contact-info">
              {settings.footer_address && (
                <div className="footer__contact-item"><FiMapPin size={14}/><span>{settings.footer_address}</span></div>
              )}
              {settings.footer_phone && (
                <div className="footer__contact-item"><FiPhone size={14}/><span>{settings.footer_phone}</span></div>
              )}
              {settings.footer_email && (
                <div className="footer__contact-item"><FiMail size={14}/><span>{settings.footer_email}</span></div>
              )}
            </div>
            <div className="footer__socials">
              {socials.map(s => (
                <a
                  key={s.label}
                  href={s.href === '#' ? undefined : s.href}
                  className={`footer__social ${s.href === '#' ? 'footer__social--disabled' : ''}`}
                  aria-label={s.label}
                  target={s.href !== '#' ? '_blank' : undefined}
                  rel="noopener noreferrer"
                >
                  <s.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group} className="footer__col">
              <h4 className="footer__col-title">{group}</h4>
              <ul className="footer__col-links">
                {links.map(link => (
                  <li key={link.label}>
                    <Link to={link.to} className="footer__link">
                      <FiArrowRight size={12} />{link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          <div className="footer__newsletter">
            <h4 className="footer__col-title">Stay Updated</h4>
            <p className="footer__newsletter-desc">Get the latest on AI robotics breakthroughs and exclusive deals.</p>
            <form className="footer__newsletter-form" onSubmit={e => e.preventDefault()}>
              <input type="email" placeholder="Enter your email" className="footer__newsletter-input" />
              <button type="submit" className="btn btn-primary btn-sm">Subscribe</button>
            </form>
            <div className="footer__badges">
              <span className="badge badge-blue">🔒 SSL Secured</span>
              <span className="badge badge-purple">🤖 AI Powered</span>
            </div>
          </div>
        </div>

        {/* ── Map Section ──────────────────────────── */}
        {showMap && (
          <div className="footer__map-section">
            <div className="footer__map-header">
              <div className="footer__map-title">
                <FiNavigation size={16} className="footer__map-icon" />
                <span>Find Our Store</span>
              </div>
              <a
                href={mapOpenURL}
                target="_blank"
                rel="noopener noreferrer"
                className="footer__map-open-btn"
              >
                <FiExternalLink size={13} /> Open in Google Maps
              </a>
            </div>

            <div className="footer__map-wrap">
              {/* Neon border glow */}
              <div className="footer__map-glow" />

              <iframe
                title="HalfRobo Store Location"
                src={mapEmbedURL}
                className="footer__map-iframe"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />

              {/* Location badge overlay */}
              <div className="footer__map-badge">
                <FiMapPin size={12} />
                <span>{mapLocation}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Bottom bar ───────────────────────────── */}
        <div className="footer__bottom">
          <p className="footer__copyright">{settings.footer_copyright}</p>
          <p className="footer__made-with">Engineered with ❤️ for the future of robotics</p>
        </div>
      </div>
    </footer>
  );
}
