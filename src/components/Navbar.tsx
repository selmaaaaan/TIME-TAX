import React from 'react';
import {
  Clock,
  BarChart3,
  QrCode,
  MapPin,
  ShieldCheck,
  UserCheck,
  Sparkles,
  LogOut,
  Users,
  Settings,
  Sliders,
  FileText,
  Home,
  Plus,
  User,
  Eye,
  LayoutGrid,
  Activity,
} from 'lucide-react';
import { useApp, getRoleHomeRoute } from '../context/AppContext';

export const TopHeader: React.FC = () => {
  const { user, currentPath, navigate, logout } = useApp();
  const path = currentPath.split('?')[0] || '/';
  const workspaceRoute = user ? getRoleHomeRoute(user.role) : null;

  const isOverview = path === '/' || path === '/overview';
  const isReport = path === '/report';
  const isCampus = path === '/campus' || path === '/areas';
  const isInsights = path === '/insights';
  const isWorkspace =
    path.startsWith('/admin') ||
    path.startsWith('/management') ||
    path.startsWith('/mentor') ||
    path.startsWith('/student') ||
    path === '/login';

  const navLinkClass = (active: boolean) =>
    `px-3.5 py-1.5 rounded-full text-sm transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
      active
        ? 'bg-[#CDF22B]/25 text-[#08090B] font-bold border border-[#CDF22B]/60 shadow-[0_0_14px_rgba(205,242,43,0.25)]'
        : 'text-[#08090B]/70 font-medium hover:text-[#08090B]'
    }`;

  return (
    <header className="no-print desktop-top-navbar hidden md:flex shrink-0 sticky top-0 z-40 h-[72px] bg-[#FAF8F3]/95 backdrop-blur-md border-b border-[#08090B]/[0.07] px-6 lg:px-8 items-center justify-between gap-6">
      {/* Zone 1: Brand Wordmark */}
      <a
        href="/"
        onClick={(e) => {
          e.preventDefault();
          navigate('/');
        }}
        className="font-display text-2xl font-bold tracking-[-0.04em] text-[#08090B] hover:text-[#00545F] transition-colors whitespace-nowrap shrink-0"
      >
        TIME TAX
      </a>

      {/* Zone 2: Desktop Nav Capsule with route-based active indicator */}
      <nav
        aria-label="Primary Navigation"
        className="flex items-center gap-1.5 bg-white/90 px-2.5 py-1.5 rounded-full border border-[#08090B]/10 shadow-xs"
      >
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          className={navLinkClass(isOverview)}
        >
          {isOverview && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#CDF22B] shadow-[0_0_6px_#CDF22B]" />
          )}
          <span>Overview</span>
        </a>
        <a
          href="/report"
          onClick={(e) => {
            e.preventDefault();
            navigate('/report');
          }}
          className={navLinkClass(isReport)}
        >
          {isReport && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#CDF22B] shadow-[0_0_6px_#CDF22B]" />
          )}
          <span>Report</span>
        </a>
        <a
          href="/campus"
          onClick={(e) => {
            e.preventDefault();
            navigate('/campus');
          }}
          className={navLinkClass(isCampus)}
        >
          {isCampus && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#CDF22B] shadow-[0_0_6px_#CDF22B]" />
          )}
          <span>Campus</span>
        </a>
        <a
          href="/insights"
          onClick={(e) => {
            e.preventDefault();
            navigate('/insights');
          }}
          className={navLinkClass(isInsights)}
        >
          {isInsights && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#CDF22B] shadow-[0_0_6px_#CDF22B]" />
          )}
          <span>Insights</span>
        </a>
        {workspaceRoute ? (
          <a
            href={workspaceRoute}
            onClick={(e) => {
              e.preventDefault();
              navigate(workspaceRoute);
            }}
            className={navLinkClass(isWorkspace)}
          >
            {isWorkspace && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#CDF22B] shadow-[0_0_6px_#CDF22B]" />
            )}
            <span>
              {user?.role === 'super_admin'
                ? 'Admin Studio'
                : user?.role === 'management'
                ? 'Management'
                : user?.role === 'mentor'
                ? 'Mentor Hub'
                : 'My Hub'}
            </span>
          </a>
        ) : (
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              navigate('/login');
            }}
            className={navLinkClass(path === '/login')}
          >
            {path === '/login' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#CDF22B] shadow-[0_0_6px_#CDF22B]" />
            )}
            <span>Sign In</span>
          </a>
        )}
      </nav>

      {/* Zone 3: Primary action + always-visible Log Out when signed in */}
      <div className="flex items-center gap-2 shrink-0">
        {user ? (
          <>
            <button
              type="button"
              onClick={() => navigate(workspaceRoute || '/')}
              className="btn-tactile-lime min-h-[40px] px-3.5 py-2 text-xs whitespace-nowrap shrink-0"
            >
              {user.role === 'super_admin'
                ? 'Admin Studio'
                : user.role === 'management'
                ? 'Management'
                : user.role === 'mentor'
                ? 'Mentor Hub'
                : 'My Time Hub'}
            </button>
            <button
              type="button"
              data-testid="header-logout-btn"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="btn-tactile-danger min-h-[40px] px-3.5 py-2 text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0"
              title="Log Out of current role"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/report')}
            className="btn-tactile-dark min-h-[42px] px-5 py-2 text-xs rounded-full whitespace-nowrap shrink-0"
          >
            Report Wait →
          </button>
        )}
      </div>
    </header>
  );
};

