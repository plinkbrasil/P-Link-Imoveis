"use client";
import React from "react";

function whatsappHref(msg: string) {
  const num = "5541987098082"; // E.164 sem '+'
  const text = encodeURIComponent(msg);
  return `https://wa.me/${num}?text=${text}`;
}

/**
 * Bloco reutilizável para quando uma busca/filtro não retornar resultados.
 * Agora com fontes maiores e botão verde no estilo WhatsApp.
 */
export default function EmptyState({
  message = "Não encontramos nada parecido na busca. Ainda podemos ter o que procura à venda de forma privada — entre em contato para mais informações.",
  code,
  className = "",
}: {
  message?: string;
  code?: string;
  className?: string;
}) {
  const defaultMsg = code
    ? `Olá! Vi o imóvel ${code} no site e não encontrei resultados parecidos. Vocês têm algo privado disponível?`
    : `Olá! Não encontrei resultados na busca. Vocês têm opções privadas disponíveis?`;

  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm ${className}`}
    >
      <h3 className="text-2xl md:text-3xl font-semibold mb-3 text-zinc-800">
        Não encontramos resultados
      </h3>
      <p className="text-base md:text-lg text-zinc-600 leading-relaxed max-w-2xl mx-auto">
        {message}
      </p>

      <div className="mt-6 flex justify-center">
        <a
          href={whatsappHref(defaultMsg)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-white font-semibold shadow-md transition-transform hover:scale-105"
          style={{ backgroundColor: "#25D366" }} // Verde padrão WhatsApp
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5 text-white"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.862 13.487a4.99 4.99 0 01-1.262-.163 4.988 4.988 0 01-1.154-.48 10.003 10.003 0 01-4.188-4.187 4.988 4.988 0 01-.48-1.154A4.99 4.99 0 019.514 6.2a.75.75 0 00-.548-.266c-.211 0-.42.084-.574.238l-.935.935a.75.75 0 00-.174.79 11.983 11.983 0 001.466 2.933 11.969 11.969 0 004.732 4.733 11.983 11.983 0 002.933 1.465.75.75 0 00.79-.173l.935-.935a.75.75 0 00-.266-1.26z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 21.75c-5.385 0-9.75-4.365-9.75-9.75S6.615 2.25 12 2.25s9.75 4.365 9.75 9.75a9.72 9.72 0 01-1.51 5.197l.902 3.259a.75.75 0 01-.927.927l-3.259-.902A9.72 9.72 0 0112 21.75z"
            />
          </svg>
          Chamar no WhatsApp
        </a>
      </div>
    </div>
  );
}
