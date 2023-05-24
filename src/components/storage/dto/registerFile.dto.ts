import {
  IsDate,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { MetadataEntity } from '../../metadata/entities/metadata.entity';

export class RegisterFileDto {
  @IsString()
  uuid: string;

  @IsString()
  originalName: string;

  @IsString()
  mimeType: string;

  @IsNumber()
  fileSize: number;

  @IsOptional()
  @IsString()
  downloadUrl?: string | null;

  @IsOptional()
  @IsDate()
  expiredAt?: Date | null;

  @IsObject()
  metadata: MetadataEntity;
}
