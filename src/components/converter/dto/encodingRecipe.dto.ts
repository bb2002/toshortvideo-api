import {
  IsEnum,
  IsHexColor,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import FontFamily from '../enums/FontFamily';
import { FontWeight } from '../enums/FontWeight';
import VideoBlankFill from '../enums/VideoBlankFill';
import VideoSize from '../enums/VideoSize';

export class TextRecipeDto {
  @IsString()
  @MaxLength(25)
  text: string;

  @IsHexColor()
  color: string;

  @IsEnum(FontFamily)
  font: FontFamily;

  @IsEnum(FontWeight)
  weight: FontWeight;

  @IsNumber()
  @Min(0.05)
  @Max(0.15)
  fontSize: number;
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
}
