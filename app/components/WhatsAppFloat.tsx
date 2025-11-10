// -*- app/components/WhatsAppFloat.tsx -*-
'use client';

type Props = {
  /** Phone in E.164 format, e.g. +5541987098082 */
  phoneE164: string;
  /** Optional prefilled message */
  message?: string;
};

const ICON_URL = "https://host2b.net/download/imagem/whatsapp-icon.png";

export default function WhatsAppFloat({ phoneE164, message }: Props) {
  const phone = (phoneE164 || '').replace(/[^+0-9]/g, '');
  const textParam = message ? `?text=${encodeURIComponent(message)}` : '';
  const href = `https://wa.me/${encodeURIComponent(phone.replace(/^\+/, ''))}${textParam}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      title="Falar no WhatsApp"
      className="whatsapp-float"
    >
      <img
        src={ICON_URL}
        alt="WhatsApp"
        style={{
          height: 80,
          position: 'fixed',
          bottom: 25,
          right: 25,
          zIndex: 99999,
          pointerEvents: 'auto', // garante clique mesmo com bloqueio global
        }}
      />
    </a>
  );
}
