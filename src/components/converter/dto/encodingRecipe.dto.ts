import {
  IsEnum,
  IsHexColor,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import FontFamily from '../enums/FontFamily';
import { FontWeight } from '../enums/FontWeight';
import VideoBlankFill from '../enums/VideoBlankFill';
import ShortPlatform from '../enums/ShortPlatform';
import VideoSize from '../enums/VideoSize';

export class TextRecipeDto {
  @IsString()
  @MaxLength(12)
  text: string;

  @IsHexColor()
  color: string;

  @IsEnum(FontFamily)
  font: FontFamily;

  @IsEnum(FontWeight)
  weight: FontWeight;
}

export class VideoRecipeDto {
  @IsNumber()
  startAt: number;

  @IsNumber()
  endAt: number;

  @IsEnum(VideoBlankFill)
  blankFill: VideoBlankFill;

  @IsEnum(VideoSize)
  videoSize: VideoSize;
}

export class EncodingRecipeDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => TextRecipeDto)
  text1?: TextRecipeDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TextRecipeDto)
  text2?: TextRecipeDto;

  @ValidateNested()
  @Type(() => VideoRecipeDto)
  video: VideoRecipeDto;

  @IsEnum(ShortPlatform)
  platform: ShortPlatform;
}
