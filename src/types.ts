/** A performer in the library — persists across shows. */
export interface Performer {
  id?: number;
  name: string;
  walkOnAudioId?: string;
  walkOnAudioName?: string;
  walkOffAudioId?: string;
  walkOffAudioName?: string;
  defaultDuration: number; // minutes
}

/** A performer's slot in a show lineup. Audio assignments travel with the entry. */
export interface LineupEntry {
  performerId?: number;
  name: string;
  duration: number; // minutes
  walkOnAudioId?: string;
  walkOnAudioName?: string;
  walkOffAudioId?: string;
  walkOffAudioName?: string;
  orderIndex: number;
  notes?: string;
}

/** A saved show with an ordered performer lineup. */
export interface Show {
  id?: number;
  name: string;
  createdDate: string;
  lineup: LineupEntry[];
}
