export interface ObservationRecord {
  id: string;
  date: string;
  dayNumber: number;
  length: number; // in mm
  color: string;
  foodConsumption: string; // e.g. "無", "極少", "正常", "食量大"
  feedingDate: string;
  appearanceDescription: string;
  problemFound: string;
  solution: string;
  mediaType: 'sketch' | 'photo' | 'none';
  mediaUrl: string; // base64 or static file path
}

export interface AdaptationMechanism {
  structure: string;
  action: string;
  func: string; // "function" is a TS keyword, using "func"
}

export interface HumanImpact {
  impact: string;
  improvement: string;
}

export interface ReportMetadata {
  grade: string;
  classNumber: string;
  seatNumber: string;
  studentName: string;
  insectFamily: string;
  insectName: string;
  breedingHouse: string;
  breedingHouseMediaType: 'sketch' | 'photo' | 'none';
  breedingHouseMediaUrl: string;
  foodName: string;
  location: string;
  adaptation: AdaptationMechanism;
  humanImpact: HumanImpact;
  reflection: string;
}

export interface DatabaseState {
  metadata: ReportMetadata;
  records: ObservationRecord[];
}
