export interface PutFileReturn {
  uuid: string;
  videoUrl: string;
  videoThumbnailUrl: string;
  duration: number;
  expiredAt: Date;
}
