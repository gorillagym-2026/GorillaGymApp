interface StatsCardsProps {
  stats: {
    totalMembers: number;
    activeMembers: number;
    monthlyRevenue: number;
    totalPayments: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const totalMembers  = stats?.totalMembers  ?? 0;
  const activeMembers = stats?.activeMembers ?? 0;
  const totalRevenue  = stats?.monthlyRevenue ?? 0;
  const totalPayments = stats?.totalPayments ?? 0;

  const cards = [
    {
      name:    "Total de Alumnos",
      value:   totalMembers.toString(),
      icon:    "👥",
      accent:  "blue",
      ring:    "ring-blue-500/30",
      iconBg:  "bg-blue-500/20",
      border:  "border-blue-500/20 hover:border-blue-500/40",
      glow:    "hover:shadow-blue-500/10",
      bar:     "bg-blue-500",
    },
    {
      name:    "Alumnos Activos",
      value:   activeMembers.toString(),
      icon:    "✅",
      accent:  "green",
      ring:    "ring-green-500/30",
      iconBg:  "bg-green-500/20",
      border:  "border-green-500/20 hover:border-green-500/40",
      glow:    "hover:shadow-green-500/10",
      bar:     "bg-green-500",
    },
    {
      name:    "Ingresos del Mes",
      value:   `$${totalRevenue.toLocaleString()}`,
      icon:    "💰",
      accent:  "emerald",
      ring:    "ring-emerald-500/30",
      iconBg:  "bg-emerald-500/20",
      border:  "border-emerald-500/20 hover:border-emerald-500/40",
      glow:    "hover:shadow-emerald-500/10",
      bar:     "bg-emerald-500",
    },
    {
      name:    "Pagos del Mes",
      value:   totalPayments.toString(),
      icon:    "📊",
      accent:  "purple",
      ring:    "ring-purple-500/30",
      iconBg:  "bg-purple-500/20",
      border:  "border-purple-500/20 hover:border-purple-500/40",
      glow:    "hover:shadow-purple-500/10",
      bar:     "bg-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`animate-fade-in-up bg-gray-800/80 border ${card.border} rounded-xl p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${card.glow} group`}
        >
          {/* Top accent bar */}
          <div className={`absolute top-0 left-0 right-0 h-0.5 ${card.bar} opacity-60`} />

          <div className="flex items-start justify-between mb-3">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider leading-tight">
              {card.name}
            </p>
            <div className={`${card.iconBg} w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110`}>
              <span className="text-lg leading-none">{card.icon}</span>
            </div>
          </div>

          <p className="text-white text-3xl font-bold tracking-tight">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
