// -*- app/components/PropertyMap.tsx -*-
'use client';

import MapClient, { MapPoint } from '@/app/components/MapClient';

export default function PropertyMap({ point }: { point: MapPoint }) {
  if (!point?.geo) return null;
  return (
    <div className="rounded-xl overflow-hidden border">
      <MapClient points={[point]} zoom={13} className="w-full" style={{ height: 360 }} />
    </div>
  );
}
