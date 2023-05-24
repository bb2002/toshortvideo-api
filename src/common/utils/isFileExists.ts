import * as fs from 'fs';

export async function isFileExists(path: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    fs.access(path, (err) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}
