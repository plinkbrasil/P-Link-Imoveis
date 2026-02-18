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

            {/* Brasão
    <img
      src="/brasao.png"
      alt="Brasão Dyba"
      className="w-full h-auto rounded-xl"
      draggable={false}
    />
*/}

        {/* FOTO */}
        <div className="w-full overflow-hidden rounded-2xl">
          <img
            src="/thiago.png" // você troca aqui
            alt="Thiago Viola"
            className="w-full h-auto object-cover"
          />
        </div>

        {/* CRONÔMETRO */}
        <Countdown targetDate="2026-02-28T00:00:00" />

        {/* TÍTULO */}
        <h1 className="text-3xl md:text-4xl font-bold">
        Almoço de Aniversário do Thiago Viola!
        </h1>

        {/* DESCRIÇÃO */}
        <p className="text-white/80 text-sm md:text-base">
        O aniversário do Thiago Viola será no sábado, dia 28 de fevereiro, na Chácara Bobato (Umbará, Curitiba), com almoço e música garantidos pelo anfitrião, ficando apenas a bebida por conta de cada convidado.
        </p>

        {/* BOTÃO */}
        <a
  href="https://www.google.com/maps/place/Cerâmica+Iguaçu+Ltda/@-25.6035699,-49.277776,382m/data=!3m1!1e3!4m6!3m5!1s0x94dcf9002d0ad2bd:0x4c16d86ab1f9b27c!8m2!3d-25.6029485!4d-49.2770098!16s%2Fg%2F11w_yg6q35?entry=ttu&g_ep=EgoyMDI2MDIxNi4wIKXMDSoASAFQAw%3D%3D"
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center justify-center mt-4 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition"
>
  📍 Como chegar
</a>


      </div>
    </main>
  );
}
