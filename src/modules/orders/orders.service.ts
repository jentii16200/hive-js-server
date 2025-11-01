// src/modules/orders/orders.service.ts
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Orders } from '../../database/schema/Orders.schema';
import { RESPONSE } from '../../utils/response.util';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(@InjectModel(Orders.name) private orderModel: Model<Orders>) {}

  async createOrder(createOrderDto: CreateOrderDto) {
    try {
      // compute total
      const itemsTotal = createOrderDto.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      const shippingFee =
        createOrderDto.shippingAddress.city.toLowerCase().includes('manila') ||
        createOrderDto.shippingAddress.province.toLowerCase().includes('manila')
          ? 100
          : 200;

      const totalAmount = itemsTotal + shippingFee;

      const newOrder = new this.orderModel({
        ...createOrderDto,
        totalAmount,
        status:
          createOrderDto.paymentMethod === 'cod'
            ? 'awaiting_cod'
            : 'awaiting_payment',
        orderedAt: new Date(),
      });

      const savedOrder = await newOrder.save();
      if (!savedOrder) {
        return RESPONSE(HttpStatus.BAD_REQUEST, {}, 'Order not created');
      }
      return RESPONSE(
        HttpStatus.CREATED,
        savedOrder,
        'Order created successfully',
      );
    } catch (error: any) {
      return RESPONSE(
        HttpStatus.INTERNAL_SERVER_ERROR,
        {},
        'Error creating order: ' + error.message,
      );
    }
  }

  async findAllOrders(page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        this.orderModel
          .find()
          .populate('userId', 'fullName email')
          .populate('items.productId', 'designName price')
          .sort({ orderedAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.orderModel.countDocuments().exec(),
      ]);

      const totalPages = Math.ceil(total / limit);

      return RESPONSE(
        HttpStatus.OK,
        {
          orders,
          pagination: {
            total,
            page,
            limit,
            totalPages,
          },
        },
        'Orders fetched successfully',
      );
    } catch (error: any) {
      return RESPONSE(
        HttpStatus.INTERNAL_SERVER_ERROR,
        {},
        'Error fetching orders: ' + error.message,
      );
    }
  }

  async findOneOrder(id: string) {
    try {
      const order = await this.orderModel
        .findById(id)
        .populate('userId', 'name email')
        .populate('items.productId', 'designName price')
        .exec();

      if (!order) {
        return RESPONSE(HttpStatus.NOT_FOUND, {}, 'Order not found');
      }
      return RESPONSE(HttpStatus.OK, order, 'Order fetched successfully');
    } catch (error: any) {
      return RESPONSE(
        HttpStatus.INTERNAL_SERVER_ERROR,
        {},
        'Error fetching order: ' + error.message,
      );
    }
  }

  async updateOrderStatus(id: string, status: string) {
    try {
      const order = await this.orderModel
        .findByIdAndUpdate(id, { status }, { new: true })
        .populate('userId', 'name email')
        .populate('items.productId', 'designName price')
        .exec();

      if (!order) {
        return RESPONSE(HttpStatus.NOT_FOUND, {}, 'Order not found');
      }
      return RESPONSE(
        HttpStatus.OK,
        order,
        'Order status updated successfully',
      );
    } catch (error: any) {
      return RESPONSE(
        HttpStatus.INTERNAL_SERVER_ERROR,
        {},
        'Error updating order status: ' + error.message,
      );
    }
  }

  async deleteOrder(id: string) {
    try {
      const result = await this.orderModel.findByIdAndDelete(id).exec();
      if (!result) {
        return RESPONSE(HttpStatus.NOT_FOUND, {}, 'Order not found');
      }
      return RESPONSE(HttpStatus.OK, {}, 'Order deleted successfully');
    } catch (error: any) {
      return RESPONSE(
        HttpStatus.INTERNAL_SERVER_ERROR,
        {},
        'Error deleting order: ' + error.message,
      );
    }
  }

  async cancelOrder(id: string) {
    try {
      const order = await this.orderModel.findById(id).exec();

      if (!order) {
        return RESPONSE(HttpStatus.NOT_FOUND, {}, 'Order not found');
      }

      // Prevent cancelling if already shipped or delivered
      if (['shipped', 'delivered'].includes(order.status)) {
        return RESPONSE(
          HttpStatus.BAD_REQUEST,
          {},
          'Cannot cancel a shipped or delivered order',
        );
      }

      order.status = 'cancelled';
      order.cancelledAt = new Date();
      await order.save();

      return RESPONSE(HttpStatus.OK, order, 'Order cancelled successfully');
    } catch (error: any) {
      return RESPONSE(
        HttpStatus.INTERNAL_SERVER_ERROR,
        {},
        'Error cancelling order: ' + error.message,
      );
    }
  }
}
