"use client";

export default function HomeGoogleMapOverlay() {
  return (
    <div className="pointer-events-none absolute right-[3.5%] top-[16%] z-20 hidden h-[66%] w-[61%] overflow-hidden rounded-[2rem] border border-white/70 shadow-[0_18px_50px_rgba(19,94,122,.18)] lg:block">
      <iframe
        title="Swaply global exchange map"
        src="https://www.google.com/maps?q=20,0&z=2&output=embed"
        className="pointer-events-auto h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan-50/10 via-transparent to-emerald-50/10" aria-hidden="true" />
    </div>
  );
}
