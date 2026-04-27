
type Props = { className?: string };

export function GmailLogo({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 256 193" xmlns="http://www.w3.org/2000/svg" aria-label="Gmail">
      <path d="M58.18 192.05V93.14L27.5 65.08 0 49.5v125.09c0 9.66 7.83 17.46 17.46 17.46z" fill="#4285F4"/>
      <path d="M197.82 192.05h40.72c9.66 0 17.46-7.8 17.46-17.46V49.5l-31.16 17.84-27.02 25.8z" fill="#34A853"/>
      <path d="M58.18 93.14l-4.17-38.65 4.17-37L128 69.6l69.82-52.09 4.67 33.52-4.67 42.11L128 145.23z" fill="#EA4335"/>
      <path d="M197.82 17.5V93.14L256 49.5V26.23c0-21.58-24.64-33.88-41.9-20.94z" fill="#FBBC04"/>
      <path d="M0 49.5l26.76 20.08 31.42 23.56V17.5L41.9 5.29C24.61-7.66 0 4.65 0 26.23z" fill="#C5221F"/>
    </svg>
  );
}

export function OutlookLogo({ className }: Props) {
  const t = "matrix(15,0,0,15,0,0)";
  return (
    <svg className={className} viewBox="60 90 570 540" xmlns="http://www.w3.org/2000/svg" aria-label="Outlook">
      <defs>
        <linearGradient id="olA" gradientUnits="userSpaceOnUse" x1="9.99" y1="22.36" x2="30.93" y2="9.37" gradientTransform={t}>
          <stop offset="0" stopColor="#20A7FA"/>
          <stop offset="0.4" stopColor="#3BD5FF"/>
          <stop offset="1" stopColor="#C4B0FF"/>
        </linearGradient>
        <linearGradient id="olB" gradientUnits="userSpaceOnUse" x1="17.20" y1="26.79" x2="28.86" y2="8.13" gradientTransform={t}>
          <stop offset="0" stopColor="#165AD9"/>
          <stop offset="0.5" stopColor="#1880E5"/>
          <stop offset="1" stopColor="#8587FF"/>
        </linearGradient>
        <linearGradient id="olC" gradientUnits="userSpaceOnUse" x1="25.70" y1="27.05" x2="12.76" y2="16.50" gradientTransform={t}>
          <stop offset="0.24" stopColor="#448AFF" stopOpacity="0"/>
          <stop offset="0.79" stopColor="#0032B1" stopOpacity="0.2"/>
        </linearGradient>
        <linearGradient id="olD" gradientUnits="userSpaceOnUse" x1="24.05" y1="31.11" x2="44.51" y2="18.02" gradientTransform={t}>
          <stop offset="0" stopColor="#1A43A6"/>
          <stop offset="0.49" stopColor="#2052CB"/>
          <stop offset="1" stopColor="#5F20CB"/>
        </linearGradient>
        <linearGradient id="olE" gradientUnits="userSpaceOnUse" x1="29.83" y1="30.33" x2="17.40" y2="19.57" gradientTransform={t}>
          <stop offset="0" stopColor="#0045B9" stopOpacity="0"/>
          <stop offset="0.67" stopColor="#0D1F69" stopOpacity="0.2"/>
        </linearGradient>
        <radialGradient id="olF" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="matrix(0,-405.04,438.39,0,360.03,102.27)">
          <stop offset="0.57" stopColor="#275FF0" stopOpacity="0"/>
          <stop offset="0.99" stopColor="#002177"/>
        </radialGradient>
        <linearGradient id="olG" gradientUnits="userSpaceOnUse" x1="42" y1="29.94" x2="23.85" y2="29.94" gradientTransform={t}>
          <stop offset="0" stopColor="#4DC4FF"/>
          <stop offset="0.2" stopColor="#0FAFFF"/>
        </linearGradient>
        <radialGradient id="olH" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="matrix(122.74,-122.74,122.74,122.74,421.39,568.68)">
          <stop offset="0.26" stopColor="#0060D1" stopOpacity="0.4"/>
          <stop offset="0.91" stopColor="#0383F1" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="olI" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="matrix(357.41,-468.45,423.59,323.19,159.47,697.08)">
          <stop offset="0.73" stopColor="#F4A7F7" stopOpacity="0"/>
          <stop offset="1" stopColor="#F4A7F7" stopOpacity="0.5"/>
        </radialGradient>
        <radialGradient id="olJ" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="matrix(-170.86,259.73,-674.02,-443.40,278.56,412.98)">
          <stop offset="0" stopColor="#49DEFF"/>
          <stop offset="0.72" stopColor="#29C3FF"/>
        </radialGradient>
        <linearGradient id="olK" gradientUnits="userSpaceOnUse" x1="3.46" y1="37.87" x2="20.93" y2="37.86" gradientTransform={t}>
          <stop offset="0.21" stopColor="#6CE0FF"/>
          <stop offset="0.54" stopColor="#50D5FF" stopOpacity="0"/>
        </linearGradient>
        <radialGradient id="olL" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="matrix(215.77,230.77,-230.77,215.77,59.14,354.23)">
          <stop offset="0.04" stopColor="#0091FF"/>
          <stop offset="0.92" stopColor="#183DAD"/>
        </radialGradient>
        <radialGradient id="olM" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="matrix(0,168,-193.78,0,180,491.16)">
          <stop offset="0.56" stopColor="#0FA5F7" stopOpacity="0"/>
          <stop offset="1" stopColor="#74C6FF" stopOpacity="0.5"/>
        </radialGradient>
      </defs>
      <path fill="url(#olA)" d="M463.98 140.14L119.64 358.41 90.02 311.70v-40.26c0-14.66 7.42-28.32 19.72-36.30L309.91 105.26c30.50-19.79 69.78-19.79 100.28-0.01z"/>
      <path fill="url(#olB)" d="M407.10 103.34c1.04 0.61 2.06 1.25 3.08 1.91l156.22 101.33-387.34 245.52-59.44-93.77 284.27-180.54c26.93-17.10 28.11-55.57 3.21-74.46z"/>
      <path fill="url(#olC)" d="M407.10 103.34c1.04 0.61 2.06 1.25 3.08 1.91l156.22 101.33-387.34 245.52-59.44-93.77 284.27-180.54c26.93-17.10 28.11-55.57 3.21-74.46z"/>
      <path fill="url(#olD)" d="M333.60 498.99L179.07 452.11 507.63 243.84c27.67-17.54 27.60-57.94-0.13-75.38l-1.49-0.93 4.26 2.65 100 64.87c12.30 7.98 19.72 21.64 19.72 36.30v38.96z"/>
      <path fill="url(#olE)" d="M333.60 498.99L179.07 452.11 507.63 243.84c27.67-17.54 27.60-57.94-0.13-75.38l-1.49-0.93 4.26 2.65 100 64.87c12.30 7.98 19.72 21.64 19.72 36.30v38.96z"/>
      <path fill="url(#olF)" d="M410.19 105.25c-30.50-19.79-69.78-19.78-100.28 0.01L109.74 235.14c-12.30 7.98-19.72 21.64-19.72 36.30v1.97c0.48 14.72 8.23 28.28 20.74 36.16l248.89 156.91 249.52-156.67c12.96-8.14 20.82-22.37 20.82-37.67v38.17l0.01-38.96c0-14.66-7.43-28.32-19.72-36.30z"/>
      <path fill="url(#olG)" d="M315.77 630.05h220.45c51.78 0 93.75-41.97 93.75-93.75V272.14c0 15.30-7.86 29.53-20.82 37.67L281.24 515.70c-17.69 11.11-28.42 30.53-28.42 51.41 0 34.76 28.18 62.94 62.95 62.94z"/>
      <path fill="url(#olH)" d="M315.77 630.05h220.45c51.78 0 93.75-41.97 93.75-93.75V272.14c0 15.30-7.86 29.53-20.82 37.67L281.24 515.70c-17.69 11.11-28.42 30.53-28.42 51.41 0 34.76 28.18 62.94 62.95 62.94z"/>
      <path fill="url(#olI)" d="M315.77 630.05h220.45c51.78 0 93.75-41.97 93.75-93.75V272.14c0 15.30-7.86 29.53-20.82 37.67L281.24 515.70c-17.69 11.11-28.42 30.53-28.42 51.41 0 34.76 28.18 62.94 62.95 62.94z"/>
      <path fill="url(#olJ)" d="M405.40 630.04H183.74c-51.78 0-93.75-41.97-93.75-93.75V271.95c0 15.27 7.84 29.47 20.75 37.62l327.58 206.52c17.93 11.30 28.81 31.03 28.81 52.22 0 34.09-27.64 61.72-61.73 61.72z"/>
      <path fill="url(#olK)" d="M405.40 630.04H183.74c-51.78 0-93.75-41.97-93.75-93.75V271.95c0 15.27 7.84 29.47 20.75 37.62l327.58 206.52c17.93 11.30 28.81 31.03 28.81 52.22 0 34.09-27.64 61.72-61.73 61.72z"/>
      <path fill="url(#olL)" d="M108.75 345h142.5c26.93 0 48.75 21.82 48.75 48.75v142.5c0 26.93-21.82 48.75-48.75 48.75h-142.5c-26.93 0-48.75-21.82-48.75-48.75V393.75c0-26.93 21.82-48.75 48.75-48.75z"/>
      <path fill="url(#olM)" d="M108.75 345h142.5c26.93 0 48.75 21.82 48.75 48.75v142.5c0 26.93-21.82 48.75-48.75 48.75h-142.5c-26.93 0-48.75-21.82-48.75-48.75V393.75c0-26.93 21.82-48.75 48.75-48.75z"/>
      <path fill="#fff" d="M179.33 535.85c-19.77 0-36-6.38-48.69-19.13-12.69-12.75-19.04-29.40-19.04-49.93 0-21.68 6.44-39.22 19.32-52.61 12.88-13.39 29.75-20.09 50.61-20.09 19.70 0 35.74 6.41 48.11 19.23 12.44 12.82 18.66 29.72 18.66 50.70 0 21.55-6.44 38.93-19.32 52.13-12.82 13.14-29.37 19.70-49.65 19.70zm0.57-27.07c10.78 0 19.46-3.80 26.02-11.38 6.57-7.59 9.85-18.14 9.85-31.66 0-14.09-3.19-25.06-9.56-32.90-6.38-7.84-14.89-11.77-25.54-11.77-10.97 0-19.80 4.05-26.50 12.15-6.69 8.03-10.04 18.69-10.04 31.95 0 13.46 3.35 24.10 10.04 31.95 6.69 7.78 15.28 11.66 25.73 11.66z"/>
    </svg>
  );
}

