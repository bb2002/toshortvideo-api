import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entity/base.entity';
import { MetadataEntity } from '../../metadata/entities/metadata.entity';

@Entity('tv_files')
export class FileEntity extends BaseEntity {
  @Column({
    name: 'uuid',
    type: 'varchar',
  })
  @Index('uq_uuid', {
    unique: true,
  })
  uuid: string;

  @Column({
    name: 'original_name',
    type: 'varchar',
  })
  originalName: string;

  @Column({
    name: 'mime_type',
    type: 'varchar',
  })
  mimeType: string;

  @Column({
    name: 'file_size',
    type: 'bigint',
  })
  fileSize: number;

  @Column({
    name: 'download_url',
    type: 'text',
    nullable: true,
  })
  downloadUrl: string;

  @Column({
    name: 'expired_at',
    type: 'datetime',
    nullable: true,
  })
  expiredAt: Date;

  @OneToOne(() => MetadataEntity)
  @JoinColumn({
    name: 'metadata_id',
  })
  metadata: MetadataEntity;
}
