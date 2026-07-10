import React, { useState } from 'react';
import { MapPin, Clock, Car, Wifi, Coffee, Accessibility, Phone, ChevronDown, ChevronUp } from 'lucide-react';

const venues = [
  {
    id: 1,
    name: 'IJsbaan Thialf',
    address: 'Boudewijnspark 3, Heerenveen',
    phone: '+31 513 638 000',
    hours: 'Ma–Vr: 08:00–22:00 | Za–Zo: 07:00–21:00',
    amenities: ['parking', 'wifi', 'cafeteria', 'accessible'],
    mapUrl: 'https://maps.google.com/?q=IJsbaan+Thialf+Heerenveen',
    description: 'World-class Olympic speed skating venue and our main league facility for elite and competitive divisions.',
    rinks: 2,
    capacity: 12000,
  },
  {
    id: 2,
    name: 'Sportcomplex De Vliet',
    address: 'Kamillewijk 7, Leidschendam',
    phone: '+31 70 399 8000',
    hours: 'Ma–Vr: 09:00–21:00 | Za: 08:00–20:00 | Zo: 10:00–18:00',
    amenities: ['parking', 'cafeteria', 'accessible'],
    mapUrl: 'https://maps.google.com/?q=Sportcomplex+De+Vliet+Leidschendam',
    description: 'Central venue for recreational and intermediate division matches. Family-friendly atmosphere.',
    rinks: 1,
    capacity: 2400,
  },
  {
    id: 3,
    name: 'IceWorld Amstelveen',
    address: 'Bovenkerkerweg 81, Amstelveen',
    phone: '+31 20 645 9881',
    hours: 'Ma–Zo: 09:00–23:00',
    amenities: ['parking', 'wifi', 'cafeteria'],
    mapUrl: 'https://maps.google.com/?q=IceWorld+Amstelveen',
    description: 'Modern facility with two rinks and state-of-the-art locker rooms, used for playoff matches.',
    rinks: 2,
    capacity: 3500,
  },
];

const amenityIcons = {
  parking: { icon: Car, label: 'Parking' },
  wifi: { icon: Wifi, label: 'Free WiFi' },
  cafeteria: { icon: Coffee, label: 'Cafeteria' },
  accessible: { icon: Accessibility, label: 'Accessible' },
};

export default function Venues() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
          <MapPin className="w-8 h-8 text-primary" /> Venue Directory
        </h1>
        <p className="text-muted-foreground mt-1">All ice rinks and facilities used by the Blackout League</p>
      </div>

      <div className="grid gap-4">
        {venues.map(v => (
          <div key={v.id} className="bg-card border border-border rounded-xl overflow-hidden">
            <div
              className="p-5 cursor-pointer hover:bg-secondary/20 transition-colors"
              onClick={() => setExpanded(expanded === v.id ? null : v.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-lg font-bold">{v.name}</h2>
                    <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{v.rinks} rink{v.rinks > 1 ? 's' : ''}</span>
                    <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">Cap. {v.capacity.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {v.address}
                  </div>
                </div>
                {expanded === v.id ? <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />}
              </div>

              <div className="flex gap-2 mt-3 flex-wrap">
                {v.amenities.map(a => {
                  const A = amenityIcons[a];
                  return A ? (
                    <span key={a} className="flex items-center gap-1 text-xs bg-secondary/70 px-2 py-1 rounded-md text-foreground">
                      <A.icon className="w-3 h-3 text-primary" /> {A.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            {expanded === v.id && (
              <div className="border-t border-border p-5 bg-secondary/10 space-y-4">
                <p className="text-sm text-muted-foreground">{v.description}</p>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium mb-0.5">Opening Hours</div>
                      <div className="text-muted-foreground">{v.hours}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium mb-0.5">Contact</div>
                      <div className="text-muted-foreground">{v.phone}</div>
                    </div>
                  </div>
                </div>
                <a
                  href={v.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  <MapPin className="w-4 h-4" /> Open in Maps
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
