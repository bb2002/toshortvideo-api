import {
  IsEnum,
  IsHexColor,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import FontFamily from '../enums/FontFamily';
import { FontWeight } from '../enums/FontWeight';

export class TextRecipeDto {
  @IsString()
  @MaxLength(10)
  text: string;

  @IsHexColor()
  color: string;

  @IsEnum(FontFamily)
  font: FontFamily;

  @IsEnum(FontWeight)
  weight: FontWeight;
}

export class VideoRecipeDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => TextRecipeDto)
  text1?: TextRecipeDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TextRecipeDto)
  text2: TextRecipeDto;
}
