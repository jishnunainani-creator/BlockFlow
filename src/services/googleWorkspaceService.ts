import { supabase, getGoogleProviderToken, signInWithOAuth } from '../lib/supabase';

export interface RawGmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  dateStr: string;
  bodyText: string;
  icsContent?: string;
}

export interface GoogleWorkspaceConnectionState {
  isConnected: boolean;
  email: string | null;
  provider: 'supabase_oauth' | 'manual_token' | 'demo';
  hasGmailScope: boolean;
  hasCalendarScope: boolean;
}

const LOCAL_STORAGE_WORKSPACE_TOKEN = 'blockflow_google_workspace_token';
const LOCAL_STORAGE_WORKSPACE_EMAIL = 'blockflow_google_workspace_email';

export const GOOGLE_WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.events',
];

/**
 * Decode Base64URL encoded strings from Gmail API payloads
 */
export function decodeBase64Url(data: string): string {
  if (!data) return '';
  try {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (m) => m.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch (err) {
    console.warn('Failed to decode Base64Url string:', err);
    return '';
  }
}

/**
 * Extract text and ics content recursively from Gmail message payload parts
 */
export function extractGmailMessageContent(payload: any): { bodyText: string; icsContent?: string } {
  let bodyText = '';
  let icsContent: string | undefined = undefined;

  if (!payload) return { bodyText, icsContent };

  const checkPart = (part: any) => {
    const mimeType = part.mimeType || '';
    const filename = part.filename || '';

    // Check for ICS calendar invite attachment
    if (
      mimeType.toLowerCase().includes('calendar') ||
      filename.toLowerCase().endsWith('.ics')
    ) {
      if (part.body?.data) {
        icsContent = decodeBase64Url(part.body.data);
      }
    } else if (mimeType === 'text/plain' && part.body?.data && !bodyText) {
      bodyText = decodeBase64Url(part.body.data);
    } else if (mimeType === 'text/html' && part.body?.data && !bodyText) {
      // Basic text extraction from HTML
      const html = decodeBase64Url(part.body.data);
      bodyText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    if (part.parts && Array.isArray(part.parts)) {
      part.parts.forEach(checkPart);
    }
  };

  if (payload.body?.data && !payload.parts) {
    bodyText = decodeBase64Url(payload.body.data);
  }

  if (payload.parts && Array.isArray(payload.parts)) {
    payload.parts.forEach(checkPart);
  }

  return { bodyText: bodyText.trim(), icsContent };
}

/**
 * Get current Google Workspace connection status
 */
export async function getGoogleWorkspaceConnection(): Promise<GoogleWorkspaceConnectionState> {
  // Check Supabase provider token first
  const providerToken = await getGoogleProviderToken();
  if (providerToken && supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    return {
      isConnected: true,
      email: user?.email || null,
      provider: 'supabase_oauth',
      hasGmailScope: true,
      hasCalendarScope: true,
    };
  }

  // Check locally saved manual token (for testing or direct OAuth)
  if (typeof window !== 'undefined') {
    const manualToken = localStorage.getItem(LOCAL_STORAGE_WORKSPACE_TOKEN);
    const manualEmail = localStorage.getItem(LOCAL_STORAGE_WORKSPACE_EMAIL);
    if (manualToken) {
      return {
        isConnected: true,
        email: manualEmail || 'connected-account@google.com',
        provider: 'manual_token',
        hasGmailScope: true,
        hasCalendarScope: true,
      };
    }
  }

  return {
    isConnected: false,
    email: null,
    provider: 'demo',
    hasGmailScope: false,
    hasCalendarScope: false,
  };
}

/**
 * Save a manual OAuth access token (useful for test environments)
 */
export function setManualGoogleToken(token: string, email?: string): void {
  if (typeof window === 'undefined') return;
  if (!token) {
    localStorage.removeItem(LOCAL_STORAGE_WORKSPACE_TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_WORKSPACE_EMAIL);
  } else {
    localStorage.setItem(LOCAL_STORAGE_WORKSPACE_TOKEN, token.trim());
    if (email) localStorage.setItem(LOCAL_STORAGE_WORKSPACE_EMAIL, email.trim());
  }
}

/**
 * Disconnect Google Workspace
 */
export function disconnectGoogleWorkspace(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOCAL_STORAGE_WORKSPACE_TOKEN);
  localStorage.removeItem(LOCAL_STORAGE_WORKSPACE_EMAIL);
}

/**
 * Trigger OAuth login specifically with Google Workspace Gmail and Calendar scopes
 */
export async function initiateGoogleWorkspaceAuth() {
  const scopes = GOOGLE_WORKSPACE_SCOPES.join(' ');
  const queryParams = {
    access_type: 'offline',
    prompt: 'consent',
  };
  return await signInWithOAuth('google', scopes, queryParams);
}

/**
 * Fetch schedule-related emails from Gmail REST API
 */
export async function fetchScheduleEmailsFromGmail(
  token: string,
  searchQuery: string = 'newer_than:14d (subject:lecture OR subject:exam OR subject:class OR subject:assignment OR subject:meeting OR subject:schedule OR filename:invite.ics)'
): Promise<RawGmailMessage[]> {
  const encodedQuery = encodeURIComponent(searchQuery);
  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodedQuery}&maxResults=10`;

  const listRes = await fetch(listUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!listRes.ok) {
    const errorText = await listRes.text();
    throw new Error(`Gmail API error (${listRes.status}): ${errorText}`);
  }

  const listData = await listRes.json();
  if (!listData.messages || !Array.isArray(listData.messages) || listData.messages.length === 0) {
    return [];
  }

  // Fetch full details for each message
  const details = await Promise.all(
    listData.messages.map(async (msg: { id: string }) => {
      const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`;
      const detailRes = await fetch(detailUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!detailRes.ok) return null;
      const detail = await detailRes.json();

      const headers: { [key: string]: string } = {};
      if (detail.payload?.headers) {
        detail.payload.headers.forEach((h: { name: string; value: string }) => {
          headers[h.name.toLowerCase()] = h.value;
        });
      }

      const { bodyText, icsContent } = extractGmailMessageContent(detail.payload);

      const rawMsg: RawGmailMessage = {
        id: detail.id,
        threadId: detail.threadId,
        snippet: detail.snippet || '',
        subject: headers['subject'] || '(No Subject)',
        from: headers['from'] || 'Unknown Sender',
        dateStr: headers['date'] || new Date().toISOString(),
        bodyText: bodyText || detail.snippet || '',
        icsContent,
      };

      return rawMsg;
    })
  );

  return details.filter((m): m is RawGmailMessage => m !== null);
}

