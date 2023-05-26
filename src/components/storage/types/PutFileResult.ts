import R2Folder from '../enums/R2Folder';

export default interface PutFileResult {
  folder: R2Folder;
  filename: string;
  key: string;
  bucket: string;
}
