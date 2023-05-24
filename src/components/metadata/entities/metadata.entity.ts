import { Column, Entity, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entity/base.entity';
import { FileEntity } from '../../storage/entities/file.entity';

@Entity('tv_metadata')
export class MetadataEntity extends BaseEntity {
  @Column({
    type: 'double',
    name: 'duration',
  })
  duration: number;

  @Column({
    type: 'varchar',
    name: 'videoThumbnail',
  })
  videoThumbnail: string;
}
