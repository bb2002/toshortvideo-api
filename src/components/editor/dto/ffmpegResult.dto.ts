import { IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class FfmpegResultDto {
  @IsNumber()
  @Transform(({ value }) => Number(value))
  duration: number;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  size: number;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  bitRate: number;
}
