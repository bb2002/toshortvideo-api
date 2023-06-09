import { UploadVideoEntity } from 'src/components/editor/entities/uploadVideo.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ConvertOrderEntity } from './convertOrder.entity';
import ExportVideoStatus from '../enums/ExportVideoStatus';

@Entity('tsv_convert_result_item')
export class ConvertResultItemEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'download_url',
    type: 'text',
    nullable: true,
  })
  downloadUrl: string | null;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ExportVideoStatus,
  })
  status: ExportVideoStatus;

  @ManyToOne(
    () => UploadVideoEntity,
    (originalVideo) => originalVideo.convertResultItem,
  )
  originalVideo: UploadVideoEntity;

  @ManyToOne(
    () => ConvertOrderEntity,
    (orderEntity) => orderEntity.convertResultItem,
  )
  order: ConvertOrderEntity;

  @Column({
    name: 'expired_at',
    type: 'datetime',
    nullable: true,
  })
  expiredAt: Date | null;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;
}
