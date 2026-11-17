import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import dotenv from 'dotenv';
import {
  calculateErlangC,
  generateStableIdentifier,
  calculateSessionDurationMinutes,
  aggregateWaitReports,
  compareInterventionBeforeAfter,
} from './src/utils/queueMath.ts';
import type {
  Profile,
  Area,
  QueueSession,
  WaitReport,
  ImprovementSuggestion,
  Intervention,
  AuditLog,
  InstitutionSettings,
  UserRole,
} from './src/types.ts';

dotenv.config();

interface StoredQueueSession extends QueueSession {
  secure_session_token_hash: string;
}

interface DatabaseSchema {
  profiles: Profile[];
  areas: Area[];
  mentor_areas: Array<{ mentor_id: string; area_id: string }>;
  queue_sessions: StoredQueueSession[];
  wait_reports: WaitReport[];
  improvement_suggestions: ImprovementSuggestion[];
  interventions: Intervention[];
  audit_logs: AuditLog[];
  settings: InstitutionSettings;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'timetax-db.json');

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createInitialSeedData(): DatabaseSchema {
  const now = new Date();
  const isoDaysAgo = (d: number, hoursOffset = 0) =>
    new Date(now.getTime() - d * 86400000 + hoursOffset * 3600000).toISOString();

  const profiles: Profile[] = [
    {
      id: 'usr-admin-1',
      display_name: 'Aarav Nair (Super Admin)',
      email: 'admin@timetax.edu.in',
      role: 'super_admin',
      department: 'Campus Operations & IT',
      is_active: true,
      created_at: isoDaysAgo(30),
    },
    {
      id: 'usr-mgmt-1',
      display_name: 'Dr. Meera Krishnan (Dean of Operations)',
      email: 'management@timetax.edu.in',
      role: 'management',
      department: 'Institutional Management',
      is_active: true,
      created_at: isoDaysAgo(28),
    },
    {
      id: 'usr-mentor-1',
      display_name: 'Prof. Rahul Menon (Faculty Mentor)',
      email: 'mentor@timetax.edu.in',
      role: 'mentor',
      department: 'Student Welfare & Services',
      is_active: true,
      created_at: isoDaysAgo(25),
    },
    {
      id: 'usr-mentor-2',
      display_name: 'Prof. Lakshmi Varma (Academic Coordinator)',
      email: 'lakshmi@timetax.edu.in',
      role: 'mentor',
      department: 'Academic Affairs',
      is_active: true,
      created_at: isoDaysAgo(22),
    },
    {
      id: 'usr-student-1',
      display_name: 'Diya Thomas',
      email: 'diya.student@timetax.edu.in',
      role: 'student',
      department: 'B.Tech Computer Science',
      is_active: true,
      created_at: isoDaysAgo(14),
    },
  ];

  const areas: Area[] = [
    {
      id: 'area-main-canteen',
      stable_identifier: 'main-canteen',
      name: 'Main Canteen',
      category: 'Dining & Food',
      description: 'Primary campus dining hall and meal token counter during lunch and break hours.',
      building: 'Student Activity Center',
      floor: 'Ground Floor',
      counters: 2,
      service_minutes: 3,
      operating_hours: '08:00 AM – 06:30 PM',
      assigned_mentor_id: 'usr-mentor-1',
      status: 'active',
      last_modified_by: 'Aarav Nair (Super Admin)',
      created_at: isoDaysAgo(20),
      updated_at: isoDaysAgo(2),
    },
    {
      id: 'area-library-counter',
      stable_identifier: 'library-counter',
      name: 'Library Counter',
      category: 'Academic & Library',
      description: 'Book circulation, reference clearance, and semester no-dues stamping desk.',
      building: 'Central Knowledge Block',
      floor: '1st Floor',
      counters: 2,
      service_minutes: 4,
      operating_hours: '08:30 AM – 08:00 PM',
      assigned_mentor_id: 'usr-mentor-2',
      status: 'active',
      last_modified_by: 'Aarav Nair (Super Admin)',
      created_at: isoDaysAgo(20),
      updated_at: isoDaysAgo(3),
    },
    {
      id: 'area-photocopy-centre',
      stable_identifier: 'photocopy-centre',
      name: 'Photocopy Centre',
      category: 'Printing & Reprographics',
      description: 'Lab record printing, spiral binding, and course material reprographics point.',
      building: 'Academic Block B',
      floor: 'Basement Level',
      counters: 1,
      service_minutes: 5,
      operating_hours: '09:00 AM – 05:30 PM',
      assigned_mentor_id: 'usr-mentor-1',
      status: 'active',
      last_modified_by: 'Aarav Nair (Super Admin)',
      created_at: isoDaysAgo(18),
      updated_at: isoDaysAgo(4),
    },
    {
      id: 'area-administration-office',
      stable_identifier: 'administration-office',
      name: 'Administration Office',
      category: 'Administration',
      description: 'Bonafide certificates, ID card re-issuance, scholarship attestation, and transcripts.',
      building: 'Heritage Main Block',
      floor: '2nd Floor',
      counters: 2,
      service_minutes: 6,
      operating_hours: '09:30 AM – 04:30 PM',
      assigned_mentor_id: 'usr-mentor-2',
      status: 'active',
      last_modified_by: 'Aarav Nair (Super Admin)',
      created_at: isoDaysAgo(18),
      updated_at: isoDaysAgo(5),
    },
    {
      id: 'area-fee-counter',
      stable_identifier: 'fee-counter',
      name: 'Fee Counter',
      category: 'Finance & Fees',
      description: 'Tuition receipt verification, exam fee challan clearance, and Caution Deposit desk.',
      building: 'Administrative Annex',
      floor: 'Ground Floor',
      counters: 1,
      service_minutes: 5,
      operating_hours: '09:30 AM – 03:30 PM',
      assigned_mentor_id: 'usr-mentor-1',
      status: 'active',
      last_modified_by: 'Aarav Nair (Super Admin)',
      created_at: isoDaysAgo(18),
      updated_at: isoDaysAgo(1),
    },
  ];

  const mentor_areas = [
    { mentor_id: 'usr-mentor-1', area_id: 'area-main-canteen' },
    { mentor_id: 'usr-mentor-1', area_id: 'area-photocopy-centre' },
    { mentor_id: 'usr-mentor-1', area_id: 'area-fee-counter' },
    { mentor_id: 'usr-mentor-2', area_id: 'area-library-counter' },
    { mentor_id: 'usr-mentor-2', area_id: 'area-administration-office' },
  ];

  // Labeled demonstration reports + realistic before/after history
  const wait_reports: WaitReport[] = [
    // Main Canteen reports (Peak lunch bottleneck)
    {
      id: 'rep-demo-1',
      area_id: 'area-main-canteen',
      user_id: 'usr-student-1',
      queue_session_id: null,
      duration_minutes: 18,
      reporting_source: 'qr_timer',
      feedback_note: 'Single token billing line backed up to the stairs during 12:45 PM lunch break.',
      issue_tag: 'Single billing queue',
      is_demo: true,
      created_at: isoDaysAgo(6, -2),
    },
    {
      id: 'rep-demo-2',
      area_id: 'area-main-canteen',
      user_id: null,
      queue_session_id: null,
      duration_minutes: 16,
      reporting_source: 'qr_timer',
      feedback_note: 'UPI scanner delay at meal token desk.',
      issue_tag: 'Payment delay',
      is_demo: true,
      created_at: isoDaysAgo(5, -1),
    },
    {
      id: 'rep-demo-3',
      area_id: 'area-main-canteen',
      user_id: 'usr-student-1',
      queue_session_id: null,
      duration_minutes: 14,
      reporting_source: 'manual',
      feedback_note: 'Long wait for pre-paid meal collection.',
      issue_tag: 'Peak hour surge',
      is_demo: true,
      created_at: isoDaysAgo(4, 1),
    },
    {
      id: 'rep-demo-4',
      area_id: 'area-main-canteen',
      user_id: null,
      queue_session_id: null,
      duration_minutes: 9,
      reporting_source: 'qr_timer',
      feedback_note: 'Faster after separate beverages counter opened.',
      issue_tag: null,
      is_demo: true,
      created_at: isoDaysAgo(2, 0),
    },
    {
      id: 'rep-demo-5',
      area_id: 'area-main-canteen',
      user_id: 'usr-student-1',
      queue_session_id: null,
      duration_minutes: 8,
      reporting_source: 'qr_timer',
      feedback_note: 'Express token lane helped reduce lunch wait.',
      issue_tag: null,
      is_demo: true,
      created_at: isoDaysAgo(1, -1),
    },
    {
      id: 'rep-demo-6',
      area_id: 'area-main-canteen',
      user_id: null,
      queue_session_id: null,
      duration_minutes: 7,
      reporting_source: 'manual',
      feedback_note: null,
      issue_tag: null,
      is_demo: true,
      created_at: isoDaysAgo(0, -3),
    },

    // Photocopy Centre reports (High wait due to 1 counter)
    {
      id: 'rep-demo-7',
      area_id: 'area-photocopy-centre',
      user_id: 'usr-student-1',
      queue_session_id: null,
      duration_minutes: 22,
      reporting_source: 'qr_timer',
      feedback_note: 'Students printing 60-page lab manuals block quick 2-page printouts.',
      issue_tag: 'Bulk binding bottleneck',
      is_demo: true,
      created_at: isoDaysAgo(4, -2),
    },
    {
      id: 'rep-demo-8',
      area_id: 'area-photocopy-centre',
      user_id: null,
      queue_session_id: null,
      duration_minutes: 19,
      reporting_source: 'manual',
      feedback_note: 'Only one operator handling both spiral binding and photocopy.',
      issue_tag: 'Single counter',
      is_demo: true,
      created_at: isoDaysAgo(2, 2),
    },
    {
      id: 'rep-demo-9',
      area_id: 'area-photocopy-centre',
      user_id: null,
      queue_session_id: null,
      duration_minutes: 15,
      reporting_source: 'qr_timer',
      feedback_note: null,
      issue_tag: 'Bulk binding bottleneck',
      is_demo: true,
      created_at: isoDaysAgo(1, 1),
    },

    // Fee Counter reports
    {
      id: 'rep-demo-10',
      area_id: 'area-fee-counter',
      user_id: 'usr-student-1',
      queue_session_id: null,
      duration_minutes: 14,
      reporting_source: 'qr_timer',
      feedback_note: 'Manual ledger entry for every online fee receipt.',
      issue_tag: 'Manual verification',
      is_demo: true,
      created_at: isoDaysAgo(3, -1),
    },
    {
      id: 'rep-demo-11',
      area_id: 'area-fee-counter',
      user_id: null,
      queue_session_id: null,
      duration_minutes: 12,
      reporting_source: 'manual',
      feedback_note: 'Queue builds up right before 1:00 PM lunch closure.',
      issue_tag: 'Peak hour surge',
      is_demo: true,
      created_at: isoDaysAgo(1, -2),
    },

    // Administration Office reports
    {
      id: 'rep-demo-12',
      area_id: 'area-administration-office',
      user_id: null,
      queue_session_id: null,
      duration_minutes: 11,
      reporting_source: 'qr_timer',
      feedback_note: 'Bonafide certificate signature requires waiting at window 2.',
      issue_tag: 'Paperwork verification',
      is_demo: true,
      created_at: isoDaysAgo(3, 2),
    },
    {
      id: 'rep-demo-13',
      area_id: 'area-administration-office',
      user_id: 'usr-student-1',
      queue_session_id: null,
      duration_minutes: 9,
      reporting_source: 'manual',
      feedback_note: null,
      issue_tag: null,
      is_demo: true,
      created_at: isoDaysAgo(0, -5),
    },

    // Library Counter reports
    {
      id: 'rep-demo-14',
      area_id: 'area-library-counter',
      user_id: 'usr-student-1',
      queue_session_id: null,
      duration_minutes: 5,
      reporting_source: 'qr_timer',
      feedback_note: 'Barcode scanner at Desk 1 is very fast.',
      issue_tag: null,
      is_demo: true,
      created_at: isoDaysAgo(2, -3),
    },
    {
      id: 'rep-demo-15',
      area_id: 'area-library-counter',
      user_id: null,
      queue_session_id: null,
      duration_minutes: 4,
      reporting_source: 'qr_timer',
      feedback_note: null,
      issue_tag: null,
      is_demo: true,
      created_at: isoDaysAgo(0, -2),
    },
  ];

  const improvement_suggestions: ImprovementSuggestion[] = [
    {
      id: 'sug-1',
      area_id: 'area-main-canteen',
      mentor_id: 'usr-mentor-1',
      title: 'Separate Express Pre-Paid Token Pickup Lane',
      description:
        'During 12:30 PM – 1:30 PM, students picking up pre-booked meals wait in the same queue as cash/UPI custom orders, creating an 16–18 minute bottleneck.',
      proposed_solution:
        'Dedicate Counter 2 exclusively to pre-paid QR token collection during peak lunch hours (12:15 PM – 1:45 PM).',
      priority: 'High',
      estimated_cost: 4500,
      supporting_observation:
        'Observed 42 students waiting >15 mins across 3 consecutive lunch periods; 60% only needed a pre-paid thali token.',
      status: 'Implemented',
      management_response:
        'Approved and deployed with signage on Counter 2. Monitoring post-intervention wait times.',
      created_at: isoDaysAgo(7),
      updated_at: isoDaysAgo(3),
    },
    {
      id: 'sug-2',
      area_id: 'area-photocopy-centre',
      mentor_id: 'usr-mentor-1',
      title: 'Split Bulk Lab Record Binding from Quick Print Queue',
      description:
        'A single 60-page lab record print + spiral binding job takes 8–10 minutes and blocks 10+ students who only need a 2-page hall ticket or form printed.',
      proposed_solution:
        'Introduce a drop-off token tray for >15 page binding jobs (pickup in 30 mins) and keep the window counter for <10 page instant prints.',
      priority: 'Critical',
      estimated_cost: 2000,
      supporting_observation:
        'Average wait spikes to 20.5 minutes on lab submission days despite moderate arrival rate.',
      status: 'Submitted',
      management_response: null,
      created_at: isoDaysAgo(2),
      updated_at: isoDaysAgo(2),
    },
    {
      id: 'sug-3',
      area_id: 'area-fee-counter',
      mentor_id: 'usr-mentor-1',
      title: 'Automated Digital Receipt Verification QR Stamp',
      description:
        'Students who already paid fees online still wait 12–14 minutes at the Fee Counter just to get a physical rubber stamp on their exam registration slip.',
      proposed_solution:
        'Sync online payment portal batch CSV with department faculty advisors so students do not need to queue at the physical Fee Counter.',
      priority: 'High',
      estimated_cost: 0,
      supporting_observation:
        '78% of Fee Counter visitors on Tuesday were online payers seeking physical verification stamps.',
      status: 'Under Review',
      management_response:
        'Reviewing with Finance Officer to accept digital transaction IDs directly at department level.',
      created_at: isoDaysAgo(4),
      updated_at: isoDaysAgo(1),
    },
  ];

  const interventions: Intervention[] = [
    {
      id: 'int-1',
      suggestion_id: 'sug-1',
      area_id: 'area-main-canteen',
      title: 'Express Pre-Paid Lunch Counter Split (Counter 2)',
      description:
        'Reconfigured Counter 2 as an Express Token Lane from 12:15 PM to 1:45 PM daily with dedicated UPI QR standee.',
      assigned_to: 'usr-mentor-1',
      assigned_to_name: 'Prof. Rahul Menon (Faculty Mentor)',
      estimated_cost: 4500,
      approved_by: 'usr-mgmt-1',
      approved_by_name: 'Dr. Meera Krishnan (Dean of Operations)',
      implementation_date: isoDaysAgo(3),
      status: 'Implemented',
      baseline_wait_minutes: 16.0,
      created_at: isoDaysAgo(4),
    },
  ];

  const audit_logs: AuditLog[] = [
    {
      id: 'aud-1',
      actor_id: 'usr-admin-1',
      actor_name: 'Aarav Nair (Super Admin)',
      actor_role: 'super_admin',
      action: 'INITIALIZE_CAMPUS_AREAS',
      entity_type: 'areas',
      entity_id: 'campus-seed',
      details: 'Configured 5 primary campus service points with permanent QR identifiers.',
      created_at: isoDaysAgo(20),
    },
    {
      id: 'aud-2',
      actor_id: 'usr-mgmt-1',
      actor_name: 'Dr. Meera Krishnan (Dean of Operations)',
      actor_role: 'management',
      action: 'APPROVE_INTERVENTION',
      entity_type: 'interventions',
      entity_id: 'int-1',
      details: 'Approved Express Pre-Paid Lunch Counter Split for Main Canteen.',
      created_at: isoDaysAgo(4),
    },
  ];

  const settings: InstitutionSettings = {
    institution_name: 'K6 Institute of Science & Technology',
    tagline: 'Your time is worth more.',
    timezone: 'Asia/Kolkata',
    language_default: 'en',
    max_report_minutes: 180,
    rate_limit_per_hour: 30,
    demo_mode_enabled: true,
    categories: [
      'Dining & Food',
      'Academic & Library',
      'Administration',
      'Finance & Fees',
      'Printing & Reprographics',
      'Labs & Innovation',
      'Student Services',
    ],
    supabase_connected: Boolean(
      process.env.SUPABASE_URL &&
        (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)
    ),
  };

  return {
    profiles,
    areas,
    mentor_areas,
    queue_sessions: [],
    wait_reports,
    improvement_suggestions,
    interventions,
    audit_logs,
    settings,
  };
}

function loadDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as DatabaseSchema;
      parsed.settings.supabase_connected = Boolean(
        process.env.SUPABASE_URL &&
          (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)
      );
      return parsed;
    }
  } catch (err) {
    console.error('Error loading local database file, initializing fresh store:', err);
  }
  const initial = createInitialSeedData();
  saveDatabase(initial);
  return initial;
}

function saveDatabase(db: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist database:', err);
  }
}

const db = loadDatabase();

// Active auth tokens in memory + deterministic HMAC signed token support so restarts don't log users out
const AUTH_SECRET = process.env.AUTH_SECRET || 'timetax-k6-buildathon-hmac-secret-2026';

function createAuthToken(userId: string): string {
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(userId).digest('hex');
  return `${userId}.${sig}`;
}

function verifyAuthToken(token: string): Profile | null {
  if (!token || !token.includes('.')) return null;
  const [userId, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', AUTH_SECRET).update(userId).digest('hex');
  if (sig !== expected) return null;
  const user = db.profiles.find((p) => p.id === userId && p.is_active);
  return user || null;
}

interface AuthenticatedRequest extends Request {
  currentUser?: Profile | null;
}

function attachUserMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    req.currentUser = verifyAuthToken(token);
  } else {
    req.currentUser = null;
  }
  next();
}

