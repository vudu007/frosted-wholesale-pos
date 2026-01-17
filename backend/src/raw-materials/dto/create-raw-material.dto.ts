import { IsString, IsNumber, IsNotEmpty, Min, IsUUID } from 'class-validator';

export class CreateRawMaterialDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsNumber()
  @Min(0)
  initialStock: number;

  @IsUUID()
  @IsNotEmpty()
  storeId: string;
}
