import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TopHeader, WorkspaceSidebar, MobileBottomNav } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { PublicInsightsPage } from './pages/PublicInsightsPage';
import { ReportWaitPage } from './pages/ReportWaitPage';
import { PublicAreasPage } from './pages/PublicAreasPage';
import { QrTimerPage } from './pages/QrTimerPage';
import { LoginPage } from './pages/LoginPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { MentorDashboard } from './pages/MentorDashboard';
import { ManagementDashboard } from './pages/ManagementDashboard';
import { AdminStudioPage } from './pages/AdminStudioPage';

const AppRouter: React.FC = () => {
  const { currentPath, user } = useApp();
  const path = currentPath.split('?')[0] || '/';

  const isWorkspaceRoute =
    path.startsWith('/student') ||
    path.startsWith('/mentor') ||
    path.startsWith('/management') ||
    path.startsWith('/admin');

  const renderPage = () => {
    if (path === '/' || path === '/overview') return <HomePage />;
    if (path === '/report') return <ReportWaitPage />;
    if (path === '/campus' || path === '/areas') return <PublicAreasPage />;
    if (path === '/insights') return <PublicInsightsPage />;
    if (path === '/login') return <LoginPage />;

    if (path.startsWith('/q/')) {
      const slug = decodeURIComponent(path.slice(3).replace(/\/+$/, ''));
      return <QrTimerPage areaSlug={slug || 'main-canteen'} />;
    }

    if (path === '/student') return <StudentDashboard view="overview" />;
    if (path === '/student/history') return <StudentDashboard view="history" />;

    if (path === '/mentor') return <MentorDashboard initialTab="overview" />;
    if (path === '/mentor/propose') return <MentorDashboard initialTab="propose" />;
    if (path === '/mentor/suggestions') return <MentorDashboard initialTab="suggestions" />;

    if (path === '/management') return <ManagementDashboard tab="overview" />;
    if (path === '/management/interventions') return <ManagementDashboard tab="interventions" />;
    if (path === '/management/simulator') return <ManagementDashboard tab="simulator" />;

    if (path === '/admin') return <AdminStudioPage subview="overview" />;
    if (path === '/admin/areas') return <AdminStudioPage subview="areas" />;
    if (path === '/admin/areas/new') return <AdminStudioPage subview="new-area" />;
    if (path === '/admin/users') return <AdminStudioPage subview="users" />;
    if (path === '/admin/settings') return <AdminStudioPage subview="settings" />;

    const qrMatch = path.match(/^\/admin\/areas\/([^/]+)\/qr\/?$/);
    if (qrMatch) {
      return <AdminStudioPage subview="qr-studio" qrAreaId={decodeURIComponent(qrMatch[1])} />;
    }

    return <HomePage />;
  };

  return (
    <div className="h-screen h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col bg-[#FAF8F3] text-[#08090B] relative">
      <TopHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {isWorkspaceRoute && user && <WorkspaceSidebar />}
        <main
          id="app-main-scroll"
          className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden pb-32 lg:pb-12"
        >
          {renderPage()}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
