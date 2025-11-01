// src/modules/orders/orders.service.ts
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
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

  async findAllOrders(page = 1, limit = 10, search?: string) {
    try {
      const skip = (page - 1) * limit;
      const pipeline: any[] = [];

      // 1. Convert userId string → ObjectId
      pipeline.push({
        $addFields: {
          userObjectId: {
            $cond: {
              if: { $eq: [{ $type: '$userId' }, 'string'] },
              then: { $toObjectId: '$userId' },
              else: '$userId',
            },
          },
        },
      });

      // 2. Lookup users
      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'userObjectId',
          foreignField: '_id',
          as: 'user',
        },
      });
      pipeline.push({
        $unwind: { path: '$user', preserveNullAndEmptyArrays: true },
      });

      // ✅ Rename for frontend compatibility
      pipeline.push({
        $addFields: { userId: '$user' },
      });

      // 3. Lookup products
      pipeline.push({
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'products',
        },
      });

      // 4. Search
      if (search) {
        const regex = new RegExp(search, 'i');
        const isObjectId =
          /^[0-9a-fA-F]{24}$/.test(search.trim()) || search.length >= 12;

        const match: any = {
          $or: [
            { 'shippingAddress.fullName': { $regex: regex } },
            { 'shippingAddress.phone': { $regex: regex } },
            { 'userId.fullName': { $regex: regex } },
            { 'userId.email': { $regex: regex } },
          ],
        };

        if (isObjectId) {
          match.$or.push({ _id: new mongoose.Types.ObjectId(search.trim()) });
        }

        pipeline.push({ $match: match });
      }

      // 5. Sort & Paginate
      pipeline.push({ $sort: { orderedAt: -1 } });
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });

      // 6. Project
      pipeline.push({
        $project: {
          _id: 1,
          status: 1,
          totalAmount: 1,
          paymentMethod: 1,
          orderedAt: 1,
          shippingAddress: 1,
          'userId._id': 1,
          'userId.fullName': 1,
          'userId.email': 1,
          'products._id': 1,
          'products.designName': 1,
          'products.price': 1,
          'products.imageUrl': 1,
        },
      });

      // 7. Count total
      const [orders, totalCount] = await Promise.all([
        this.orderModel.aggregate(pipeline),
        this.orderModel
          .aggregate([...pipeline.slice(0, -3), { $count: 'total' }])
          .then((res) => res[0]?.total || 0),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return RESPONSE(
        HttpStatus.OK,
        {
          orders,
          pagination: { total: totalCount, page, limit, totalPages },
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

  async findByUserAndStatus(userId: string, status: string) {
    try {
      const orders = await this.orderModel
        .find({ userId, status })
        .populate('userId', 'fullName email')
        .populate('items.productId', 'designName price imageUrl')
        .sort({ orderedAt: -1 })
        .exec();

      if (!orders || orders.length === 0) {
        return RESPONSE(
          HttpStatus.NOT_FOUND,
          [],
          'No orders found for this user and status',
        );
      }

      return RESPONSE(HttpStatus.OK, orders, 'Orders fetched successfully');
    } catch (error: any) {
      return RESPONSE(
        HttpStatus.INTERNAL_SERVER_ERROR,
        {},
        'Error fetching orders: ' + error.message,
      );
    }
  }
}