function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.currentUser) {
      return res.status(401).json({
        error: 'Authentication required. Please sign in to perform this action.',
      });
    }
    if (!allowedRoles.includes(req.currentUser.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}. Current role: ${req.currentUser.role}.`,
      });
    }
    next();
  };
}

// Simple rate limiter & duplicate submission guard
const submissionHistory = new Map<string, number[]>();
const lastReportSignature = new Map<string, { sig: string; ts: number }>();

function checkRateLimitAndDuplicate(
  clientKey: string,
  signature: string,
  maxPerHour: number
): { allowed: boolean; error?: string } {
  const now = Date.now();
  const prevSig = lastReportSignature.get(clientKey);
  if (prevSig && prevSig.sig === signature && now - prevSig.ts < 5000) {
    return {
      allowed: false,
      error: 'Duplicate report detected. Your waiting time was just recorded moments ago.',
    };
  }

  const timestamps = (submissionHistory.get(clientKey) || []).filter(
    (t) => now - t < 3600_000
  );
  if (timestamps.length >= maxPerHour) {
    return {
      allowed: false,
      error: `Rate limit reached (${maxPerHour} reports per hour). Please wait before submitting again.`,
    };
  }

  timestamps.push(now);
  submissionHistory.set(clientKey, timestamps);
  lastReportSignature.set(clientKey, { sig: signature, ts: now });
  return { allowed: true };
}

function recordAudit(
  actor: Profile,
  action: string,
  entityType: string,
  entityId: string,
  details: string
) {
  const entry: AuditLog = {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    actor_id: actor.id,
    actor_name: actor.display_name,
    actor_role: actor.role,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
    created_at: new Date().toISOString(),
  };
  db.audit_logs.unshift(entry);
}

function enrichArea(area: Area): Area {
  const mentor = db.profiles.find((p) => p.id === area.assigned_mentor_id);
  const areaReports = db.wait_reports.filter(
    (r) =>
      r.area_id === area.id &&
      (db.settings.demo_mode_enabled || !r.is_demo)
  );
  const liveReports = areaReports.filter((r) => !r.is_demo);
  const demoReports = areaReports.filter((r) => r.is_demo);
  const totalMins = areaReports.reduce((acc, r) => acc + Number(r.duration_minutes), 0);
  const avgWait =
    areaReports.length > 0 ? Number((totalMins / areaReports.length).toFixed(1)) : 0;
  const activeQueues = db.queue_sessions.filter(
    (s) => s.area_id === area.id && s.status === 'active'
  ).length;

  return {
    ...area,
    assigned_mentor_name: mentor ? mentor.display_name : null,
    report_count: areaReports.length,
    live_report_count: liveReports.length,
    demo_report_count: demoReports.length,
    avg_wait_minutes: avgWait,
    active_queue_count: activeQueues,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(attachUserMiddleware);

  // --- AUTHENTICATION API ---
  app.get('/api/auth/me', (req: AuthenticatedRequest, res) => {
    res.json({
      user: req.currentUser || null,
      settings: db.settings,
      availableDemoAccounts: db.profiles
        .filter((p) => p.is_active)
        .map((p) => ({
          id: p.id,
          display_name: p.display_name,
          email: p.email,
          role: p.role,
          department: p.department,
        })),
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, userId } = req.body || {};
    let user: Profile | undefined;
    if (userId) {
      user = db.profiles.find((p) => p.id === userId);
    } else if (email) {
      user = db.profiles.find(
        (p) => p.email.toLowerCase() === String(email).trim().toLowerCase()
      );
    }

    if (!user) {
      return res.status(404).json({
        error: 'No account found with that email address. Use one of the registered campus accounts.',
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        error: 'This user account has been disabled by an administrator.',
      });
    }

    const token = createAuthToken(user.id);
    res.json({
      token,
      user,
    });
  });

  // --- PUBLIC & ADMIN AREAS API ---
  app.get('/api/areas', (req: AuthenticatedRequest, res) => {
    const includeArchived = req.query.includeArchived === 'true';
    const list = db.areas
      .filter((a) => includeArchived || a.status !== 'archived')
      .map(enrichArea);
    res.json({ areas: list });
  });

  app.get('/api/areas/:idOrSlug', (req, res) => {
    const key = String(req.params.idOrSlug).toLowerCase();
    const area = db.areas.find(
      (a) => a.id.toLowerCase() === key || a.stable_identifier.toLowerCase() === key
    );
    if (!area) {
      return res.status(404).json({ error: 'Campus service area not found.' });
    }
    res.json({ area: enrichArea(area) });
  });

  app.post(
    '/api/areas',
    requireRole(['super_admin']),
    (req: AuthenticatedRequest, res: Response) => {
      const {
        name,
        category,
        description,
        building,
        floor,
        counters,
        service_minutes,
        operating_hours,
        assigned_mentor_id,
        status,
      } = req.body || {};

      if (!name || String(name).trim().length < 2) {
        return res.status(400).json({ error: 'Area name is required (at least 2 characters).' });
      }
      if (!building || String(building).trim().length < 2) {
        return res.status(400).json({ error: 'Building name is required.' });
      }

      const numCounters = Math.max(1, Number(counters) || 1);
      const numServiceMins = Math.max(0.5, Number(service_minutes) || 3);

      // Never reuse identifiers even of archived areas
      const existingIdentifiers = db.areas.map((a) => a.stable_identifier);
      const stable_identifier = generateStableIdentifier(String(name), existingIdentifiers);
      const nowIso = new Date().toISOString();

      const newArea: Area = {
        id: `area-${stable_identifier}-${Date.now().toString(36)}`,
        stable_identifier,
        name: String(name).trim(),
        category: String(category || 'Student Services').trim(),
        description: String(description || 'Campus service point monitored by TIME TAX.').trim(),
        building: String(building).trim(),
        floor: String(floor || 'Ground Floor').trim(),
        counters: numCounters,
        service_minutes: numServiceMins,
        operating_hours: String(operating_hours || '09:00 AM – 05:00 PM').trim(),
        assigned_mentor_id: assigned_mentor_id || null,
        status: status === 'inactive' ? 'inactive' : 'active',
        last_modified_by: req.currentUser!.display_name,
        created_at: nowIso,
        updated_at: nowIso,
      };

      db.areas.unshift(newArea);

      if (assigned_mentor_id) {
        const exists = db.mentor_areas.some(
          (ma) => ma.mentor_id === assigned_mentor_id && ma.area_id === newArea.id
        );
        if (!exists) {
          db.mentor_areas.push({ mentor_id: assigned_mentor_id, area_id: newArea.id });
        }
      }

      recordAudit(
        req.currentUser!,
        'CREATE_AREA',
        'areas',
        newArea.id,
        `Created area "${newArea.name}" with permanent QR identifier /q/${newArea.stable_identifier}`
      );
      saveDatabase(db);

      res.status(201).json({ area: enrichArea(newArea) });
    }
  );

  app.patch(
    '/api/areas/:id',
    requireRole(['super_admin']),
    (req: AuthenticatedRequest, res: Response) => {
      const area = db.areas.find((a) => a.id === req.params.id);
      if (!area) {
        return res.status(404).json({ error: 'Area not found.' });
      }

      const {
        name,
        category,
        description,
        building,
        floor,
        counters,
        service_minutes,
        operating_hours,
        assigned_mentor_id,
        status,
      } = req.body || {};

      if (name !== undefined) {
        if (String(name).trim().length < 2) {
          return res.status(400).json({ error: 'Area name must be at least 2 characters.' });
        }
        // Notice: renaming an area preserves area.stable_identifier so printed QR codes never break!
        area.name = String(name).trim();
      }
      if (category !== undefined) area.category = String(category).trim();
      if (description !== undefined) area.description = String(description).trim();
      if (building !== undefined) area.building = String(building).trim();
      if (floor !== undefined) area.floor = String(floor).trim();
      if (counters !== undefined) area.counters = Math.max(1, Number(counters) || 1);
      if (service_minutes !== undefined)
        area.service_minutes = Math.max(0.5, Number(service_minutes) || 1);
      if (operating_hours !== undefined) area.operating_hours = String(operating_hours).trim();
      if (assigned_mentor_id !== undefined) {
        area.assigned_mentor_id = assigned_mentor_id || null;
        db.mentor_areas = db.mentor_areas.filter((ma) => ma.area_id !== area.id);
        if (assigned_mentor_id) {
          db.mentor_areas.push({ mentor_id: assigned_mentor_id, area_id: area.id });
        }
      }
      if (status && ['active', 'inactive', 'archived'].includes(status)) {
        area.status = status;
      }

      area.last_modified_by = req.currentUser!.display_name;
      area.updated_at = new Date().toISOString();

      recordAudit(
        req.currentUser!,
        'UPDATE_AREA',
        'areas',
        area.id,
        `Updated area "${area.name}" (status: ${area.status}, QR slug /q/${area.stable_identifier} preserved)`
      );
      saveDatabase(db);

      res.json({ area: enrichArea(area) });
    }
  );

  // --- QR CODE GENERATION API ---
  app.get('/api/qr/:idOrSlug', async (req, res) => {
    try {
      const key = String(req.params.idOrSlug).toLowerCase();
      const area = db.areas.find(
        (a) => a.id.toLowerCase() === key || a.stable_identifier.toLowerCase() === key
      );
      if (!area) {
        return res.status(404).json({ error: 'Area not found for QR code generation.' });
      }

      const origin =
        String(req.query.origin || '').trim() ||
        process.env.APP_URL ||
        `${req.protocol}://${req.get('host')}`;
      const cleanOrigin = origin.replace(/\/+$/, '');
      const destinationUrl = `${cleanOrigin}/q/${area.stable_identifier}`;

      const variant = String(req.query.variant || 'obsidian');
      const darkColor = variant === 'ivory' ? '#021E18' : '#021E18';
      const lightColor = variant === 'ivory' ? '#FAF8F3' : '#FFFFFF';

      const svgString = await QRCode.toString(destinationUrl, {
        type: 'svg',
        margin: 2,
        width: 320,
        errorCorrectionLevel: 'H',
        color: {
          dark: darkColor,
          light: lightColor,
        },
      });

      const pngDataUrl = await QRCode.toDataURL(destinationUrl, {
        margin: 2,
        width: 600,
        errorCorrectionLevel: 'H',
        color: {
          dark: darkColor,
          light: lightColor,
        },
      });

      res.json({
        area: enrichArea(area),
        destinationUrl,
        svg: svgString,
        pngDataUrl,
      });
    } catch (err) {
      console.error('QR generation failed:', err);
      res.status(500).json({ error: 'Failed to generate QR code.' });
    }
  });

  // --- QUEUE SESSIONS API (QR SCANNING END-TO-END FLOW) ---
  app.post('/api/queue-sessions/start', (req: AuthenticatedRequest, res) => {
    const { areaIdOrSlug } = req.body || {};
    if (!areaIdOrSlug) {
      return res.status(400).json({ error: 'Area identifier is required to start a timer.' });
    }

    const key = String(areaIdOrSlug).toLowerCase();
    const area = db.areas.find(
      (a) => a.id.toLowerCase() === key || a.stable_identifier.toLowerCase() === key
    );

    if (!area) {
      return res.status(404).json({ error: 'This service area QR code was not found.' });
    }
    if (area.status === 'archived') {
      return res.status(410).json({
        error: `"${area.name}" has been archived by campus administration and is no longer accepting waiting sessions.`,
      });
    }
    if (area.status === 'inactive') {
      return res.status(400).json({
        error: `"${area.name}" is currently marked inactive (outside operating hours or closed).`,
      });
    }

    const sessionToken = crypto.randomBytes(24).toString('hex');
    const tokenHash = hashToken(sessionToken);
    const nowIso = new Date().toISOString();

    const session: StoredQueueSession = {
      id: `qs-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      area_id: area.id,
      area_stable_identifier: area.stable_identifier,
      area_name: area.name,
      user_id: req.currentUser ? req.currentUser.id : null,
      secure_session_token_hash: tokenHash,
      started_at: nowIso,
      ended_at: null,
      status: 'active',
      duration_minutes: null,
    };

    db.queue_sessions.unshift(session);
    saveDatabase(db);

    const { secure_session_token_hash: _, ...publicSession } = session;
    res.status(201).json({
      session: publicSession,
      sessionToken,
    });
  });

  app.get('/api/queue-sessions/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const token = String(req.query.token || '');
    const session = db.queue_sessions.find((s) => s.id === sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Queue session not found.' });
    }

    if (!token || hashToken(token) !== session.secure_session_token_hash) {
      return res.status(403).json({
        error: 'Invalid or missing session token. Only the device that started this queue timer can access it.',
      });
    }

    const { secure_session_token_hash: _, ...publicSession } = session;
    res.json({ session: publicSession });
  });

  app.post('/api/queue-sessions/:sessionId/complete', (req: AuthenticatedRequest, res) => {
    const { sessionId } = req.params;
    const { sessionToken, feedback_note, issue_tag } = req.body || {};

    const session = db.queue_sessions.find((s) => s.id === sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Waiting session not found.' });
    }

    if (!sessionToken || hashToken(String(sessionToken)) !== session.secure_session_token_hash) {
      return res.status(403).json({
        error: 'Unauthorized session token. Cannot complete a waiting session started by another device.',
      });
    }

    // Atomic check to prevent duplicate completion
    if (session.status === 'completed') {
      return res.status(409).json({
        error: 'This waiting session has already been completed and recorded.',
      });
    }
    if (session.status !== 'active') {
      return res.status(400).json({
        error: `Cannot complete a session with status "${session.status}".`,
      });
    }

    // Check duplicate report for this queue_session_id
    const existingReport = db.wait_reports.find((r) => r.queue_session_id === session.id);
    if (existingReport) {
      return res.status(409).json({
        error: 'A report has already been generated for this queue session.',
      });
    }

    const endedAtIso = new Date().toISOString();
    const durationMinutes = calculateSessionDurationMinutes(session.started_at, endedAtIso);

    session.status = 'completed';
    session.ended_at = endedAtIso;
    session.duration_minutes = durationMinutes;

    const area = db.areas.find((a) => a.id === session.area_id);
    const report: WaitReport = {
      id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      area_id: session.area_id,
      area_name: area?.name || session.area_name,
      area_category: area?.category || 'General',
      user_id: req.currentUser ? req.currentUser.id : session.user_id,
      queue_session_id: session.id,
      duration_minutes: durationMinutes,
      reporting_source: 'qr_timer',
      feedback_note: feedback_note ? String(feedback_note).trim() : null,
      issue_tag: issue_tag ? String(issue_tag).trim() : null,
      is_demo: false,
      created_at: endedAtIso,
    };

    db.wait_reports.unshift(report);
    saveDatabase(db);

    const { secure_session_token_hash: _, ...publicSession } = session;
    res.json({
      session: publicSession,
      report,
    });
  });

  app.post('/api/queue-sessions/:sessionId/cancel', (req, res) => {
    const { sessionId } = req.params;
    const { sessionToken, reason } = req.body || {};

    const session = db.queue_sessions.find((s) => s.id === sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Waiting session not found.' });
    }

    if (!sessionToken || hashToken(String(sessionToken)) !== session.secure_session_token_hash) {
      return res.status(403).json({ error: 'Invalid session token.' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ error: `Session is already ${session.status}.` });
    }

    session.status = 'cancelled';
    session.ended_at = new Date().toISOString();
    session.cancel_reason = reason ? String(reason).trim() : 'Left queue before being served';
    saveDatabase(db);

    const { secure_session_token_hash: _, ...publicSession } = session;
    res.json({ session: publicSession });
  });

  // --- MANUAL WAIT REPORTING & STUDENT HISTORY API ---
  app.post('/api/reports', (req: AuthenticatedRequest, res) => {
    const { area_id, duration_minutes, feedback_note, issue_tag } = req.body || {};

    if (!area_id) {
      return res.status(400).json({ error: 'Please select a campus service area.' });
    }

    const area = db.areas.find(
      (a) => a.id === area_id || a.stable_identifier === area_id
    );
    if (!area) {
      return res.status(404).json({ error: 'Selected service area does not exist.' });
    }
    if (area.status !== 'active') {
      return res.status(400).json({
        error: `"${area.name}" is currently ${area.status} and cannot receive new reports.`,
      });
    }

    const mins = Number(duration_minutes);
    if (!Number.isFinite(mins) || mins < 1 || mins > db.settings.max_report_minutes) {
      return res.status(400).json({
        error: `Please enter a valid waiting time between 1 and ${db.settings.max_report_minutes} minutes.`,
      });
    }

    const clientKey = req.currentUser?.id || req.ip || 'anonymous-guest';
    const sig = `${area.id}:${mins}:${feedback_note || ''}`;
    const check = checkRateLimitAndDuplicate(clientKey, sig, db.settings.rate_limit_per_hour);
    if (!check.allowed) {
      return res.status(429).json({ error: check.error });
    }

    const report: WaitReport = {
      id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      area_id: area.id,
      area_name: area.name,
      area_category: area.category,
      user_id: req.currentUser ? req.currentUser.id : null,
      queue_session_id: null,
      duration_minutes: Math.round(mins * 10) / 10,
      reporting_source: 'manual',
      feedback_note: feedback_note ? String(feedback_note).trim() : null,
      issue_tag: issue_tag ? String(issue_tag).trim() : null,
      is_demo: false,
      created_at: new Date().toISOString(),
    };

    db.wait_reports.unshift(report);
    saveDatabase(db);

    res.status(201).json({ report });
  });

  // Personal student reports (strictly scoped to the authenticated student)
  app.get(
    '/api/student/overview',
    requireRole(['student', 'mentor', 'management', 'super_admin']),
    (req: AuthenticatedRequest, res) => {
      const userId = req.currentUser!.id;
      const myReports = db.wait_reports
        .filter((r) => r.user_id === userId && (db.settings.demo_mode_enabled || !r.is_demo))
        .map((r) => {
          const area = db.areas.find((a) => a.id === r.area_id);
          return {
            ...r,
            area_name: area?.name || r.area_name || 'Campus Area',
            area_category: area?.category || r.area_category || 'General',
          };
        });

      const weekCutoff = Date.now() - 7 * 86400_000;
      const weekMinutes = myReports
        .filter((r) => new Date(r.created_at).getTime() >= weekCutoff)
        .reduce((acc, r) => acc + Number(r.duration_minutes), 0);

      const totalMinutes = myReports.reduce((acc, r) => acc + Number(r.duration_minutes), 0);

      res.json({
        reports: myReports,
        weekMinutes: Number(weekMinutes.toFixed(1)),
        totalMinutes: Number(totalMinutes.toFixed(1)),
        reportCount: myReports.length,
      });
    }
  );

  // --- PUBLIC & INSTITUTIONAL LIVE ANALYTICS API ---
  app.get('/api/analytics', (req, res) => {
    const days = req.query.days !== undefined ? Number(req.query.days) : 7;
    const includeDemoParam = req.query.includeDemo;
    const includeDemo =
      includeDemoParam !== undefined
        ? includeDemoParam === 'true'
        : db.settings.demo_mode_enabled;

    const analytics = aggregateWaitReports(db.wait_reports, db.areas, {
      days,
      includeDemo,
    });

    const interventionComparisons = db.interventions.map((intv) => {
      const area = db.areas.find((a) => a.id === intv.area_id);
      const comparison = compareInterventionBeforeAfter(
        db.wait_reports,
        intv.area_id,
        intv.implementation_date,
        includeDemo
      );
      return {
        intervention: {
          ...intv,
          area_name: area?.name || intv.area_name || 'Campus Area',
        },
        comparison,
      };
    });

    // Recent anonymized activity feed (no private student identity exposed)
    const recentFeed = db.wait_reports
      .filter((r) => includeDemo || !r.is_demo)
      .slice(0, 12)
      .map((r) => {
        const area = db.areas.find((a) => a.id === r.area_id);
        return {
          id: r.id,
          area_id: r.area_id,
          area_name: area?.name || r.area_name || 'Campus Area',
          duration_minutes: r.duration_minutes,
          reporting_source: r.reporting_source,
          issue_tag: r.issue_tag,
          feedback_note: r.feedback_note,
          is_demo: r.is_demo,
          created_at: r.created_at,
        };
      });

    res.json({
      analytics,
      interventionComparisons,
      recentFeed,
      demoModeEnabled: db.settings.demo_mode_enabled,
      supabaseConnected: db.settings.supabase_connected,
    });
  });

  // --- MENTOR SUGGESTIONS & FEEDBACK API ---
  app.get(
    '/api/suggestions',
    requireRole(['mentor', 'management', 'super_admin']),
    (req: AuthenticatedRequest, res) => {
      const enriched = db.improvement_suggestions.map((s) => {
        const area = db.areas.find((a) => a.id === s.area_id);
        const mentor = db.profiles.find((p) => p.id === s.mentor_id);
        return {
          ...s,
          area_name: area?.name || s.area_name || 'Campus Area',
          mentor_name: mentor?.display_name || s.mentor_name || 'Faculty Mentor',
        };
      });

      const assignedAreaIds = db.areas
        .filter((a) => a.assigned_mentor_id === req.currentUser!.id)
        .map((a) => a.id);

      // Aggregated student feedback notes by area (never exposing student personal emails/IDs)
      const feedbackSummaries = db.wait_reports
        .filter((r) => (r.feedback_note || r.issue_tag) && (db.settings.demo_mode_enabled || !r.is_demo))
        .slice(0, 25)
        .map((r) => {
          const area = db.areas.find((a) => a.id === r.area_id);
          return {
            id: r.id,
            area_id: r.area_id,
            area_name: area?.name || 'Campus Area',
            duration_minutes: r.duration_minutes,
            issue_tag: r.issue_tag,
            feedback_note: r.feedback_note,
            is_demo: r.is_demo,
            created_at: r.created_at,
          };
        });

      res.json({
        suggestions: enriched,
        assignedAreaIds,
        feedbackSummaries,
      });
    }
  );

  app.post(
    '/api/suggestions',
    requireRole(['mentor', 'super_admin']),
    (req: AuthenticatedRequest, res) => {
      const {
        area_id,
        title,
        description,
        proposed_solution,
        priority,
        estimated_cost,
        supporting_observation,
        status,
      } = req.body || {};

      if (!area_id || !title || !description || !proposed_solution) {
        return res.status(400).json({
          error: 'Area, issue title, problem description, and proposed solution are required.',
        });
      }

      const area = db.areas.find((a) => a.id === area_id);
      if (!area) {
        return res.status(404).json({ error: 'Selected campus area not found.' });
      }

      const nowIso = new Date().toISOString();
      const newSuggestion: ImprovementSuggestion = {
        id: `sug-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        area_id: area.id,
        area_name: area.name,
        mentor_id: req.currentUser!.id,
        mentor_name: req.currentUser!.display_name,
        title: String(title).trim(),
        description: String(description).trim(),
        proposed_solution: String(proposed_solution).trim(),
        priority: ['Low', 'Medium', 'High', 'Critical'].includes(priority) ? priority : 'High',
        estimated_cost:
          estimated_cost !== undefined && estimated_cost !== '' && estimated_cost !== null
            ? Number(estimated_cost)
            : null,
        supporting_observation: String(supporting_observation || '').trim(),
        status: status === 'Draft' ? 'Draft' : 'Submitted',
        management_response: null,
        created_at: nowIso,
        updated_at: nowIso,
      };

      db.improvement_suggestions.unshift(newSuggestion);
      recordAudit(
        req.currentUser!,
        'SUBMIT_SUGGESTION',
        'improvement_suggestions',
        newSuggestion.id,
        `Submitted improvement proposal "${newSuggestion.title}" for ${area.name}`
      );
      saveDatabase(db);

      res.status(201).json({ suggestion: newSuggestion });
    }
  );

  app.patch(
    '/api/suggestions/:id',
    requireRole(['mentor', 'management', 'super_admin']),
    (req: AuthenticatedRequest, res) => {
      const sug = db.improvement_suggestions.find((s) => s.id === req.params.id);
      if (!sug) {
        return res.status(404).json({ error: 'Suggestion not found.' });
      }

      const { status, management_response } = req.body || {};

      // Mentors can only submit their own Drafts; Management/Super Admin can review/approve/reject
      if (req.currentUser!.role === 'mentor') {
        if (sug.mentor_id !== req.currentUser!.id) {
          return res.status(403).json({ error: 'You can only update your own suggestions.' });
        }
        if (status === 'Submitted' && sug.status === 'Draft') {
          sug.status = 'Submitted';
        }
      } else {
        if (
          status &&
          ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Implemented'].includes(
            status
          )
        ) {
          sug.status = status;
        }
        if (management_response !== undefined) {
          sug.management_response = String(management_response).trim();
        }
      }

      sug.updated_at = new Date().toISOString();
      recordAudit(
        req.currentUser!,
        'UPDATE_SUGGESTION_STATUS',
        'improvement_suggestions',
        sug.id,
        `Updated suggestion "${sug.title}" status to ${sug.status}`
      );
      saveDatabase(db);

      res.json({ suggestion: sug });
    }
  );

  // --- MANAGEMENT INTERVENTIONS & ERLANG C SIMULATOR API ---
  app.get(
    '/api/interventions',
    requireRole(['management', 'super_admin', 'mentor']),
    (_req, res) => {
      const list = db.interventions.map((intv) => {
        const area = db.areas.find((a) => a.id === intv.area_id);
        const assignee = db.profiles.find((p) => p.id === intv.assigned_to);
        const approver = db.profiles.find((p) => p.id === intv.approved_by);
        const comparison = compareInterventionBeforeAfter(
          db.wait_reports,
          intv.area_id,
          intv.implementation_date,
          db.settings.demo_mode_enabled
        );
        return {
          ...intv,
          area_name: area?.name || intv.area_name || 'Campus Area',
          assigned_to_name: assignee?.display_name || intv.assigned_to_name || 'Assigned Mentor',
          approved_by_name: approver?.display_name || intv.approved_by_name || 'Management',
          comparison,
        };
      });
      res.json({ interventions: list });
    }
  );

  app.post(
    '/api/interventions',
    requireRole(['management', 'super_admin']),
    (req: AuthenticatedRequest, res) => {
      const {
        suggestion_id,
        area_id,
        title,
        description,
        assigned_to,
        estimated_cost,
        implementation_date,
        status,
      } = req.body || {};

      if (!area_id || !title) {
        return res.status(400).json({ error: 'Area and intervention title are required.' });
      }

      const area = db.areas.find((a) => a.id === area_id);
      if (!area) {
        return res.status(404).json({ error: 'Target area not found.' });
      }

      const enrichedArea = enrichArea(area);
      const assignee = db.profiles.find((p) => p.id === assigned_to);
      const nowIso = new Date().toISOString();

      const newIntervention: Intervention = {
        id: `int-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        suggestion_id: suggestion_id || null,
        area_id: area.id,
        area_name: area.name,
        title: String(title).trim(),
        description: String(description || '').trim(),
        assigned_to: assigned_to || area.assigned_mentor_id || 'usr-mentor-1',
        assigned_to_name: assignee?.display_name || 'Prof. Rahul Menon (Faculty Mentor)',
        estimated_cost:
          estimated_cost !== undefined && estimated_cost !== '' && estimated_cost !== null
            ? Number(estimated_cost)
            : null,
        approved_by: req.currentUser!.id,
        approved_by_name: req.currentUser!.display_name,
        implementation_date: implementation_date
          ? new Date(implementation_date).toISOString()
          : nowIso,
        status: ['Planned', 'In Progress', 'Implemented', 'Verified'].includes(status)
          ? status
          : 'In Progress',
        baseline_wait_minutes: enrichedArea.avg_wait_minutes || null,
        created_at: nowIso,
      };

      db.interventions.unshift(newIntervention);

      if (suggestion_id) {
        const sug = db.improvement_suggestions.find((s) => s.id === suggestion_id);
        if (sug) {
          sug.status = newIntervention.status === 'Implemented' ? 'Implemented' : 'Approved';
          sug.management_response =
            sug.management_response ||
            `Approved into active intervention "${newIntervention.title}" by ${req.currentUser!.display_name}.`;
          sug.updated_at = nowIso;
        }
      }

      recordAudit(
        req.currentUser!,
        'CREATE_INTERVENTION',
        'interventions',
        newIntervention.id,
        `Created action plan "${newIntervention.title}" for ${area.name}`
      );
      saveDatabase(db);

      res.status(201).json({ intervention: newIntervention });
    }
  );

  app.patch(
    '/api/interventions/:id',
    requireRole(['management', 'super_admin']),
    (req: AuthenticatedRequest, res) => {
      const intv = db.interventions.find((i) => i.id === req.params.id);
      if (!intv) {
        return res.status(404).json({ error: 'Intervention not found.' });
      }

      const { status, implementation_date } = req.body || {};
      if (status && ['Planned', 'In Progress', 'Implemented', 'Verified'].includes(status)) {
        intv.status = status;
        if (intv.suggestion_id && (status === 'Implemented' || status === 'Verified')) {
          const sug = db.improvement_suggestions.find((s) => s.id === intv.suggestion_id);
          if (sug) sug.status = 'Implemented';
        }
      }
      if (implementation_date) {
        intv.implementation_date = new Date(implementation_date).toISOString();
      }

      recordAudit(
        req.currentUser!,
        'UPDATE_INTERVENTION',
        'interventions',
        intv.id,
        `Updated intervention "${intv.title}" status to ${intv.status}`
      );
      saveDatabase(db);

      res.json({ intervention: intv });
    }
  );

  app.post('/api/simulator/run', (req, res) => {
    const {
      arrivalRatePerHour,
      serviceDurationMinutes,
      currentCounters,
      proposedCounters,
      monthlyVisitsAssumption,
    } = req.body || {};

    const result = calculateErlangC({
      arrivalRatePerHour: Number(arrivalRatePerHour),
      serviceDurationMinutes: Number(serviceDurationMinutes),
      currentCounters: Number(currentCounters),
      proposedCounters: Number(proposedCounters),
      monthlyVisitsAssumption: Number(monthlyVisitsAssumption || 0),
    });

    res.json({ simulation: result });
  });

  // --- SUPER ADMIN USERS, AUDIT LOGS, SETTINGS & DEMO DATA API ---
  app.get(
    '/api/admin/users',
    requireRole(['super_admin', 'management']),
    (_req, res) => {
      res.json({
        users: db.profiles,
        mentor_areas: db.mentor_areas,
      });
    }
  );

  app.patch(
    '/api/admin/users/:id',
    requireRole(['super_admin']),
    (req: AuthenticatedRequest, res) => {
      const target = db.profiles.find((p) => p.id === req.params.id);
      if (!target) {
        return res.status(404).json({ error: 'User profile not found.' });
      }

      const { role, is_active, department } = req.body || {};
      if (role && ['student', 'mentor', 'management', 'super_admin'].includes(role)) {
        target.role = role;
      }
      if (typeof is_active === 'boolean') {
        target.is_active = is_active;
      }
      if (department !== undefined) {
        target.department = String(department).trim();
      }

      recordAudit(
        req.currentUser!,
        'UPDATE_USER_ROLE',
        'profiles',
        target.id,
        `Updated ${target.display_name} (${target.email}) -> role: ${target.role}, active: ${target.is_active}`
      );
      saveDatabase(db);

      res.json({ user: target });
    }
  );

  app.get(
    '/api/admin/audit-logs',
    requireRole(['super_admin']),
    (_req, res) => {
      res.json({ audit_logs: db.audit_logs.slice(0, 100) });
    }
  );

  app.patch(
    '/api/admin/settings',
    requireRole(['super_admin']),
    (req: AuthenticatedRequest, res) => {
      const {
        institution_name,
        timezone,
        language_default,
        max_report_minutes,
        rate_limit_per_hour,
        demo_mode_enabled,
        categories,
      } = req.body || {};

      if (institution_name !== undefined) {
        db.settings.institution_name = String(institution_name).trim();
      }
      if (timezone !== undefined) {
        db.settings.timezone = String(timezone).trim();
      }
      if (language_default === 'en' || language_default === 'ml') {
        db.settings.language_default = language_default;
      }
      if (max_report_minutes !== undefined) {
        db.settings.max_report_minutes = Math.max(10, Number(max_report_minutes) || 180);
      }
      if (rate_limit_per_hour !== undefined) {
        db.settings.rate_limit_per_hour = Math.max(5, Number(rate_limit_per_hour) || 30);
      }
      if (typeof demo_mode_enabled === 'boolean') {
        db.settings.demo_mode_enabled = demo_mode_enabled;
      }
      if (Array.isArray(categories) && categories.length > 0) {
        db.settings.categories = categories.map((c) => String(c).trim()).filter(Boolean);
      }

      recordAudit(
        req.currentUser!,
        'UPDATE_SETTINGS',
        'settings',
        'institution',
        `Updated institution settings (demo_mode_enabled: ${db.settings.demo_mode_enabled})`
      );
      saveDatabase(db);

      res.json({ settings: db.settings });
    }
  );

  app.post(
    '/api/admin/demo-data/clear',
    requireRole(['super_admin']),
    (req: AuthenticatedRequest, res) => {
      const beforeCount = db.wait_reports.length;
      db.wait_reports = db.wait_reports.filter((r) => !r.is_demo);
      const removedCount = beforeCount - db.wait_reports.length;
      db.settings.demo_mode_enabled = false;

      recordAudit(
        req.currentUser!,
        'CLEAR_DEMO_DATA',
        'wait_reports',
        'demo-records',
        `Removed ${removedCount} labeled demonstration wait reports; preserved ${db.wait_reports.length} authentic reports.`
      );
      saveDatabase(db);

      res.json({
        removedCount,
        remainingLiveReports: db.wait_reports.length,
        settings: db.settings,
      });
    }
  );

  app.post(
    '/api/admin/demo-data/restore',
    requireRole(['super_admin']),
    (req: AuthenticatedRequest, res) => {
      const freshSeed = createInitialSeedData();
      const existingIds = new Set(db.wait_reports.map((r) => r.id));
      let added = 0;
      for (const demoRep of freshSeed.wait_reports) {
        if (!existingIds.has(demoRep.id)) {
          db.wait_reports.push(demoRep);
          added++;
        }
      }
      db.settings.demo_mode_enabled = true;

      recordAudit(
        req.currentUser!,
        'RESTORE_DEMO_DATA',
        'wait_reports',
        'demo-records',
        `Restored ${added} labeled demonstration wait reports and enabled demo display.`
      );
      saveDatabase(db);

      res.json({
        addedCount: added,
        totalReports: db.wait_reports.length,
        settings: db.settings,
      });
    }
  );

  app.get('/api/admin/supabase-schema', requireRole(['super_admin']), (_req, res) => {
    const sqlSchema = `-- TIME TAX — Production Supabase PostgreSQL Schema & Row-Level Security (RLS)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'mentor', 'management', 'super_admin')),
  department TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stable_identifier TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  building TEXT NOT NULL,
  floor TEXT NOT NULL,
  counters INTEGER NOT NULL DEFAULT 1 CHECK (counters >= 1),
  service_minutes NUMERIC(5,2) NOT NULL DEFAULT 3.0,
  operating_hours TEXT,
  assigned_mentor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mentor_areas (
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  PRIMARY KEY (mentor_id, area_id)
);

CREATE TABLE IF NOT EXISTS queue_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID NOT NULL REFERENCES areas(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  secure_session_token_hash TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired'))
);

CREATE TABLE IF NOT EXISTS wait_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID NOT NULL REFERENCES areas(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  queue_session_id UUID UNIQUE REFERENCES queue_sessions(id) ON DELETE SET NULL,
  duration_minutes NUMERIC(6,2) NOT NULL CHECK (duration_minutes > 0),
  reporting_source TEXT NOT NULL CHECK (reporting_source IN ('qr_timer', 'manual')),
  feedback_note TEXT,
  issue_tag TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS improvement_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  proposed_solution TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  estimated_cost NUMERIC(10,2),
  supporting_observation TEXT,
  status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Implemented')),
  management_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id UUID REFERENCES improvement_suggestions(id) ON DELETE SET NULL,
  area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  estimated_cost NUMERIC(10,2),
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  implementation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'Planned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wait_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvement_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;`;

    res.json({ sqlSchema });
  });

  // --- VITE MIDDLEWARE OR STATIC PROD ASSETS ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TIME TAX full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();