export const WorkspaceSidebar: React.FC = () => {
  const { user, lang, setLang, currentPath, navigate, logout } = useApp();
  const path = currentPath.split('?')[0] || '/';

  if (!user) return null;

  const roleLinks: Array<{ label: string; to: string; icon: React.ReactNode }> = [];

  if (user.role === 'student') {
    roleLinks.push(
      { label: 'Overview Page', to: '/student', icon: <Home className="w-4 h-4" /> },
      { label: 'Report Page', to: '/report', icon: <Clock className="w-4 h-4" /> },
      { label: 'Campus Page', to: '/campus', icon: <MapPin className="w-4 h-4" /> },
      { label: 'My History Page', to: '/student/history', icon: <FileText className="w-4 h-4" /> }
    );
  } else if (user.role === 'mentor') {
    roleLinks.push(
      { label: 'Assigned Areas', to: '/mentor', icon: <UserCheck className="w-4 h-4" /> },
      { label: 'Propose a Fix', to: '/mentor/propose', icon: <Sparkles className="w-4 h-4" /> },
      { label: 'Proposal Tracker', to: '/mentor/suggestions', icon: <FileText className="w-4 h-4" /> },
      { label: 'Campus Page', to: '/campus', icon: <MapPin className="w-4 h-4" /> }
    );
  } else if (user.role === 'management') {
    roleLinks.push(
      { label: 'Overview Page', to: '/management', icon: <BarChart3 className="w-4 h-4" /> },
      {
        label: 'Decisions Page',
        to: '/management/interventions',
        icon: <ShieldCheck className="w-4 h-4" />,
      },
      {
        label: 'Queue Simulator',
        to: '/management/simulator',
        icon: <Sliders className="w-4 h-4" />,
      },
      { label: 'Campus Page', to: '/campus', icon: <MapPin className="w-4 h-4" /> }
    );
  } else if (user.role === 'super_admin') {
    roleLinks.push(
      { label: 'Campus Areas & QR', to: '/admin/areas', icon: <QrCode className="w-4 h-4" /> },
      { label: 'Add New Area', to: '/admin/areas/new', icon: <Plus className="w-4 h-4" /> },
      { label: 'Users & Roles', to: '/admin/users', icon: <Users className="w-4 h-4" /> },
      { label: 'Settings & Demo', to: '/admin/settings', icon: <Settings className="w-4 h-4" /> },
      { label: 'Management View', to: '/management', icon: <BarChart3 className="w-4 h-4" /> },
      { label: 'Queue Simulator', to: '/management/simulator', icon: <Sliders className="w-4 h-4" /> },
      { label: 'Mentor Hub', to: '/mentor', icon: <Sparkles className="w-4 h-4" /> }
    );
  }

  return (
    <aside className="no-print hidden lg:flex flex-col w-64 shrink-0 border-r border-[#08090B]/10 bg-white h-full overflow-y-auto p-5 justify-between">
      <div className="space-y-6">
        <div className="p-3.5 rounded-2xl bg-[#FAF8F3] border border-[#08090B]/12">
          <div className="text-[11px] font-display font-bold uppercase tracking-[0.12em] text-[#00545F]">
            {user.role.replace('_', ' ')}
          </div>
          <div className="text-sm font-bold text-[#08090B] truncate mt-0.5">
            {user.display_name}
          </div>
        </div>

        <nav aria-label="Workspace Navigation" className="space-y-2">
          {roleLinks.map((item) => {
            const active = path === item.to;
            return (
              <button
                key={item.to}
                type="button"
                onClick={() => navigate(item.to)}
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-2xl text-left text-sm font-display font-bold flex items-center gap-3 transition-all whitespace-nowrap ${
                  active
                    ? 'bg-[#CDF22B] text-[#08090B] border border-[#08090B] shadow-[0_3px_0_#95ba07]'
                    : 'text-[#08090B]/70 hover:bg-[#FAF8F3] hover:text-[#08090B]'
                }`}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-5 border-t border-[#08090B]/10 space-y-3">
        <div className="flex items-center justify-between gap-1.5 bg-[#FAF8F3] p-1 rounded-xl border border-[#08090B]/12">
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              lang === 'en' ? 'bg-[#08090B] text-[#CDF22B]' : 'text-[#08090B]/70 hover:text-[#08090B]'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLang('ml')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              lang === 'ml' ? 'bg-[#08090B] text-[#CDF22B]' : 'text-[#08090B]/70 hover:text-[#08090B]'
            }`}
          >
            മലയാളം
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="btn-tactile-secondary w-full min-h-[42px] px-3 py-2 text-xs text-center truncate"
        >
          Switch Role Account
        </button>

        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="btn-tactile-danger w-full min-h-[42px] px-3 py-2 text-xs flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

/**
 * Mobile-Only Bottom Dock matching image_9068916a.png:
 * - Shown ONLY on mobile (< 768px) while TopHeader is hidden on mobile.
 * - Soft Ivory frosted rounded dock with 5 clean icon+label items and a glowing 6px neon lime active dot underneath.
 */
export const MobileBottomNav: React.FC = () => {
  const { user, currentPath, navigate } = useApp();
  const path = currentPath.split('?')[0] || '/';
  const workspaceRoute = user ? getRoleHomeRoute(user.role) : '/login';

  const isOverview = path === '/' || path === '/overview';
  const isCampus = path === '/campus' || path === '/areas';
  const isReport = path === '/report' || path.startsWith('/q/');
  const isInsights = path === '/insights';
  const isProfile =
    path === '/login' ||
    path.startsWith('/student') ||
    path.startsWith('/mentor') ||
    path.startsWith('/management') ||
    path.startsWith('/admin');

  const items = [
    {
      label: 'Overview',
      to: '/',
      active: isOverview,
      Icon: Home,
    },
    {
      label: 'Campus',
      to: '/campus',
      active: isCampus,
      Icon: Eye,
    },
    {
      label: 'Report',
      to: '/report',
      active: isReport,
      Icon: LayoutGrid,
    },
    {
      label: 'Insights',
      to: '/insights',
      active: isInsights,
      Icon: Activity,
    },
    {
      label: user ? 'Studio' : 'Sign In',
      to: workspaceRoute,
      active: isProfile,
      Icon: User,
    },
  ];

  return (
    <div className="no-print md:hidden mobile-bottom-dock">
      <nav
        aria-label="Mobile Bottom Navigation"
        className="pointer-events-auto max-w-md mx-auto bg-[#FAF8F3]/96 backdrop-blur-xl border border-[#08090B]/10 shadow-[0_12px_32px_rgba(8,9,11,0.14),0_2px_8px_rgba(8,9,11,0.06)] rounded-[28px] px-3 py-2.5 grid grid-cols-5 items-center"
      >
        {items.map(({ label, to, active, Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => navigate(to)}
            className="min-h-[52px] min-w-[48px] mx-auto px-2 py-1 flex flex-col items-center justify-center rounded-2xl transition-all active:scale-95"
          >
            <Icon
              className={`w-5 h-5 transition-colors ${
                active ? 'text-[#08090B] stroke-[2.25]' : 'text-[#08090B]/55 stroke-[1.75]'
              }`}
            />
            <span
              className={`text-[11px] font-display mt-1 whitespace-nowrap transition-colors ${
                active ? 'text-[#08090B] font-bold' : 'text-[#08090B]/55 font-medium'
              }`}
            >
              {label}
            </span>
            <span
              className={`mt-1 w-1.5 h-1.5 rounded-full transition-all ${
                active
                  ? 'bg-[#CDF22B] shadow-[0_0_8px_#CDF22B] opacity-100 scale-100'
                  : 'bg-transparent opacity-0 scale-50'
              }`}
            />
          </button>
        ))}
      </nav>
    </div>
  );
};
