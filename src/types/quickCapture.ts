export type CaptureStatus = 'unprocessed' | 'processed' | 'archived';

export type ConvertedEntityType = 'task' | 'timetable_block' | 'reminder' | 'smart_goal';

export interface ExtractedDetails {
  suggestedType: ConvertedEntityType;
  suggestedTitle: string;
  suggestedDate?: string; // YYYY-MM-DD
  suggestedTimeMinutes?: number; // minutes from 00:00 (e.g., 540 = 09:00)
  suggestedDuration?: number; // duration in minutes (e.g., 45, 60)
  suggestedPriority?: 'high' | 'medium' | 'low';
  confidence: 'high' | 'medium' | 'low';
  matchedKeywords: string[];
}

export interface QuickCaptureItem {
  id: string;
  rawText: string;
  createdAt: number;
  updatedAt: number;
  status: CaptureStatus;

  // Notes or revised text if edited by user
  notes?: string;

  // Extracted candidate details (local NLP)
  extracted?: ExtractedDetails;

  // Conversion reference tracking
  convertedTo?: ConvertedEntityType;
  convertedEntityId?: string;
  convertedAt?: number;
}
