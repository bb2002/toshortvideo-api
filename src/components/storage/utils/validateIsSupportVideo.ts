export function validateIsSupportVideo(file: Express.Multer.File): boolean {
  const { mimetype } = file;
  const supportVideoMimeTypes = ['video/mp4', 'video/x-matroska', 'video/avi'];

  return supportVideoMimeTypes.indexOf(mimetype) >= 0;
}
