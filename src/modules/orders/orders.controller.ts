// src/modules/orders/orders.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ✅ Create new order (checkout)
  @Post('checkout')
  async create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(createOrderDto);
  }

  // ✅ Get all orders
  @Get()
  async findAll(@Query('page') page = '1', @Query('limit') limit = '10') {
    return this.ordersService.findAllOrders(+page, +limit);
  }

  // ✅ Get one order by ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const order = await this.ordersService.findOneOrder(id);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  // ✅ Update order status (admin/system only)
  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(id, updateStatusDto.status);
  }

  // ✅ Cancel order (user action)
  @Put(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.ordersService.cancelOrder(id);
  }

  // ✅ Hard delete order (admin only)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.ordersService.deleteOrder(id);
  }
}
