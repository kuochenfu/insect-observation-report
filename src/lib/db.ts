import fs from 'fs/promises';
import path from 'path';
import { DatabaseState } from './types';

const DB_PATH = path.join(process.cwd(), 'src', 'data', 'db.json');

export async function readDb(): Promise<DatabaseState> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data) as DatabaseState;
  } catch (error) {
    // If the file doesn't exist, we return a blank template
    console.error('Error reading db.json, returning empty structure:', error);
    return {
      metadata: {
        grade: '',
        classNumber: '',
        seatNumber: '',
        studentName: '',
        insectFamily: '',
        insectName: '',
        breedingHouse: '',
        breedingHouseMediaType: 'none',
        breedingHouseMediaUrl: '',
        foodName: '',
        location: '',
        adaptation: { structure: '', action: '', func: '' },
        humanImpact: { impact: '', improvement: '' },
        reflection: ''
      },
      records: []
    };
  }
}

export async function writeDb(state: DatabaseState): Promise<void> {
  const dir = path.dirname(DB_PATH);
  await fs.mkdir(dir, { recursive: true });
  const data = JSON.stringify(state, null, 2);
  await fs.writeFile(DB_PATH, data, 'utf-8');
  
  // 建立自動備份機制：將資料同步寫入 db.backup.json。
  // 當 AI 代理人在後續任務中不小心覆寫 db.json 時，此備份檔案不會受影響，以便隨時還原使用者的手動修改內容。
  const backupPath = path.join(dir, 'db.backup.json');
  await fs.writeFile(backupPath, data, 'utf-8');
}
