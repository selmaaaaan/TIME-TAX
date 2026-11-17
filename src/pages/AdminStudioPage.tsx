import React, { useEffect, useState, useCallback } from 'react';
import {
  QrCode,
  PlusCircle,
  Search,
  Copy,
  Download,
  Printer,
  ExternalLink,
  Archive,
  RotateCcw,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  LogOut,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TickyMascot, AreaCategoryBadge } from '../components/DuoIllustrations';
import { DuoProgressBar } from '../components/DuolingoCharts';
import type { Area, Profile, AuditLog, UserRole } from '../types';

export const AdminStudioPage: React.FC<{
  subview?: 'overview' | 'areas' | 'new-area' | 'qr-studio' | 'users' | 'settings';
  qrAreaId?: string;
}> = ({ subview = 'areas', qrAreaId }) => {
  const {
    user,
    areas,
    settings,
    navigate,
    logout,
    authFetch,
    refreshAreas,
    refreshAuthAndSettings,
  } = useApp();

  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [areaName, setAreaName] = useState<string>('');
  const [areaCategory, setAreaCategory] = useState<string>('Labs & Innovation');
  const [areaDesc, setAreaDesc] = useState<string>('');
  const [areaBuilding, setAreaBuilding] = useState<string>('');
  const [areaFloor, setAreaFloor] = useState<string>('Ground Floor');
  const [areaCounters, setAreaCounters] = useState<string>('2');
  const [areaServiceMins, setAreaServiceMins] = useState<string>('4');
  const [areaHours, setAreaHours] = useState<string>('09:00 AM – 05:30 PM');
  const [areaMentorId, setAreaMentorId] = useState<string>('usr-mentor-1');
  const [areaStatus, setAreaStatus] = useState<'active' | 'inactive'>('active');

  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const [qrData, setQrData] = useState<{
    area: Area;
    destinationUrl: string;
    svg: string;
    pngDataUrl: string;
  } | null>(null);
  const [qrLoading, setQrLoading] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  const [usersList, setUsersList] = useState<Profile[]>([]);
  const [userSearch, setUserSearch] = useState<string>('');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [instName, setInstName] = useState<string>(
    settings?.institution_name || 'K6 Institute of Science & Technology'
  );
  const [maxReportMins, setMaxReportMins] = useState<string>(
    String(settings?.max_report_minutes || 180)
  );
  const [sqlSchema, setSqlSchema] = useState<string>('');
  const [confirmClearDemo, setConfirmClearDemo] = useState<boolean>(false);

  useEffect(() => {
    if (settings) {
      setInstName(settings.institution_name);
      setMaxReportMins(String(settings.max_report_minutes));
    }
  }, [settings]);

  const loadAdminUsersAndLogs = useCallback(async () => {
    try {
      const [uRes, aRes, sRes] = await Promise.all([
        authFetch('/api/admin/users'),
        authFetch('/api/admin/audit-logs'),
        authFetch('/api/admin/supabase-schema'),
      ]);
      if (uRes.ok) {
        const uData = await uRes.json();
        setUsersList(uData.users || []);
      }
      if (aRes.ok) {
        const aData = await aRes.json();
        setAuditLogs(aData.audit_logs || []);
      }
      if (sRes.ok) {
        const sData = await sRes.json();
        setSqlSchema(sData.sqlSchema || '');
      }
    } catch {
      // ignore
    }
  }, [authFetch]);

  useEffect(() => {
    if (user?.role === 'super_admin') {
      loadAdminUsersAndLogs();
    }
  }, [user, loadAdminUsersAndLogs]);

  const loadQrCodeStudio = useCallback(async (targetIdOrSlug: string) => {
    setQrLoading(true);
    try {
      const origin = window.location.origin;
      const res = await fetch(
        `/api/qr/${encodeURIComponent(targetIdOrSlug)}?origin=${encodeURIComponent(origin)}`
      );
      if (res.ok) {
        const data = await res.json();
        setQrData(data);
      }
    } catch {
      // ignore
    } finally {
      setQrLoading(false);
    }
  }, []);

  useEffect(() => {
    if (subview === 'qr-studio' && qrAreaId) {
      loadQrCodeStudio(qrAreaId);
    }
  }, [subview, qrAreaId, loadQrCodeStudio]);

  if (!user || user.role !== 'super_admin') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 bg-[#FAF8F3]">
        <div className="max-w-md w-full card-light p-8 text-center space-y-4">
          <TickyMascot size={100} mood="happy" />
          <h1 className="font-display text-2xl font-bold text-[#08090B]">
            Super Admin Access Required
          </h1>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="btn-tactile-lime min-h-[46px] px-5 py-2.5 text-xs"
          >
            Sign In as Super Admin
          </button>
        </div>
      </div>
    );
  }

  const mentors = usersList.filter((u) => u.role === 'mentor' || u.role === 'super_admin');
  const categories = settings?.categories || [
    'Dining & Food',
    'Academic & Library',
    'Administration',
    'Finance & Fees',
    'Printing & Reprographics',
    'Labs & Innovation',
    'Student Services',
  ];

  const filteredAreas = areas.filter((a) => {
    const matchesCat = categoryFilter === 'All' || a.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      a.name.toLowerCase().includes(q) ||
      a.building.toLowerCase().includes(q) ||
      a.stable_identifier.toLowerCase().includes(q);
    return matchesCat && matchesStatus && matchesSearch;
  });

  const handleStartEditArea = (area: Area) => {
    setEditingArea(area);
    setAreaName(area.name);
    setAreaCategory(area.category);
    setAreaDesc(area.description);
    setAreaBuilding(area.building);
    setAreaFloor(area.floor);
    setAreaCounters(String(area.counters));
    setAreaServiceMins(String(area.service_minutes));
    setAreaHours(area.operating_hours);
    setAreaMentorId(area.assigned_mentor_id || '');
    setAreaStatus(area.status === 'inactive' ? 'inactive' : 'active');
    navigate('/admin/areas/new');
  };

  const handleSaveAreaForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setStatusBanner(null);

    if (!areaName.trim() || areaName.trim().length < 2) {
      setFormError('Area name is required (at least 2 characters).');
      return;
    }
    if (!areaBuilding.trim()) {
      setFormError('Building name is required.');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        name: areaName.trim(),
        category: areaCategory,
        description:
          areaDesc.trim() ||
          `Campus service counters at ${areaName.trim()} (${areaBuilding.trim()}).`,
        building: areaBuilding.trim(),
        floor: areaFloor.trim() || 'Ground Floor',
        counters: Math.max(1, Number(areaCounters) || 1),
        service_minutes: Math.max(0.5, Number(areaServiceMins) || 3),
        operating_hours: areaHours.trim() || '09:00 AM – 05:00 PM',
        assigned_mentor_id: areaMentorId || null,
        status: areaStatus,
      };

      const url = editingArea
        ? `/api/areas/${encodeURIComponent(editingArea.id)}`
        : '/api/areas';
      const method = editingArea ? 'PATCH' : 'POST';

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to save campus area.');
        return;
      }

      await refreshAreas(true);
      await loadAdminUsersAndLogs();

      const savedArea: Area = data.area;
      setEditingArea(null);
      setAreaName('');
      setAreaDesc('');
      setAreaBuilding('');
      setStatusBanner(
        editingArea
          ? `Updated "${savedArea.name}" (/q/${savedArea.stable_identifier}).`
          : `Created "${savedArea.name}" and generated QR code /q/${savedArea.stable_identifier}!`
      );

      navigate(`/admin/areas/${savedArea.stable_identifier}/qr`);
    } catch {
      setFormError('Network error while saving area.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleArchiveArea = async (area: Area) => {
    const nextStatus = area.status === 'archived' ? 'active' : 'archived';
    try {
      const res = await authFetch(`/api/areas/${encodeURIComponent(area.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setStatusBanner(
          nextStatus === 'archived'
            ? `Archived "${area.name}".`
            : `Restored "${area.name}" to active service.`
        );
        await refreshAreas(true);
        await loadAdminUsersAndLogs();
      }
    } catch {
      // ignore
    }
  };

  const handleDownloadQrPng = () => {
    if (!qrData) return;
    const link = document.createElement('a');
    link.href = qrData.pngDataUrl;
    link.download = `timetax-qr-${qrData.area.stable_identifier}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadQrSvg = () => {
    if (!qrData) return;
    const blob = new Blob([qrData.svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `timetax-qr-${qrData.area.stable_identifier}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyUrl = async () => {
    if (!qrData) return;
    try {
      await navigator.clipboard.writeText(qrData.destinationUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleUpdateUserRole = async (targetUserId: string, newRole: UserRole) => {
    try {
      const res = await authFetch(`/api/admin/users/${encodeURIComponent(targetUserId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setStatusBanner('Updated user role!');
        await loadAdminUsersAndLogs();
      }
    } catch {
      // ignore
    }
  };

  const handleToggleUserActive = async (target: Profile) => {
    try {
      const res = await authFetch(`/api/admin/users/${encodeURIComponent(target.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !target.is_active }),
      });
      if (res.ok) {
        await loadAdminUsersAndLogs();
      }
    } catch {
      // ignore
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          institution_name: instName.trim(),
          max_report_minutes: Number(maxReportMins) || 180,
        }),
      });
      if (res.ok) {
        setStatusBanner('Saved campus settings!');
        await refreshAuthAndSettings();
      }
    } catch {
      // ignore
    }
  };

  const handleClearDemoData = async () => {
    try {
      const res = await authFetch('/api/admin/demo-data/clear', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setConfirmClearDemo(false);
        setStatusBanner(`Cleared ${data.removedCount} demo records.`);
        await refreshAreas(true);
        await refreshAuthAndSettings();
      }
    } catch {
      // ignore
    }
  };

  const handleRestoreDemoData = async () => {
    try {
      const res = await authFetch('/api/admin/demo-data/restore', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setStatusBanner(`Restored ${data.addedCount} demo records.`);
        await refreshAreas(true);
        await refreshAuthAndSettings();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="py-8 sm:py-10 px-4 sm:px-8 pb-28 max-w-6xl mx-auto space-y-8 bg-[#FAF8F3]">
      {/* Admin Top Header & Sub-Page Switcher */}
      <div className="no-print card-light p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <TickyMascot size={85} mood="happy" />
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-[#CDF22B] border border-[#08090B] font-display text-xs font-bold uppercase tracking-[0.12em]">
              SUPER ADMIN · {user.display_name}
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#08090B] mt-1">
              Areas &amp; QR Studio
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingArea(null);
              navigate('/admin/areas');
            }}
            className={
              subview === 'areas' || subview === 'overview'
                ? 'btn-tactile-lime min-h-[42px] px-4 py-2 text-xs'
                : 'btn-tactile-secondary min-h-[42px] px-4 py-2 text-xs'
            }
          >
            Areas &amp; QR ({areas.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingArea(null);
              setAreaName('');
              setAreaBuilding('');
              setAreaDesc('');
              navigate('/admin/areas/new');
            }}
            className={
              subview === 'new-area'
                ? 'btn-tactile-lime min-h-[42px] px-4 py-2 text-xs flex items-center gap-1.5'
                : 'btn-tactile-dark min-h-[42px] px-4 py-2 text-xs flex items-center gap-1.5'
            }
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Add New Area</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/users')}
            className={
              subview === 'users'
                ? 'btn-tactile-lime min-h-[42px] px-4 py-2 text-xs'
                : 'btn-tactile-secondary min-h-[42px] px-4 py-2 text-xs'
            }
          >
            Users ({usersList.length})
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/settings')}
            className={
              subview === 'settings'
                ? 'btn-tactile-lime min-h-[42px] px-4 py-2 text-xs'
                : 'btn-tactile-secondary min-h-[42px] px-4 py-2 text-xs'
            }
          >
            Settings
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="btn-tactile-secondary min-h-[42px] px-3.5 py-2 text-xs flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Switch Role</span>
          </button>

          <button
            type="button"
            data-testid="admin-logout-btn"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="btn-tactile-danger min-h-[42px] px-4 py-2 text-xs flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {statusBanner && (
        <div
          role="status"
          className="no-print rounded-2xl border-2 border-[#08090B] bg-[#CDF22B] p-4 text-sm font-bold text-[#08090B] flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#08090B] shrink-0" />
            <span>{statusBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-xs font-bold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SUBVIEW 1: AREAS LISTING */}
      {(subview === 'areas' || subview === 'overview') && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#08090B]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                aria-label="Search areas"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search places…"
                className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-2xl bg-white border border-[#08090B]/20 text-sm font-bold text-[#08090B]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {['all', 'active', 'inactive', 'archived'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize border ${
                    statusFilter === st
                      ? 'bg-[#08090B] text-[#CDF22B] border-[#08090B]'
                      : 'bg-white text-[#08090B]/70 border-[#08090B]/15'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAreas.map((area) => {
              const wait = area.avg_wait_minutes || 0;
              return (
                <div
                  key={area.id}
                  className="card-light p-6 flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#ECFFB6] border border-[#08090B] text-[#08090B] uppercase">
                        {area.status}
                      </span>
                      <span className="text-[#00545F]">/q/{area.stable_identifier}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <AreaCategoryBadge category={area.category} size="sm" />
                      <div className="min-w-0 flex-1">
                        <h2 className="font-display text-xl font-bold text-[#08090B] truncate">
                          {area.name}
                        </h2>
                        <div className="text-xs text-[#08090B]/65 truncate">
                          {area.building} · {area.floor}
                        </div>
                      </div>
                    </div>

                    <DuoProgressBar
                      value={wait}
                      max={20}
                      variant={wait >= 14 ? 'orange' : wait >= 8 ? 'amber' : 'lime'}
                      heightClass="h-3.5"
                    />
                  </div>

                  <div className="space-y-2 pt-3 border-t border-[#08090B]/10">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/areas/${area.stable_identifier}/qr`)}
                        className="btn-tactile-lime min-h-[40px] px-3 py-2 text-xs flex items-center justify-center gap-1.5"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>QR Studio</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartEditArea(area)}
                        className="btn-tactile-secondary min-h-[40px] px-3 py-2 text-xs flex items-center justify-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/q/${area.stable_identifier}`)}
                        className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-[#FAF8F3] border border-[#08090B]/15 text-[#08090B] text-xs font-bold flex items-center justify-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open Page</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleArchiveArea(area)}
                        className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-[#FAF8F3] border border-[#08090B]/15 text-[#08090B]/75 text-xs font-bold flex items-center justify-center gap-1"
                      >
                        {area.status === 'archived' ? (
                          <>
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore</span>
                          </>
                        ) : (
                          <>
                            <Archive className="w-3 h-3" />
                            <span>Archive</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBVIEW 2: CREATE OR EDIT AREA */}
      {subview === 'new-area' && (
        <div className="max-w-3xl mx-auto card-light p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[#08090B]/10 pb-4">
            <div>
              <span className="text-xs font-display font-bold uppercase tracking-[0.12em] text-[#00545F]">
                {editingArea ? `EDITING /q/${editingArea.stable_identifier}` : 'CREATE NEW PLACE'}
              </span>
              <h2 className="font-display text-2xl font-bold text-[#08090B] mt-1">
                {editingArea ? `Edit ${editingArea.name}` : 'Create New Area & Generate QR Code'}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingArea(null);
                navigate('/admin/areas');
              }}
              className="btn-tactile-secondary min-h-[38px] px-4 py-1.5 text-xs"
            >
              Cancel
            </button>
          </div>

          {formError && (
            <div
              role="alert"
              className="rounded-2xl border-2 border-[#FF4B4B] bg-[#FF4B4B]/10 p-4 text-xs font-bold text-[#08090B] flex items-center gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 text-[#FF4B4B] shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSaveAreaForm} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="area-name-input" className="block text-xs font-bold text-[#08090B] mb-1.5">
                  Area Name (Required)
                </label>
                <input
                  id="area-name-input"
                  type="text"
                  required
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  placeholder="e.g., Innovation Lab"
                  className="w-full min-h-[46px] px-3.5 py-2 rounded-xl bg-[#FAF8F3] border border-[#08090B]/25 text-sm font-bold text-[#08090B]"
                />
              </div>

              <div>
                <label htmlFor="area-category-select" className="block text-xs font-bold text-[#08090B] mb-1.5">
                  Category
                </label>
                <select
                  id="area-category-select"
                  value={areaCategory}
                  onChange={(e) => setAreaCategory(e.target.value)}
                  className="w-full min-h-[46px] px-3.5 py-2 rounded-xl bg-[#FAF8F3] border border-[#08090B]/25 text-sm font-bold text-[#08090B]"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="area-desc-input" className="block text-xs font-bold text-[#08090B] mb-1.5">
                Short Description
              </label>
              <input
                id="area-desc-input"
                type="text"
                value={areaDesc}
                onChange={(e) => setAreaDesc(e.target.value)}
                placeholder="e.g., 3D printing and hardware checkout desk."
                className="w-full min-h-[46px] px-3.5 py-2 rounded-xl bg-[#FAF8F3] border border-[#08090B]/25 text-sm text-[#08090B]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="area-building-input" className="block text-xs font-bold text-[#08090B] mb-1.5">
                  Building (Required)
                </label>
                <input
                  id="area-building-input"
                  type="text"
                  required
                  value={areaBuilding}
                  onChange={(e) => setAreaBuilding(e.target.value)}
                  placeholder="e.g., Tech Research Block"
                  className="w-full min-h-[46px] px-3.5 py-2 rounded-xl bg-[#FAF8F3] border border-[#08090B]/25 text-sm font-bold text-[#08090B]"
                />
              </div>

              <div>
                <label htmlFor="area-floor-input" className="block text-xs font-bold text-[#08090B] mb-1.5">
                  Floor
                </label>
                <input
                  id="area-floor-input"
                  type="text"
                  value={areaFloor}
                  onChange={(e) => setAreaFloor(e.target.value)}
                  placeholder="Ground Floor"
                  className="w-full min-h-[46px] px-3.5 py-2 rounded-xl bg-[#FAF8F3] border border-[#08090B]/25 text-sm text-[#08090B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="area-counters-input" className="block text-xs font-bold text-[#08090B] mb-1.5">
                  Windows / Counters
                </label>
                <input
                  id="area-counters-input"
                  type="number"
                  min={1}
                  max={25}
                  value={areaCounters}
                  onChange={(e) => setAreaCounters(e.target.value)}
                  className="w-full min-h-[46px] px-3.5 py-2 rounded-xl bg-[#FAF8F3] border border-[#08090B]/25 font-mono text-sm font-bold text-[#08090B]"
                />
              </div>

              <div>
                <label htmlFor="area-service-mins-input" className="block text-xs font-bold text-[#08090B] mb-1.5">
                  Service Mins
                </label>
                <input
                  id="area-service-mins-input"
                  type="number"
                  min={0.5}
                  max={60}
                  step={0.5}
                  value={areaServiceMins}
                  onChange={(e) => setAreaServiceMins(e.target.value)}
                  className="w-full min-h-[46px] px-3.5 py-2 rounded-xl bg-[#FAF8F3] border border-[#08090B]/25 font-mono text-sm font-bold text-[#08090B]"
                />
              </div>

              <div>
                <label htmlFor="area-mentor-select" className="block text-xs font-bold text-[#08090B] mb-1.5">
                  Faculty Mentor
                </label>
                <select
                  id="area-mentor-select"
                  value={areaMentorId}
                  onChange={(e) => setAreaMentorId(e.target.value)}
                  className="w-full min-h-[46px] px-3.5 py-2 rounded-xl bg-[#FAF8F3] border border-[#08090B]/25 text-sm font-bold text-[#08090B]"
                >
                  <option value="">Unassigned</option>
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.display_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-[#08090B]/10 flex justify-end">
              <button
                type="submit"
                disabled={formSubmitting}
                className="btn-tactile-lime min-h-[50px] px-8 py-3 text-sm flex items-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                <span>
                  {formSubmitting
                    ? 'Generating QR…'
                    : editingArea
                    ? 'Save & View QR'
                    : 'Create Area & Generate QR Code'}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUBVIEW 3: BRANDED QR CODE STUDIO */}
      {subview === 'qr-studio' && (
        <div>
          {qrLoading || !qrData ? (
            <div className="p-12 text-center text-sm font-bold text-[#08090B]">
              Generating QR code…
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7 flex justify-center">
                <div
                  data-testid="branded-qr-poster"
                  className="w-full max-w-md card-dark p-8 sm:p-10 text-center space-y-6"
                >
                  <div className="space-y-1">
                    <div className="font-display text-2xl font-bold tracking-tight text-[#FAF8F3]">
                      TIME TAX
                    </div>
                    <div className="text-[11px] font-display font-bold uppercase tracking-[0.12em] text-[#CDF22B]">
                      MAKE THE INVISIBLE VISIBLE
                    </div>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-[#FAF8F3]/15">
                    <div className="font-display text-xl font-bold text-[#CDF22B]">
                      SCAN TO TRACK YOUR WAIT
                    </div>
                    <div className="font-display text-2xl sm:text-3xl font-bold text-[#FAF8F3]">
                      {qrData.area.name}
                    </div>
                    <div className="text-xs text-[#FAF8F3]/75">
                      {qrData.area.building} · {qrData.area.floor}
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-3xl mx-auto w-64 h-64 flex items-center justify-center">
                    <img
                      src={qrData.pngDataUrl}
                      alt={`QR Code for ${qrData.area.name}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="font-display text-lg font-bold text-[#ECFFB6]">
                      Scan. Start. Finish.
                    </div>
                    <div className="text-[11px] font-mono text-[#FAF8F3]/65 break-all">
                      {qrData.destinationUrl}
                    </div>
                  </div>
                </div>
              </div>

              <div className="no-print lg:col-span-5 card-light p-6 sm:p-8 space-y-6">
                <div>
                  <span className="text-xs font-display font-bold uppercase tracking-[0.12em] text-[#00545F]">
                    QR STUDIO
                  </span>
                  <h2 className="font-display text-2xl font-bold text-[#08090B] mt-1">
                    {qrData.area.name}
                  </h2>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF8F3] border border-[#08090B]/15 space-y-1">
                  <div className="text-[11px] font-bold text-[#08090B]/60">DESTINATION URL</div>
                  <div className="text-xs font-mono font-bold text-[#00545F] break-all">
                    {qrData.destinationUrl}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="btn-tactile-secondary min-h-[44px] px-4 py-2.5 text-xs flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{copiedUrl ? 'Copied!' : 'Copy Link'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(`/q/${qrData.area.stable_identifier}`)}
                    className="btn-tactile-lime min-h-[44px] px-4 py-2.5 text-xs flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Public QR Page</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadQrPng}
                    className="btn-tactile-secondary min-h-[44px] px-4 py-2.5 text-xs flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PNG</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadQrSvg}
                    className="btn-tactile-secondary min-h-[44px] px-4 py-2.5 text-xs flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download SVG</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-tactile-dark w-full min-h-[48px] py-3 px-5 text-sm flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Poster</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBVIEW 4: USERS & ROLES */}
      {subview === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 card-light p-6 sm:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold text-[#08090B]">
                Campus Users &amp; Roles
              </h2>
              <input
                type="search"
                aria-label="Search users"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users…"
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#FAF8F3] border border-[#08090B]/20 text-xs text-[#08090B]"
              />
            </div>

            <div className="space-y-3">
              {usersList
                .filter(
                  (u) =>
                    !userSearch.trim() ||
                    u.display_name.toLowerCase().includes(userSearch.toLowerCase()) ||
                    u.email.toLowerCase().includes(userSearch.toLowerCase())
                )
                .map((u) => (
                  <div
                    key={u.id}
                    className="p-4 rounded-2xl border border-[#08090B]/12 bg-[#FAF8F3] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-display font-bold text-sm text-[#08090B]">
                        {u.display_name}
                      </div>
                      <div className="text-xs font-mono text-[#08090B]/65">
                        {u.email} · {u.department}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        aria-label={`Role for ${u.display_name}`}
                        value={u.role}
                        onChange={(e) => handleUpdateUserRole(u.id, e.target.value as UserRole)}
                        className="min-h-[36px] px-2.5 py-1 rounded-xl bg-white border border-[#08090B]/20 text-xs font-bold text-[#08090B]"
                      >
                        <option value="student">student</option>
                        <option value="mentor">mentor</option>
                        <option value="management">management</option>
                        <option value="super_admin">super_admin</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleToggleUserActive(u)}
                        className="btn-tactile-secondary min-h-[36px] px-3 py-1 text-xs"
                      >
                        {u.is_active ? 'Active' : 'Suspended'}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="lg:col-span-5 card-light p-6 sm:p-8 space-y-4">
            <h2 className="font-display text-xl font-bold text-[#08090B]">Audit Log</h2>
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-2xl border border-[#08090B]/10 bg-[#FAF8F3] space-y-1 text-xs"
                >
                  <div className="font-mono font-bold text-[#00545F]">{log.action}</div>
                  <div className="text-[#08090B]">{log.details}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBVIEW 5: SETTINGS & DEMO DATA */}
      {subview === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 card-light p-6 sm:p-8 space-y-6">
            <h2 className="font-display text-xl font-bold text-[#08090B]">
              Campus Settings &amp; Demo Data
            </h2>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label htmlFor="inst-name-input" className="block text-xs font-bold text-[#08090B] mb-1">
                  Institution Name
                </label>
                <input
                  id="inst-name-input"
                  type="text"
                  value={instName}
                  onChange={(e) => setInstName(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FAF8F3] border border-[#08090B]/20 text-sm font-bold text-[#08090B]"
                />
              </div>

              <button
                type="submit"
                className="btn-tactile-lime min-h-[44px] px-5 py-2.5 text-xs"
              >
                Save Settings
              </button>
            </form>

            <div className="pt-6 border-t border-[#08090B]/10 space-y-3">
              <h3 className="font-display text-base font-bold text-[#08090B]">
                Demonstration Records
              </h3>
              <div className="flex flex-wrap gap-3">
                {!confirmClearDemo ? (
                  <button
                    type="button"
                    onClick={() => setConfirmClearDemo(true)}
                    className="btn-tactile-secondary min-h-[42px] px-4 py-2 text-xs flex items-center gap-1.5 text-[#FF4B4B]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Demo Records</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleClearDemoData}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-[#FF4B4B] text-white text-xs font-bold"
                  >
                    Confirm Clear Demo Records
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleRestoreDemoData}
                  className="btn-tactile-secondary min-h-[42px] px-4 py-2 text-xs"
                >
                  Restore Demo Records
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 card-dark p-6 sm:p-8 space-y-4">
            <h2 className="font-display text-xl font-bold text-[#CDF22B]">
              Supabase PostgreSQL Schema
            </h2>
            <pre className="p-4 rounded-2xl bg-black/50 border border-[#FAF8F3]/15 text-[11px] font-mono text-[#ECFFB6] overflow-x-auto max-h-[360px]">
              {sqlSchema || '-- Loading schema...'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
