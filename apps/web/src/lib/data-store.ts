import fs from 'fs';
import path from 'path';

export interface RegistrationRecord {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  institution_name: string;
  role: 'student' | 'teacher' | 'parent';
  source: 'web_portal' | 'mobile_apk';
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  created_at: string;
  updated_at: string;
  student_id_code?: string;
  password?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'registrations.json');

const INITIAL_REGISTRATIONS: RegistrationRecord[] = [
  {
    id: 'reg-001',
    full_name: 'Sadia Islam',
    email: 'sadia.islam2026@gmail.com',
    phone: '+8801712345678',
    institution_name: 'Metropolitan University of Technology & Science',
    role: 'student',
    source: 'mobile_apk',
    status: 'approved',
    notes: 'Applied for CSE undergraduate program via Android APK',
    student_id_code: 'COS-2026-1052',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'reg-002',
    full_name: 'Tanvir Ahmed Chowdhury',
    email: 'tanvir.student@gmail.com',
    phone: '+8801712345678',
    institution_name: 'Metropolitan University of Technology & Science',
    role: 'student',
    source: 'web_portal',
    status: 'approved',
    notes: 'Admission: B.Sc in CSE, Guardian: Kabir Ahmed Chowdhury (+8801812345678)',
    student_id_code: 'COS-2026-1049',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'reg-003',
    full_name: 'Farhan Kabir',
    email: 'farhan.kabir@yahoo.com',
    phone: '+8801819876543',
    institution_name: 'Crescent Model Higher Secondary College',
    role: 'student',
    source: 'mobile_apk',
    status: 'pending',
    notes: 'HSC Science admission application via Mobile App',
    student_id_code: 'COS-2026-0914',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 'reg-004',
    full_name: 'Anisur Rahman',
    email: 'anisur.rahman.dev@gmail.com',
    phone: '+8801911223344',
    institution_name: 'Metropolitan University of Technology & Science',
    role: 'teacher',
    source: 'mobile_apk',
    status: 'pending',
    notes: 'Faculty application for Computer Science Lecturer',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'reg-005',
    full_name: 'Mehedi Hasan',
    email: 'mehedi.hasan@gmail.com',
    phone: '+8801615566778',
    institution_name: 'Green Valley Smart Model School',
    role: 'parent',
    source: 'web_portal',
    status: 'approved',
    notes: 'Parent account registered for Grade 5 student',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];

export function getStoredRegistrations(): RegistrationRecord[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_REGISTRATIONS, null, 2), 'utf8');
      return INITIAL_REGISTRATIONS;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading registrations file:', e);
    return INITIAL_REGISTRATIONS;
  }
}

export function saveStoredRegistrations(records: RegistrationRecord[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing registrations file:', e);
  }
}

export function addRegistration(record: Omit<RegistrationRecord, 'id' | 'created_at' | 'updated_at' | 'status'> & { status?: 'pending' | 'approved' }): RegistrationRecord {
  const current = getStoredRegistrations();
  const id = `reg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();
  const studentCode = record.role === 'student' ? `COS-2026-${Math.floor(1000 + Math.random() * 8999)}` : undefined;

  const newRecord: RegistrationRecord = {
    ...record,
    id,
    status: record.status || 'pending',
    student_id_code: record.student_id_code || studentCode,
    created_at: now,
    updated_at: now,
  };

  current.unshift(newRecord);
  saveStoredRegistrations(current);
  return newRecord;
}

export function updateRegistrationStatus(id: string, status: 'approved' | 'rejected'): RegistrationRecord | null {
  const current = getStoredRegistrations();
  const index = current.findIndex(r => r.id === id);
  if (index === -1) return null;

  current[index].status = status;
  current[index].updated_at = new Date().toISOString();
  saveStoredRegistrations(current);
  return current[index];
}
