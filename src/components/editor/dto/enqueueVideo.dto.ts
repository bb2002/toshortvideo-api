import { IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { VideoRecipeDto } from '../../converter/dto/videoRecipe.dto';

export class EnqueueVideoDto {
  @IsString()
  uuid: string;

  @ValidateNested()
  @Type(() => VideoRecipeDto)
  recipe: VideoRecipeDto;
}
