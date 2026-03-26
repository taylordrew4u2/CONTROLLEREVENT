export interface Comedian {
  id?: number;
  name: string;
  audioFilePath?: string;
  walkOnAudioId?: string;
  walkOnAudioName?: string;
  walkOffAudioId?: string;
  walkOffAudioName?: string;
  defaultDuration: number;
}

export interface Template {
  id?: number;
  name: string;
  audioFilePath?: string;
  defaultDuration: number;
  type: string;
}

export interface ShowTemplateSegment {
  id?: number;
  showTemplateId?: number;
  name: string;
  duration: number;
  orderIndex: number;
  segmentType?: string;
}

export interface ShowTemplate {
  id?: number;
  name: string;
  isDefault: number;
  createdDate: string;
  segments: ShowTemplateSegment[];
}

export interface Segment {
  id?: number;
  showId?: number;
  name: string;
  duration: number;
  audioFilePath?: string;
  walkOnAudioId?: string;
  walkOnAudioName?: string;
  walkOffAudioId?: string;
  walkOffAudioName?: string;
  orderIndex: number;
  calculatedStartTime: number;
  comedianId?: number;
  templateId?: number;
  notes?: string;
}

export interface Show {
  id?: number;
  name: string;
  createdDate: string;
  totalDuration: number;
  segments: Segment[];
}
