import { IsDate, IsOptional, IsString } from 'class-validator';

export class UpdateFileDto {
  @IsString()
  uuid: string;

  @IsOptional()
  @IsString()
  downloadUrl?: string | null;

  @IsOptional()
  @IsDate()
  expiredAt?: Date | null;
}
