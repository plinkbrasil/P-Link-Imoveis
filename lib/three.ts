// lib/three.ts
export function getThreeDPageUrl(code: string) {
    const id = (code || "").toUpperCase().trim(); // TR046, CS005, etc.
    return `https://plinkbrasil.github.io/P-Link_Imoveis_${id}`;
  }
  