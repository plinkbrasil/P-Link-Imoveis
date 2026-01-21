'use client';

import { useEffect, useState } from 'react';

type Props = {
  targetDate: string; // ISO: "2026-12-31T20:00:00"
};

function getTimeLeft(target: Date) {
  const diff = target.getTime() - Date.now();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, finished: true };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    finished: false,
  };
}

export default function Countdown({ targetDate }: Props) {
  const target = new Date(targetDate);
  const [time, setTime] = useState(() => getTimeLeft(target));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeLeft(target));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (time.finished) {
    return (
      <div className="text-2xl font-semibold text-emerald-600">
        🎉 O evento começou!
      </div>
    );
  }

  const Item = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center bg-white/10 rounded-xl px-4 py-3 shadow">
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs uppercase tracking-wide text-[#f5d896]">{label}</div>
    </div>
  );

  return (
    <div className="flex gap-3 justify-center">
      <Item value={time.days} label="Dias" />
      <Item value={time.hours} label="Horas" />
      <Item value={time.minutes} label="Minutos" />
      <Item value={time.seconds} label="Segundos" />
    </div>
  );
}
