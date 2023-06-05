import { ConvertResultItemEntity } from 'src/components/converter/entities/convertResultItem.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('tsv_upload_videos')
export class UploadVideoEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'uuid',
    type: 'varchar',
  })
  @Index('uq_uuid', {
    unique: true,
  })
  uuid: string;

  @Column({
    name: 'video_original_name',
    type: 'text',
  })
  originalVideoName: string;

  @Column({
    name: 'video_size',
    type: 'bigint',
  })
  videoSize: number;

  @Column({
    name: 'video_mimetype',
    type: 'tinytext',
  })
  videoMimetype: string;

  @Column({
    name: 'video_duration',
    type: 'int',
  })
  videoDuration: number;

  @Column({
    name: 'download_url',
    type: 'text',
  })
  downloadUrl: string;

  @Column({
    name: 'thumbnail_url',
    type: 'text',
  })
  thumbnailUrl: string;

  @OneToMany(
    () => ConvertResultItemEntity,
    (resultItem) => resultItem.originalVideo,
  )
  convertResultItem: ConvertResultItemEntity[];

  @Column({
    name: 'expired_at',
    type: 'datetime',
  })
  @Index('idx_expired_at')
  expiredAt: Date;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;
}
