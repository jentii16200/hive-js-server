import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart } from '../../database/schema/Cart.schema';
import { Designs } from '../../database/schema/Designs.schema';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
    @InjectModel('Designs') private designModel: Model<Designs>,
  ) {}

  async addToCart(
    userId: string,
    designId: string,
    quantity = 1,
    color?: string,
    size?: string,
  ) {
    const design = await this.designModel.findById(designId);
    if (!design) throw new NotFoundException('Design not found');

    let cart = await this.cartModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (!cart) {
      cart = new this.cartModel({
        userId: new Types.ObjectId(userId),
        items: [],
      });
    }

    const existingItem = cart.items.find(
      (item) =>
        this.matchDesign(item.design, designId) &&
        (item.color ?? '') === (color ?? '') &&
        (item.size ?? '') === (size ?? ''),
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        design: new Types.ObjectId(designId),
        quantity,
        color,
        size,
      });
    }

    await cart.save();
    return this.returnCartWithPopulate(cart._id);
  }

  async getCart(userId: string) {
    const cart = await this.cartModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .populate('items.design', 'designName price imageUrl');
    if (!cart) throw new NotFoundException('Cart not found');
    return this.mapCartResponse(cart);
  }

  async updateQuantity(
    userId: string,
    designId: string,
    quantity: number,
    color?: string,
    size?: string,
  ) {
    const cart = await this.cartModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (!cart) throw new NotFoundException('Cart not found');

    const item = cart.items.find(
      (i) =>
        this.matchDesign(i.design, designId) &&
        (i.color ?? '') === (color ?? '') &&
        (i.size ?? '') === (size ?? ''),
    );
    if (!item) throw new NotFoundException('Item not found in cart');

    item.quantity = Math.max(1, quantity);
    await cart.save();
    return this.returnCartWithPopulate(cart._id);
  }

  async removeItem(
    userId: string,
    designId: string,
    color?: string,
    size?: string,
  ) {
    const cart = await this.cartModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (!cart) throw new NotFoundException('Cart not found');

    cart.items = cart.items.filter(
      (i) =>
        !(
          this.matchDesign(i.design, designId) &&
          (i.color ?? '') === (color ?? '') &&
          (i.size ?? '') === (size ?? '')
        ),
    );

    if (cart.items.length === 0) {
      await this.cartModel.deleteOne({ _id: cart._id });
      return { items: [] };
    }

    await cart.save();
    return this.returnCartWithPopulate(cart._id);
  }

  private async returnCartWithPopulate(cartId: unknown) {
    const populated = await this.cartModel
      .findById(cartId as string | Types.ObjectId)
      .populate('items.design', 'designName price imageUrl');
    return this.mapCartResponse(populated);
  }

  private mapCartResponse(cart: Cart | null) {
    if (!cart) return { items: [] };
    return {
      items: cart.items.map((i) => ({
        design: i.design,
        quantity: i.quantity,
        color: i.color,
        size: i.size,
      })),
    };
  }

  private matchDesign(design: any, designId: string): boolean {
    if (!design) return false;
    if (typeof design === 'string') return design === designId;
    if (design instanceof Types.ObjectId) return design.toString() === designId;
    if (design._id) return design._id.toString() === designId;
    return false;
  }
}
