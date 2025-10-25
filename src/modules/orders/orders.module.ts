// src/modules/orders/orders.module.ts
import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Orders, OrdersSchema } from '../../database/schema/Orders.schema';
import { Designs, DesignsSchema } from '../../database/schema/Designs.schema';
import { Users, UsersSchema } from '../../database/schema/Users.schema';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  imports: [
    MongooseModule.forFeature([
      { name: Orders.name, schema: OrdersSchema },
      { name: Designs.name, schema: DesignsSchema },
      { name: Users.name, schema: UsersSchema },
    ]),
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
