"use client";

export function Header({
  businessName,
  primaryColor,
  logoUrl,
  coverImage,
  headingClass = "",
}: {
  businessName: string;
  primaryColor: string;
  logoUrl?: string;
  coverImage?: string;
  headingClass?: string;
}) {
  return (
    <div className="pb-8">
      {coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverImage}
          alt=""
          className="w-full aspect-[3/1] object-cover rounded-2xl mb-6 shadow-[0_12px_32px_-14px_rgba(0,0,0,0.16)]"
        />
      )}
      <div className="text-center pt-2">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={businessName}
            className="w-16 h-16 rounded-2xl object-cover mx-auto mb-5 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.18)]"
          />
        ) : (
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center text-white text-2xl font-bold shadow-[0_12px_32px_-12px_rgba(0,0,0,0.18)]"
            style={{
              backgroundImage: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)`,
            }}
          >
            {businessName.charAt(0).toUpperCase()}
          </div>
        )}
        <h2 className={`text-[28px] font-bold text-foreground tracking-tight leading-tight ${headingClass}`}>
          {businessName}
        </h2>
        <p className="text-[13px] text-text-secondary mt-1.5">Book your appointment online</p>
      </div>
    </div>
  );
}
