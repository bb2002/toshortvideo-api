import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entity/base.entity';

@Entity('tv_metadata')
export class MetadataEntity extends BaseEntity {
  @Column({
    type: 'double',
    name: 'duration',
  })
  duration: number;

  @Column({
    type: 'text',
    name: 'videoThumbnail',
  })
  videoThumbnail: string;
}
