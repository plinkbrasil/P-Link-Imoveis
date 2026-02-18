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
    <main className="min-h-screen flex items-top pt-4 justify-center bg-gradient-to-br from-[#0c0f14] to-[#0a454f] px-4">
      <div className="max-w-xl w-full text-center space-y-6 text-white">

            {/* Brasão */}
    <img
      src="/brasao.png"
      alt="Brasão Dyba"
      className="w-full h-auto rounded-xl"
      draggable={false}
    />


        {/* FOTO */}
        <div className="w-full overflow-hidden rounded-2xl">
          <img
            src="/thiago.png" // você troca aqui
            alt="Thiago Viola"
            className="w-full h-auto object-cover"
          />
        </div>

        {/* TÍTULO */}
        <h1 className="text-3xl md:text-4xl font-bold">
        Almoço de Aniversário do Thiago Viola!
        </h1>

        {/* DESCRIÇÃO */}
        <p className="text-white/80 text-sm md:text-base">
        Prepare-se para uma comemoração especial com amigos no aniversário do Thiago Viola, que acontecerá no sábado, dia 28 de fevereiro, na Chácara Bobato, localizada no bairro Umbará em Curitiba/PR; o almoço e a música são por conta do anfitrião, mas não se esqueça de trazer sua própria bebida para brindar conosco!
        </p>

        {/* CRONÔMETRO */}
        <Countdown targetDate="2026-02-28T00:00:00" />

      </div>
    </main>
  );
}
