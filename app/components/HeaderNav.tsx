"use client";

import { usePathname } from "next/navigation";

export default function HeaderNav() {
  const pathname = usePathname();

  const hideMap =
    pathname === "/aniversario_thiago_viola" || pathname.startsWith("/aniversario_thiago_viola/");

  return (
    <>
      <a href="/" className="text-white hover:text-white/90">
        Home
      </a>

      {!hideMap && (
        <a href="/mapa" className="text-white hover:text-white/90">
          Mapa
        </a>
      )}
    </>
  );
}
