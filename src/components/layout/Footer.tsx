import { Link } from "react-router-dom";
import { Zap, Facebook, Twitter, Linkedin, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { settings } = useSiteSettings();
  const { t } = useLanguage();

  const footerLinks = {
    product: [
      { name: t("footer.features"), href: "/#features" },
      { name: t("footer.pricing"), href: "/pricing" },
      { name: t("footer.documentation"), href: "/docs" },
    ],
    company: [
      { name: t("footer.about"), href: "/about" },
      { name: t("footer.blog"), href: "/blog" },
      { name: t("footer.careers"), href: "/careers" },
      { name: t("footer.contact"), href: "/contact" },
    ],
    resources: [
      { name: t("footer.helpCenter"), href: "/help" },
      { name: t("footer.documentation"), href: "/docs" },
    ],
    legal: [
      { name: t("footer.privacyPolicy"), href: "/privacy" },
      { name: t("footer.termsOfService"), href: "/terms" },
      { name: t("footer.cookiePolicy"), href: "/cookies" },
      { name: t("footer.gdpr"), href: "/gdpr" },
    ],
  };

  // Build social links from settings
  const socialLinks = [
    settings.facebook_url && { icon: Facebook, href: settings.facebook_url, label: "Facebook" },
    settings.twitter_url && { icon: Twitter, href: settings.twitter_url, label: "Twitter" },
    settings.linkedin_url && { icon: Linkedin, href: settings.linkedin_url, label: "LinkedIn" },
    settings.instagram_url && { icon: Instagram, href: settings.instagram_url, label: "Instagram" },
    settings.youtube_url && { icon: Youtube, href: settings.youtube_url, label: "YouTube" },
  ].filter(Boolean) as { icon: typeof Facebook; href: string; label: string }[];

  // Fallback social links if none configured
  const defaultSocialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Instagram, href: "#", label: "Instagram" },
  ];

  const displaySocialLinks = socialLinks.length > 0 ? socialLinks : defaultSocialLinks;

  // Format company name for display
  const companyNameParts = settings.company_name.split(/(?=[A-Z])/);
  const firstPart = companyNameParts[0] || settings.company_name;
  const secondPart = companyNameParts.slice(1).join('') || '';

  // Build location string
  const locationParts = [settings.city, settings.country].filter(Boolean);
  const locationString = locationParts.join(', ');

  return (
    <footer className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 lg:gap-6">
          {/* Brand Column */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-3 group">
              {settings.logo_url ? (
                <img 
                  src={settings.logo_url} 
                  alt={settings.company_name} 
                  className="h-7 w-7 rounded-lg object-contain shadow-md"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg relative overflow-hidden transition-transform duration-300 group-hover:scale-105">
                  <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/30 to-transparent rounded-t-xl pointer-events-none" />
                  <Zap className="w-4 h-4 text-white relative z-10 drop-shadow-sm" />
                </div>
              )}
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {secondPart ? (
                  <>
                    {firstPart}<span className="text-primary">{secondPart}</span>
                  </>
                ) : (
                  settings.company_name
                )}
              </span>
            </Link>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] mb-3 max-w-xs leading-relaxed">
              {settings.tagline || 'AI-powered automation for your business.'}
            </p>
            <div className="flex gap-2">
              {displaySocialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target={social.href !== '#' ? '_blank' : undefined}
                  rel={social.href !== '#' ? 'noopener noreferrer' : undefined}
                  aria-label={social.label}
                  className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 text-slate-600 dark:text-slate-400 hover:from-primary hover:to-secondary hover:text-white flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-md"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-xs mb-2">{t("footer.product")}</h3>
            <ul className="space-y-1">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors text-[11px]"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-xs mb-2">{t("footer.company")}</h3>
            <ul className="space-y-1">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors text-[11px]"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-xs mb-2">{t("footer.resources")}</h3>
            <ul className="space-y-1">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors text-[11px]"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-xs mb-2">{t("footer.legal")}</h3>
            <ul className="space-y-1">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors text-[11px]"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-2">
          <div className="flex flex-wrap justify-center md:justify-start gap-3 text-[11px] text-slate-600 dark:text-slate-400">
            {settings.support_email && (
              <a href={`mailto:${settings.support_email}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                <Mail className="w-3 h-3" />
                {settings.support_email}
              </a>
            )}
            {settings.phone_number && (
              <a href={`tel:${settings.phone_number.replace(/\s/g, '')}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                <Phone className="w-3 h-3" />
                {settings.phone_number}
              </a>
            )}
            {locationString && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {locationString}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-500">
            {settings.copyright_text || `© ${new Date().getFullYear()} ${settings.company_name}. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