export function InstagramLogo({ className }: Props) {
  // Real Instagram brand mark — see public/landing/instagram-logo.webp.
  // Plain <img> here — the asset is already a sub-10KB webp rendered
  // at icon size; next/image would add layout machinery for no benefit.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/landing/instagram-logo.webp"
      alt="Instagram"
      className={className}
      draggable={false}
    />
  );
}

export function WhatsAppLogo({ className }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/landing/whatsapp-logo.webp"
      alt="WhatsApp"
      className={className}
      draggable={false}
    />
  );
}

export function FormsLogo({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-label="Web form">
      <rect width="24" height="24" rx="5.5" fill="#FB7185"/>
      <rect x="4" y="5" width="16" height="14" rx="1.6" fill="#ffffff"/>
      <circle cx="7" cy="9" r="1.05" fill="#FB7185"/>
      <rect x="9.5" y="8.2" width="8.5" height="1.6" rx="0.7" fill="#FDD2D9"/>
      <circle cx="7" cy="12.5" r="1.05" fill="#FB7185"/>
      <rect x="9.5" y="11.7" width="8.5" height="1.6" rx="0.7" fill="#FDD2D9"/>
      <circle cx="7" cy="16" r="1.05" fill="#FB7185"/>
      <rect x="9.5" y="15.2" width="6" height="1.6" rx="0.7" fill="#FDD2D9"/>
    </svg>
  );
}
