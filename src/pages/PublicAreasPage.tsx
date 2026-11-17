import React, { useState } from 'react';
import { QrCode, Clock, Search, PlusCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AreaCategoryBadge } from '../components/DuoIllustrations';
import { DuoProgressBar } from '../components/DuolingoCharts';

export const PublicAreasPage: React.FC = () => {
  const { areas, navigate, user } = useApp();
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const activeAreas = areas.filter((a) => a.status === 'active');
  const categories = [
    'All',
    ...Array.from(new Set(activeAreas.map((a) => a.category))),
  ];

  const filtered = activeAreas.filter((a) => {
    const matchesCategory = selectedCategory === 'All' || a.category === selectedCategory;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      a.name.toLowerCase().includes(q) ||
      a.building.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.stable_identifier.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 sm:py-10 px-4 sm:px-8 pb-28 bg-[#FAF8F3]">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Friendly Campus Page Header */}
        <div className="duo-card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="inline-block px-3 py-1 rounded-xl bg-[#ECFFB6] border-2 border-[#021E18] text-xs font-extrabold uppercase tracking-wider">
              Campus Directory
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#021E18]">
              Campus Service Places
            </h1>
            <p className="text-sm sm:text-base font-medium text-[#021E18]/70">
              See which counters are fast right now, or tap a place to start a timer.
            </p>
          </div>

          {user?.role === 'super_admin' && (
            <button
              type="button"
              onClick={() => navigate('/admin/areas/new')}
              className="duo-btn-primary min-h-[48px] px-5 py-3 text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap self-start md:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add New Area</span>
            </button>
          )}
        </div>

        {/* Simple Search & Category Filter Pills */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 text-[#021E18]/50 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              aria-label="Search campus areas"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find a canteen, library, office, or lab…"
              className="w-full min-h-[48px] pl-11 pr-4 py-2.5 rounded-2xl bg-white border-2 border-[#021E18]/20 text-sm font-bold text-[#021E18] placeholder:text-[#021E18]/45 focus:outline-none focus:border-[#021E18]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[40px] px-4 py-2 text-xs font-extrabold rounded-xl border-2 transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-[#021E18] text-[#C7FF00] border-[#021E18]'
                    : 'bg-white text-[#021E18]/75 border-[#021E18]/15 hover:border-[#021E18]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Campus Places Grid */}
        {filtered.length === 0 ? (
          <div className="duo-card p-12 text-center space-y-4">
            <p className="text-lg font-extrabold text-[#021E18]">
              No campus places match your search.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedCategory('All');
              }}
              className="duo-btn-primary min-h-[44px] px-5 py-2.5 text-xs"
            >
              Show All Places
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((area) => {
              const wait = area.avg_wait_minutes || 0;
              const isHigh = wait >= 14;
              const isMed = wait >= 8 && wait < 14;
              const variant = isHigh ? 'orange' : isMed ? 'amber' : 'lime';

              return (
                <div
                  key={area.id}
                  className="duo-card p-6 flex flex-col justify-between space-y-5 transition-transform duration-150 hover:-translate-y-1"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <AreaCategoryBadge category={area.category} size="md" />
                        <div className="min-w-0">
                          <h2 className="font-display text-xl font-extrabold text-[#021E18] truncate">
                            {area.name}
                          </h2>
                          <div className="text-xs font-bold text-[#021E18]/60 truncate">
                            {area.building} · {area.floor}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div
                          className={`font-mono text-2xl font-extrabold tabular-nums ${
                            isHigh
                              ? 'text-[#FF2A00]'
                              : isMed
                              ? 'text-[#021E18]'
                              : 'text-[#00545F]'
                          }`}
                        >
                          {wait ? `${wait}m` : 'New'}
                        </div>
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#021E18]/55">
                          {isHigh ? 'Busy' : isMed ? 'Moderate' : 'Fast'}
                        </div>
                      </div>
                    </div>

                    <DuoProgressBar value={wait} max={20} variant={variant} heightClass="h-4" />

                    <p className="text-xs sm:text-sm font-medium text-[#021E18]/75 line-clamp-2">
                      {area.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t-2 border-[#021E18]/10 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-[#021E18]/65 font-mono tabular-nums">
                      <span>{area.counters} window(s)</span>
                      <span>·</span>
                      <span>{area.report_count || 0} reports</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/q/${area.stable_identifier}`)}
                        className="duo-btn-primary min-h-[44px] px-3 py-2 text-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Open QR Timer</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/report?area=${area.stable_identifier}`)}
                        className="duo-btn-secondary min-h-[44px] px-3 py-2 text-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Report Wait</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
