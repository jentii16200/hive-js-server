// src/modules/cart/cart.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Cart, CartSchema } from '../../database/schema/Cart.schema';
import { Designs, DesignsSchema } from '../../database/schema/Designs.schema'; // ✅ plural
import { CartService } from './cart.service';
import { CartController } from './cart.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },
      { name: 'Designs', schema: DesignsSchema }, // ✅ register Designs model
    ]),
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}