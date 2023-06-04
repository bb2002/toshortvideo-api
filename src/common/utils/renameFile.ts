import * as path from 'path';
import * as fs from 'fs';

export async function renameTmpFile(oldName: string, newName: string) {
  return new Promise<void>((resolve, reject) => {
    const oldPath = path.join('tmp', oldName);
    const newPath = path.join('tmp', newName);

    fs.mkdir(path.dirname(newPath), { recursive: true }, (err1) => {
      if (err1) {
        reject(err1);
      } else {
        fs.rename(oldPath, newPath, (err2) => {
          if (err2) {
            reject(err2);
          } else {
            resolve();
          }
        });
      }
    });
  });
}
