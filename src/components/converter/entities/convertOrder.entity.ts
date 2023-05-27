import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ConvertQueueEntity } from './convertQueue.entity';
import { UploadVideoEntity } from 'src/components/editor/entities/uploadVideo.entity';
import ProgressStatus from '../enums/ProgressStatus';

@Entity('tsv_convert_order')
export class ConvertOrderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'recipe',
    type: 'text',
  })
  recipe: string;

  @Column({
    name: 'progress_status',
    type: 'enum',
    enum: ProgressStatus,
  })
  status: ProgressStatus;

  @Column({
    name: 'progress_percent',
    type: 'int',
    nullable: true,
  })
  percent: number;

  @Column({
    name: 'message',
    type: 'text',
    nullable: true,
  })
  message: string;

  @OneToOne(() => UploadVideoEntity)
  @JoinColumn({ name: 'upload_video_id' })
  originalVideo: UploadVideoEntity;

  @ManyToOne(() => ConvertQueueEntity, (convertQueue) => convertQueue.orders)
  queue: ConvertQueueEntity;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;
}