/**
 * Realistic Mock Academic & Schedule Emails for local testing, offline mode, and guest preview
 */
export const SAMPLE_ACADEMIC_EMAILS: RawGmailMessage[] = [
  {
    id: 'demo_msg_001',
    threadId: 'thread_001',
    snippet: 'The Midterm Examination for CS301 Algorithms will take place on Wednesday from 10:00 AM to 11:30 AM...',
    subject: 'Midterm Exam Schedule: CS301 Advanced Algorithms',
    from: 'Examination Cell <exam-cell@university.edu>',
    dateStr: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    bodyText:
      'Dear Students,\n\nPlease take note that the Midterm Examination for CS301 (Advanced Algorithms) is scheduled for this Wednesday from 10:00 to 11:30 in Lecture Hall 204. Please arrive 10 minutes early with your student ID cards.\n\nBest regards,\nOffice of Academic Affairs',
  },
  {
    id: 'demo_msg_002',
    threadId: 'thread_002',
    snippet: 'Special Guest Lecture on Generative AI and Autonomous Agent Systems this Friday 14:00 to 15:30...',
    subject: 'Guest Lecture: Modern AI Agents in Practice',
    from: 'School of Technology Events <events@university.edu>',
    dateStr: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    bodyText:
      'Hello Everyone,\n\nWe are excited to host Dr. Ananya Sen for an insightful talk on "Modern AI Agents in Practice".\n\nWhen: This Friday from 14:00 to 15:30\nWhere: Main Auditorium\nTopics: LLM orchestration, reactive scheduling, and agent architectures.\n\nDon\'t miss out!',
  },
  {
    id: 'demo_msg_003',
    threadId: 'thread_003',
    snippet: 'Office hours this week have been shifted to Thursday 16:00 to 17:00 for project review...',
    subject: 'Office Hours Rescheduled - Prof. Vikram Patel',
    from: 'Prof. Vikram Patel <v.patel@university.edu>',
    dateStr: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    bodyText:
      'Hi class,\n\nDue to a faculty conference on Tuesday, my office consultation hours this week will be held on Thursday from 16:00 to 17:00 in Room 312.\n\nBring your project milestone drafts if you would like advance feedback.\n\nProf. Patel',
  },
  {
    id: 'demo_msg_004',
    threadId: 'thread_004',
    snippet: 'Sprint Planning & Capstone Sync meeting invitation with calendar attachment...',
    subject: 'Calendar Invite: Capstone Project Sprint Sync',
    from: 'Capstone Team Coordinator <coordinator@university.edu>',
    dateStr: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    bodyText: 'Weekly team sprint check-in to coordinate deliverables and review upcoming deadlines.',
    icsContent: `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Inc//Google Calendar 70.9054//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:capstone_sync_20261124@university.edu
SUMMARY:Capstone Project Sprint Sync
DESCRIPTION:Weekly team sprint check-in to coordinate deliverables and review upcoming deadlines.
LOCATION:Collaboration Room 4B
DTSTART:20261125T090000Z
DTEND:20261125T100000Z
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`,
  },
];
