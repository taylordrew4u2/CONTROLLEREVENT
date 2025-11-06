export interface Comedian {
  id?: number;
  name: string;
  audioFilePath?: string;
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

export interface ElectronAPI {
  getComedians: () => Promise<Comedian[]>;
  addComedian: (comedian: Comedian) => Promise<Comedian>;
  updateComedian: (id: number, comedian: Comedian) => Promise<Comedian>;
  deleteComedian: (id: number) => Promise<boolean>;
  
  getTemplates: () => Promise<Template[]>;
  addTemplate: (template: Template) => Promise<Template>;
  updateTemplate: (id: number, template: Template) => Promise<Template>;
  deleteTemplate: (id: number) => Promise<boolean>;
  
  getDefaultShowTemplate: () => Promise<ShowTemplate | null>;
  saveShowTemplate: (name: string, segments: ShowTemplateSegment[]) => Promise<number>;
  
  getShows: () => Promise<Show[]>;
  getShow: (id: number) => Promise<Show | null>;
  saveShow: (show: Show) => Promise<number>;
  updateShow: (id: number, show: Show) => Promise<number>;
  deleteShow: (id: number) => Promise<boolean>;
  
  pickAudioFile: () => Promise<string | null>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
