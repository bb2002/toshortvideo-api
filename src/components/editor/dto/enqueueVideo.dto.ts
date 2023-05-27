import { IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { EncodingRecipeDto } from '../../converter/dto/encodingRecipe.dto';

export class EnqueueVideoDto {
  @IsString()
  uuid: string;

  @ValidateNested()
  @Type(() => EncodingRecipeDto)
  recipe: EncodingRecipeDto;
}
