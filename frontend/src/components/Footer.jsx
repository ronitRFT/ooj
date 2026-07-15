export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand-block">
          <p className="footer-brand">OOJ Foundation</p>
          <p className="footer-tagline">नमो नारायण</p>
        </div>

        <div className="footer-contact">
          <p className="footer-line">
            Phone <a href="tel:+919812635072">+91 98126 35072</a>
          </p>
          <p className="footer-line">
            Email – <a href="mailto:yogipriyvratanimesh@gmail.com">yogipriyvratanimesh@gmail.com</a>
          </p>
          <p className="footer-address">
            <em>Correspondence Address</em>: Innov8 CP2 44, Backary Portion, 2nd Floor,
            Regal Building, New Delhi 110001
          </p>
        </div>

        <div className="footer-social">
          <a
            href="https://oojfoundation.org/#"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-btn"
            aria-label="Facebook"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
              <path d="M13.5 21v-7h2.4l.4-2.9h-2.8V9.3c0-.84.26-1.42 1.47-1.42h1.43V5.28c-.25-.03-1.1-.11-2.08-.11-2.06 0-3.47 1.26-3.47 3.57v1.99H8.5V14h2.35v7h2.65z" />
            </svg>
          </a>
          <a
            href="https://oojfoundation.org/#"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-btn"
            aria-label="Instagram"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
            </svg>
          </a>
          <a
            href="https://www.youtube.com/@OojFoundation"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-btn"
            aria-label="YouTube"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
              <path d="M21.6 7.2s-.2-1.4-.8-2c-.75-.8-1.6-.8-2-.85C16 4.2 12 4.2 12 4.2h-.01s-4 0-6.8.2c-.4.05-1.25.05-2 .85-.6.6-.8 2-.8 2S2.2 8.8 2.2 10.5v1.6c0 1.65.2 3.3.2 3.3s.2 1.4.8 2c.75.8 1.74.77 2.2.86 1.6.15 6.6.2 6.6.2s4 0 6.8-.21c.4-.05 1.25-.05 2-.85.6-.6.8-2 .8-2s.2-1.65.2-3.3v-1.6c0-1.65-.2-3.3-.2-3.3zM9.9 14.6V9.1l5.2 2.76-5.2 2.74z" />
            </svg>
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} OOJ Foundation. All rights reserved.</p>
      </div>
    </footer>
  );
}
