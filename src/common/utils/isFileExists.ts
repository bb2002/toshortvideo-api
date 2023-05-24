import * as fs from 'fs';

export default function isFileExists(path: string): boolean {
  try {
    fs.accessSync(path);
    return true;
  } catch (err) {
    return false;
  }
}
