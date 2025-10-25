import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  IsIn,
} from 'class-validator';
import {
  DesignCategory,
  DesignStatus,
} from 'src/database/schema/Designs.schema';
import { Type } from 'class-transformer';

class SizeDto {
  @IsString()
  @IsIn(["S", "M", "L", "XL", "XXL", "3XL"]) // ✅ enforce allowed sizes
  size: string;

  @IsNumber()
  @Min(0)
  stock: number;
}

class VariationDto {
  @IsString()
  color: string;

  @ValidateNested({ each: true })
  @Type(() => SizeDto)
  sizes: SizeDto[];
}

export class CreateDesignDto {
  @IsString()
  @IsNotEmpty()
  designName: string;

  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  imageUrl: string[];

  @IsEnum(DesignCategory)
  category: DesignCategory;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariationDto)
  variations: VariationDto[];

  @IsEnum(DesignStatus)
  @IsOptional()
  status?: DesignStatus;
}