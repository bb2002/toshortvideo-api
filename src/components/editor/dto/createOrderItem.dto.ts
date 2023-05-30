import { IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { EncodingRecipeDto } from '../../converter/dto/encodingRecipe.dto';

export class CreateOrderItemDto {
  @IsString()
  uuid: string;

  @ValidateNested()
  @Type(() => EncodingRecipeDto)
  recipe: EncodingRecipeDto;
}
