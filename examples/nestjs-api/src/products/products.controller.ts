import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationDto } from './dto/pagination.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

// Mock data store
const products = [
  { id: 1, name: 'Laptop', price: 999.99, category: 'Electronics', stock: 50 },
  { id: 2, name: 'Smartphone', price: 699.99, category: 'Electronics', stock: 100 },
  { id: 3, name: 'Headphones', price: 149.99, category: 'Electronics', stock: 200 },
  { id: 4, name: 'Coffee Maker', price: 79.99, category: 'Home', stock: 75 },
];

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    const { page = 1, limit = 10, search, category } = paginationDto;
    let result = [...products];

    if (search) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (category) {
      result = result.filter((p) => p.category === category);
    }

    const total = result.length;
    const start = (page - 1) * limit;
    const paginated = result.slice(start, start + +limit);

    return {
      data: paginated,
      pagination: {
        page: +page,
        limit: +limit,
        total,
        totalPages: Math.ceil(total / +limit),
      },
    };
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    const product = products.find((p) => p.id === id);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    const newProduct = {
      id: products.length + 1,
      ...createProductDto,
    };
    products.push(newProduct);
    return newProduct;
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('Product not found');
    }
    products[index] = { ...products[index], ...updateProductDto };
    return products[index];
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('Product not found');
    }
    products.splice(index, 1);
    return { message: 'Product deleted successfully' };
  }
}
