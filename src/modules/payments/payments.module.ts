// src/modules/payments/payments.module.ts
import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Payments,
  PaymentsSchema,
} from '../../database/schema/Payments.schema';
import { Orders, OrdersSchema } from '../../database/schema/Orders.schema';
import { Users, UsersSchema } from '../../database/schema/Users.schema'

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService],
  imports: [
    MongooseModule.forFeature([
      { name: Payments.name, schema: PaymentsSchema },
      { name: Orders.name, schema: OrdersSchema },
      { name: Users.name, schema: UsersSchema }
    ]),
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
