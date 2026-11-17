import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Clock,
  MapPin,
  BarChart3,
  Zap,
  Sparkles,
  QrCode,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SculpturalRibbonSphere, TickyMascot } from '../components/DuoIllustrations';
import { DuoStatCard, DuoProgressBar } from '../components/DuolingoCharts';
import type { AggregatedAnalytics } from '../utils/queueMath';

export const HomePage: React.FC = () => {
  const { areas, navigate, lang, setLang, loginWithAccount } = useApp();
  const [analytics, setAnalytics] = useState<AggregatedAnalytics | null>(null);
  const [waitPerPerson, setWaitPerPerson] = useState<number>(10);
  const [peoplePerDay, setPeoplePerDay] = useState<number>(600);

  useEffect(() => {
    fetch('/api/analytics?days=7')
      .then((res) => res.json())
      .then((data) => {
        if (data.analytics) {
          setAnalytics(data.analytics);
        }
      })
      .catch((err) => console.error('Failed to load overview analytics:', err));
  }, []);

  const activeAreas = areas.filter((a) => a.status === 'active');
  const fastestArea = [...activeAreas]
    .filter((a) => (a.avg_wait_minutes || 0) > 0)
    .sort((a, b) => (a.avg_wait_minutes || 99) - (b.avg_wait_minutes || 99))[0];

  const lostHoursPerDay = Math.round((waitPerPerson * peoplePerDay) / 60);

  const handleQuickRoleDemo = async (email: string, destination: string) => {
    try {
      await loginWithAccount({ email });
      navigate(destination);
    } catch {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#08090B] pb-28">
      {/* 1. HERO SECTION (UNSEEN Intelligence + Duolingo Tactile System) */}
      <section
        className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-16 sm:pt-14 sm:pb-24"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 65% 55% at 85% 25%, rgba(205, 242, 43, 0.16) 0%, transparent 60%), linear-gradient(to right, rgba(8, 9, 11, 0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(8, 9, 11, 0.035) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 64px 64px, 64px 64px',
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Editorial Column */}
          <div className="lg:col-span-7 space-y-7 text-center lg:text-left">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#08090B] text-[#CDF22B] font-display text-xs font-bold uppercase tracking-[0.12em] shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-[#CDF22B] shadow-[0_0_8px_#CDF22B]" />
                <span>RESOURCE INTELLIGENCE PLATFORM</span>
              </span>

              <div className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-[#08090B]/15">
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                    lang === 'en' ? 'bg-[#08090B] text-[#CDF22B]' : 'text-[#08090B]/65'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLang('ml')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                    lang === 'ml' ? 'bg-[#08090B] text-[#CDF22B]' : 'text-[#08090B]/65'
                  }`}
                >
                  മലയാളം
                </button>
              </div>
            </div>

            <h1
              style={{ textWrap: 'balance' }}
              className="font-display text-5xl sm:text-6xl lg:text-[4.75rem] font-bold leading-[0.95] tracking-[-0.04em] text-[#08090B]"
            >
              {lang === 'ml' ? (
                <>
                  അദൃശ്യമായ കാത്തിരിപ്പ്{' '}
                  <span className="text-[#CDF22B] bg-[#08090B] px-3 py-1 rounded-2xl inline-block shadow-[0_4px_0_#000000] transform -rotate-1">
                    ദൃശ്യമാക്കാം.
                  </span>
                </>
              ) : (
                <>
                  Make the{' '}
                  <span className="text-[#CDF22B] bg-[#08090B] px-4 py-1 rounded-2xl inline-block shadow-[0_4px_0_#000000] transform -rotate-1 my-1">
                    INVISIBLE
                  </span>{' '}
                  VISIBLE<span className="text-[#CDF22B]">.</span>
                </>
              )}
            </h1>

            <p className="text-lg sm:text-xl text-[#08090B]/75 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              {lang === 'ml'
                ? 'മൂന്ന് ടാപ്പിൽ കാത്തിരിപ്പ് സമയം രേഖപ്പെടുത്താം. ലോഗിൻ ആവശ്യമില്ല.'
                : 'Time doesn’t just disappear—it gets lost in lines. Track your wait in 3 easy taps and help fix slow campus counters.'}
            </p>

            {/* Tactile Duolingo Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                type="button"
                onClick={() => navigate('/report')}
                className="btn-tactile-lime min-h-[56px] px-8 py-4 text-base sm:text-lg flex items-center justify-center gap-3 whitespace-nowrap"
              >
                <Clock className="w-5 h-5 stroke-[2.5]" />
                <span>Report My Wait</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/campus')}
                className="btn-tactile-secondary min-h-[56px] px-7 py-4 text-base flex items-center justify-center gap-2.5 whitespace-nowrap"
              >
                <MapPin className="w-5 h-5" />
                <span>Explore Campus</span>
              </button>
            </div>
          </div>

          {/* Right Column: 3D Sculptural Black Ribbon & Glowing Neon Lime Sphere */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <SculpturalRibbonSphere />
          </div>
        </div>
      </section>

      {/* 2. LIVE SNAPSHOT CARDS (Duolingo Data Visualization) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <DuoStatCard
            label="Time Tracked (7d)"
            value={analytics ? `${analytics.totalMinutes}m` : '183m'}
            sublabel={analytics ? `${analytics.totalReports} reports shared` : '15 reports shared'}
            accent="lime"
            icon={<Clock className="w-5 h-5" />}
          />

          <DuoStatCard
            label="Average Wait"
            value={analytics ? `${analytics.averageWaitMinutes}m` : '12.2m'}
            sublabel="Target: Under 10 mins"
            accent="teal"
            icon={<BarChart3 className="w-5 h-5" />}
          />

          <DuoStatCard
            label="Fastest Counter"
            value={fastestArea ? `${fastestArea.avg_wait_minutes}m` : '4m'}
            sublabel={fastestArea ? fastestArea.name : 'Student Service Desk'}
            accent="lime"
            icon={<Zap className="w-5 h-5" />}
          />

          <DuoStatCard
            label="Active Places"
            value={`${activeAreas.length} spots`}
            sublabel="Live QR timers ready"
            accent="obsidian"
            icon={<QrCode className="w-5 h-5" />}
          />
        </div>
      </section>

      {/* 3. HOW IT WORKS — 4-STEP HORIZONTAL PIPELINE (Collect -> Analyse -> Reveal -> Improve) */}
      <section className="bg-[#08090B] text-[#FAF8F3] py-16 sm:py-20 px-4 sm:px-8 mb-16">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-display font-bold uppercase tracking-[0.12em] text-[#CDF22B]">
                HOW IT WORKS · 4 SIMPLE STEPS
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#FAF8F3]">
                From one student tap to a faster campus
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/report')}
              className="btn-tactile-lime min-h-[46px] px-5 py-2.5 text-xs sm:text-sm self-start sm:self-auto whitespace-nowrap"
            >
              Start in 3 Taps →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                step: '01 · COLLECT',
                title: 'Scan or Pick Place',
                desc: 'Tap the counter you visited. No sign-up needed.',
              },
              {
                step: '02 · ANALYSE',
                title: 'Log Your Minutes',
                desc: 'Use our live stopwatch or tap how long you waited.',
              },
              {
                step: '03 · REVEAL',
                title: 'Spot Bottlenecks',
                desc: 'Live charts show which counters are slow and when.',
              },
              {
                step: '04 · IMPROVE',
                title: 'Fix the Line',
                desc: 'Mentors and management open extra counters.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="card-dark p-6 flex flex-col justify-between space-y-4"
              >
                <span className="inline-block self-start px-3 py-1 rounded-xl bg-[#CDF22B]/15 border border-[#CDF22B]/40 font-display text-xs font-bold tracking-[0.12em] text-[#CDF22B]">
                  {item.step}
                </span>
                <div className="space-y-1.5">
                  <h3 className="font-display text-xl font-bold text-[#FAF8F3]">{item.title}</h3>
                  <p className="text-sm text-[#FAF8F3]/70 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE QUEUE FRICTION SIMULATOR & SEPARATE PAGE LAUNCHERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left: Interactive Queue Friction Simulator */}
        <div className="lg:col-span-6 card-light p-7 sm:p-9 flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-display font-bold uppercase tracking-[0.12em] text-[#00545F]">
                QUEUE FRICTION SIMULATOR
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#08090B]">
                See how small waits add up
              </h2>
            </div>
            <TickyMascot size={72} mood="happy" />
          </div>

          <div className="space-y-5 bg-[#FAF8F3] p-5 rounded-3xl border border-[#08090B]/10">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-bold">
                <label htmlFor="sim-mins-slider" className="text-[#08090B]">
                  Wait per person
                </label>
                <span className="px-3 py-1 rounded-xl bg-[#CDF22B] border border-[#08090B] font-mono font-bold tabular-nums">
                  {waitPerPerson} min
                </span>
              </div>
              <input
                id="sim-mins-slider"
                type="range"
                min={2}
                max={30}
                value={waitPerPerson}
                onChange={(e) => setWaitPerPerson(Number(e.target.value))}
                className="w-full h-3 accent-[#08090B] cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-bold">
                <label htmlFor="sim-students-slider" className="text-[#08090B]">
                  People per day
                </label>
                <span className="px-3 py-1 rounded-xl bg-[#ECFFB6] border border-[#08090B] font-mono font-bold tabular-nums">
                  {peoplePerDay} people
                </span>
              </div>
              <input
                id="sim-students-slider"
                type="range"
                min={100}
                max={2000}
                step={50}
                value={peoplePerDay}
                onChange={(e) => setPeoplePerDay(Number(e.target.value))}
                className="w-full h-3 accent-[#08090B] cursor-pointer"
              />
            </div>

            <DuoProgressBar
              value={lostHoursPerDay}
              max={400}
              variant={lostHoursPerDay > 150 ? 'orange' : 'lime'}
              heightClass="h-5"
            />
          </div>

          <div className="card-dark p-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-display font-bold uppercase tracking-[0.12em] text-[#ECFFB6]">
                LOST EVERY SINGLE DAY
              </div>
              <div className="font-mono text-3xl sm:text-4xl font-bold text-[#CDF22B] tabular-nums mt-0.5">
                {lostHoursPerDay} hours / day
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/insights')}
              className="btn-tactile-lime px-4 py-2.5 text-xs shrink-0 whitespace-nowrap"
            >
              Open Charts →
            </button>
          </div>
        </div>

        {/* Right: Separate Page Cards & 1-Click Role Switcher */}
        <div className="lg:col-span-6 flex flex-col justify-between gap-6">
          <div className="card-light p-7 space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-display font-bold uppercase tracking-[0.12em] text-[#00545F]">
                DEDICATED PAGES
              </span>
              <h2 className="font-display text-2xl font-bold text-[#08090B]">
                Explore every page freely
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <button
                type="button"
                onClick={() => navigate('/report')}
                className="btn-tactile-lime p-4 text-left flex flex-col justify-between gap-3"
              >
                <Clock className="w-6 h-6 stroke-[2.5]" />
                <div>
                  <div className="font-display font-bold text-base">Report Page</div>
                  <div className="text-xs font-medium opacity-80">3-tap wait logger</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/campus')}
                className="btn-tactile-secondary p-4 text-left flex flex-col justify-between gap-3"
              >
                <MapPin className="w-6 h-6 stroke-[2.5]" />
                <div>
                  <div className="font-display font-bold text-base">Campus Page</div>
                  <div className="text-xs font-medium opacity-75">All service spots</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/insights')}
                className="btn-tactile-dark p-4 text-left flex flex-col justify-between gap-3"
              >
                <BarChart3 className="w-6 h-6 stroke-[2.5] text-[#CDF22B]" />
                <div>
                  <div className="font-display font-bold text-base text-[#FAF8F3]">
                    Insights Page
                  </div>
                  <div className="text-xs font-medium text-[#ECFFB6]">Duolingo charts</div>
                </div>
              </button>
            </div>
          </div>

          {/* 1-Click Role Switcher */}
          <div className="card-light p-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-display font-bold uppercase tracking-[0.12em] text-[#00545F]">
                  INSTANT DEMO ACCESS
                </span>
                <h3 className="font-display text-xl font-bold text-[#08090B]">
                  Switch Role in 1 Tap
                </h3>
              </div>
              <Sparkles className="w-5 h-5 text-[#00545F]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickRoleDemo('admin@timetax.edu.in', '/admin/areas')}
                className="btn-tactile-lime min-h-[46px] px-4 py-2.5 text-xs flex items-center justify-between"
              >
                <span>1. Super Admin · QR Studio</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickRoleDemo('diya.student@timetax.edu.in', '/student')}
                className="btn-tactile-secondary min-h-[46px] px-4 py-2.5 text-xs flex items-center justify-between"
              >
                <span>2. Student · My Time Hub</span>
                <UserCheck className="w-4 h-4 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickRoleDemo('mentor@timetax.edu.in', '/mentor')}
                className="btn-tactile-secondary min-h-[46px] px-4 py-2.5 text-xs flex items-center justify-between"
              >
                <span>3. Mentor · Propose Fix</span>
                <Sparkles className="w-4 h-4 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickRoleDemo('management@timetax.edu.in', '/management')}
                className="btn-tactile-secondary min-h-[46px] px-4 py-2.5 text-xs flex items-center justify-between"
              >
                <span>4. Management · Simulator</span>
                <ShieldCheck className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
