import Countdown from '@/app/components/Countdown';

export const metadata = {
  title: 'Evento',
  robots: {
    index: false,
    follow: false,
  },
};

export default function EventoPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#d2b977] to-[#b79a60] px-4">
      <div className="max-w-xl w-full text-center space-y-6 text-white">

        {/* BRASAO */}
        <div className="w-full overflow-hidden rounded-2xl">
          <img
            src="/brasao.png" // você troca aqui
            alt="Família"
            className="w-full h-auto object-cover"
          />
        </div>

        {/* FOTO */}
        <div className="w-full overflow-hidden rounded-2xl shadow-lg">
          <img
            src="/familia.png" // você troca aqui
            alt="Família"
            className="w-full h-auto object-cover"
          />
        </div>

        {/* TÍTULO */}
        <h1 className="text-3xl md:text-4xl font-bold">
        A festa mais esperada de 2026!
        </h1>

        {/* DESCRIÇÃO */}
        <p className="text-white/80 text-sm md:text-base">
          Uma data muito especial que estamos aguardando juntos com alegria ❤️
        </p>

        {/* CRONÔMETRO */}
        <Countdown targetDate="2026-02-14T00:00:00" />

      </div>
    </main>
  );
}
