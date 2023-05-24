import * as path from 'path';
import * as fs from 'fs';

export async function renameTmpFile(oldName: string, newName: string) {
  return new Promise<void>((resolve, reject) => {
    const oldPath = path.join('tmp', oldName);
    const newPath = path.join('tmp', newName);

    fs.rename(oldPath, newPath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
