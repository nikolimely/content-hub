"use client";

export function SiteLogo({ logo, name }: { logo: string | null; name: string }) {
  if (!logo) {
    return (
      <div className="h-7 w-7 rounded bg-white/10 flex items-center justify-center text-xs font-semibold text-white/60">
        {name[0]}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo}
      alt={name}
      className="h-[22px] w-auto object-contain"
      onError={(e) => {
        const el = e.target as HTMLImageElement;
        el.style.display = "none";
        el.parentElement!.innerHTML = `<div class="h-7 w-7 rounded bg-white/10 flex items-center justify-center text-xs font-semibold text-white/60">${name[0]}</div>`;
      }}
    />
  );
}
