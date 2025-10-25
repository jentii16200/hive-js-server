import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { RemoveCartDto } from './dto/remove-cart.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add')
  async addToCart(@Body() dto: CreateCartDto) {
    return this.cartService.addToCart(
      dto.userId,
      dto.designId,
      dto.quantity ?? 1,
      dto.color,
      dto.size,
    );
  }

  @Get(':userId')
  async getCart(@Param('userId') userId: string) {
    return this.cartService.getCart(userId);
  }

  // ✅ Use POST to ensure body is reliably received
  @Post('remove')
  async removeItem(@Body() dto: RemoveCartDto) {
    return this.cartService.removeItem(
      dto.userId,
      dto.designId,
      dto.color,
      dto.size,
    );
  }

  @Patch(':userId/update-quantity')
  async updateQuantity(
    @Param('userId') userId: string,
    @Body() dto: UpdateCartDto,
  ) {
    return this.cartService.updateQuantity(
      userId,
      dto.designId,
      dto.quantity,
      dto.color,
      dto.size,
    );
  }
}
