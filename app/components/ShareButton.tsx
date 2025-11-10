"use client";

type Props = {
  title?: string;
  url?: string;
  className?: string;
  children?: React.ReactNode; // opcional, para trocar o texto/ícone
};

export default function ShareButton({ title, url, className, children }: Props) {
  const handleShare = () => {
    const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
    const shareTitle = title || (typeof document !== "undefined" ? document.title : "Imóvel disponível");

    if (navigator.share) {
      navigator.share({ title: shareTitle, url: shareUrl }).catch(() => {});
    } else if (navigator.clipboard && shareUrl) {
      navigator.clipboard.writeText(shareUrl).then(
        () => alert("Link copiado para a área de transferência!"),
        () => alert("Não foi possível copiar o link.")
      );
    } else {
      // fallback bem simples
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <button
      onClick={handleShare}
      className={
        className ??
        "flex items-center gap-2 mt-2 px-3 py-2 bg-[#0a454f] text-white text-sm rounded-lg hover:opacity-90 transition"
      }
      aria-label="Compartilhar"
      title="Compartilhar"
      type="button"
    >
      {children ?? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4m0 0L8 6m4-4v16" />
          </svg>
          Compartilhar
        </>
      )}
    </button>
  );
}
