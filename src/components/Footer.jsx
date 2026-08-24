import { Link } from 'react-router-dom';
import { Car, Mail, Phone, MapPin, Globe, MessageCircle, Share2, Users } from 'lucide-react';

const footerLinks = {
  Company: [
    { label: 'About Us', to: '#' },
    { label: 'Careers', to: '#' },
    { label: 'Blog', to: '#' },
    { label: 'Press', to: '#' },
  ],
  Services: [
    { label: 'Vehicle Rental', to: '/vehicles' },
    { label: 'Fleet Management', to: '/fleet-dashboard' },
    { label: 'Airport Transfer', to: '#' },
    { label: 'Corporate Hire', to: '#' },
  ],
  Support: [
    { label: 'Help Center', to: '#' },
    { label: 'Contact Us', to: '#' },
    { label: 'Privacy Policy', to: '#' },
    { label: 'Terms of Service', to: '#' },
  ],
};

const socialLinks = [
  { icon: Globe, href: '#', label: 'Website' },
  { icon: MessageCircle, href: '#', label: 'Community' },
  { icon: Share2, href: '#', label: 'Social' },
  { icon: Users, href: '#', label: 'Network' },
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-600 rounded-xl">
                <Car size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Drive<span className="text-blue-400">Fleet</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-5">
              DriveFleet is your trusted partner for vehicle rentals and fleet management.
              From daily city runs to adventure road trips, we have the perfect vehicle for you.
            </p>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-blue-400 shrink-0" />
                <span>Level 12, Tech Park, Mumbai 400051</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-blue-400 shrink-0" />
                <span>+91 1800 123 4567</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-blue-400 shrink-0" />
                <span>support@drivefleet.in</span>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                {section}
              </h3>
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} DriveFleet. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {socialLinks.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-blue-600 hover:text-white transition-all duration-200"
              >
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
