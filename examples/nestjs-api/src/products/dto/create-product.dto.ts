import { IsString, IsNumber, Min, IsEnum, IsPositive } from 'class-validator';

export enum Category {
  Electronics = 'Electronics',
  Home = 'Home',
  Clothing = 'Clothing',
  Books = 'Books',
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsEnum(Category)
  category: Category;

  @IsNumber()
  @Min(0)
  stock: number;
}
