// src/modules/payments/payments.service.ts
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { Model } from 'mongoose';
import { Orders } from '../../database/schema/Orders.schema';
import { Payments } from '../../database/schema/Payments.schema';
import { Users } from '../../database/schema/Users.schema';
import { RESPONSE } from '../../utils/response.util';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payments.name) private paymentsModel: Model<Payments>,
    @InjectModel(Orders.name) private ordersModel: Model<Orders>,
    @InjectModel(Users.name) private usersModel: Model<Users>,
  ) {}

  private defaultCurrency(currency?: string) {
    return (currency ?? 'php').toLowerCase();
  }

  async createPayment(createPaymentDto: CreatePaymentDto) {
    console.log('triggering');
    try {
      console.log('check asdasd');
      const currency = this.defaultCurrency(createPaymentDto.currency);
      const amountInCents = Math.round(createPaymentDto.amount * 100);

      if (createPaymentDto.paymentMethod === 'cod') {
        const payment = new this.paymentsModel({
          orderId: createPaymentDto.orderId,
          userId: createPaymentDto.userId,
          amount: createPaymentDto.amount,
          paymentMethod: 'cod',
          status: 'pending',
          currency,
          description: createPaymentDto.description,
          metadata: {
            orderId: createPaymentDto.orderId,
            userId: createPaymentDto.userId,
          },
        });

        const savedPayment = await payment.save();
        await this.ordersModel.findByIdAndUpdate(
          createPaymentDto.orderId,
          { status: 'awaiting_cod' },
          { new: true },
        );

        return RESPONSE(
          HttpStatus.CREATED,
          { payment: savedPayment },
          'COD payment created',
        );
      }

      if (createPaymentDto.paymentMethod === 'paymongo_gcash') {
        const secret =
          process.env.PAYMONGO_SECRET_TEST_KEY ??
          process.env.PAYMONGO_SECRET_KEY ??
          '';
        const authHeader =
          'Basic ' + Buffer.from(secret + ':').toString('base64');

        const axiosConfig = {
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
          },
        };

        try {
          // 1. Create Payment Intent
          console.log('[PayMongo] Creating intent...');
          const intentResp = await axios.post(
            'https://api.paymongo.com/v1/payment_intents',
            {
              data: {
                attributes: {
                  amount: amountInCents,
                  payment_method_allowed: ['gcash', 'paymaya'],
                  currency: currency.toUpperCase(),
                  description:
                    createPaymentDto.description ??
                    `Order ${createPaymentDto.orderId}`,
                  metadata: {
                    orderId: createPaymentDto.orderId,
                    userId: createPaymentDto.userId,
                  },
                },
              },
            },
            axiosConfig,
          );

          const intentId = intentResp.data?.data?.id;
          console.log('[PayMongo] Intent created:', intentId);

          // 2. Lookup user for billing
          const user = await this.usersModel
            .findById(createPaymentDto.userId)
            .lean();
          if (!user) {
            return RESPONSE(
              HttpStatus.BAD_REQUEST,
              {},
              'User not found for billing info',
            );
          }

          // 3. Create Payment Method
          console.log('[PayMongo] Creating payment method...');
          const methodResp = await axios.post(
            'https://api.paymongo.com/v1/payment_methods',
            {
              data: {
                attributes: {
                  type: 'gcash',
                  billing: {
                    name: user.fullName,
                    email: user.email,
                    phone: user.phone,
                  },
                },
              },
            },
            axiosConfig,
          );

          const methodId = methodResp.data?.data?.id;
          console.log('[PayMongo] Method created:', methodId);

          // 4. Attach Payment Method to Intent
          console.log('[PayMongo] Attaching payment method...');
          const attachResp = await axios.post(
            `https://api.paymongo.com/v1/payment_intents/${intentId}/attach`,
            {
              data: {
                attributes: {
                  payment_method: methodId,
                  return_url:
                    process.env.PAYMONGO_RETURN_URL ||
                    'https://192.168.254.106:2701/payments/success',
                },
              },
            },
            axiosConfig,
          );

          const redirectUrl =
            attachResp.data?.data?.attributes?.next_action?.redirect?.url;
          console.log('[PayMongo] Redirect URL:', redirectUrl);

          // 5. Save Payment in DB
          const payment = new this.paymentsModel({
            orderId: createPaymentDto.orderId,
            userId: createPaymentDto.userId,
            amount: createPaymentDto.amount,
            paymentMethod: 'paymongo_gcash',
            transactionId: intentId,
            status: 'requires_action', // pending until user completes payment
            currency,
            description: createPaymentDto.description,
            providerResponseRaw: JSON.stringify(attachResp.data),
            metadata: {
              orderId: createPaymentDto.orderId,
              userId: createPaymentDto.userId,
            },
          });

          const savedPayment = await payment.save();

          return RESPONSE(
            HttpStatus.CREATED,
            { redirectUrl, payment: savedPayment },
            'GCash checkout link created',
          );
        } catch (error: any) {
          console.error(
            '[PayMongo] Error:',
            error?.response?.data || error.message,
          );
          const errMsg =
            error?.response?.data?.errors?.[0]?.detail ??
            error.message ??
            'Unknown PayMongo error';
          return RESPONSE(
            HttpStatus.BAD_REQUEST,
            {},
            'Error processing PayMongo payment: ' + errMsg,
          );
        }
      }

      return RESPONSE(
        HttpStatus.BAD_REQUEST,
        {},
        'Unsupported payment method: ' + createPaymentDto.paymentMethod,
      );
    } catch (error: any) {
      console.log('yoow whats the error ', error);
      console.error(
        '[PaymentsService] createPayment error:',
        error?.message,
        error,
      );
      return RESPONSE(
        HttpStatus.INTERNAL_SERVER_ERROR,
        {},
        'Error creating payment: ' + (error?.message ?? 'Unknown error'),
      );
    }
  }

  async confirmPayment(dto: ConfirmPaymentDto) {
    try {
      if (dto.paymentMethod === 'paymongo_gcash') {
        const secret =
          process.env.PAYMONGO_SECRET_TEST_KEY ??
          process.env.PAYMONGO_SECRET_KEY ??
          '';
        const authHeader =
          'Basic ' + Buffer.from(secret + ':').toString('base64');

        const intentUrl = `https://api.paymongo.com/v1/payment_intents/${dto.transactionId}`;
        const resp = await fetch(intentUrl, {
          method: 'GET',
          headers: { Authorization: authHeader },
        });
        const data = await resp.json();

        const attributes = data?.data?.attributes ?? {};
        const paymentsList = attributes?.payments ?? [];
        const lastPayment = Array.isArray(paymentsList)
          ? paymentsList[paymentsList.length - 1]
          : null;
        const lastStatus =
          lastPayment?.attributes?.status ?? attributes?.status ?? 'pending';

        const mapped =
          lastStatus === 'paid'
            ? 'completed'
            : lastStatus === 'failed' || lastStatus === 'canceled'
              ? 'failed'
              : 'processing';

        const updatedPayment = await this.paymentsModel.findOneAndUpdate(
          { transactionId: dto.transactionId },
          {
            status: mapped,
            paidAt: mapped === 'completed' ? new Date() : undefined,
            providerResponseRaw: JSON.stringify(data),
            currency: this.defaultCurrency(dto.currency),
          },
          { new: true },
        );

        if (updatedPayment && mapped === 'completed') {
          await this.ordersModel.findByIdAndUpdate(
            updatedPayment.orderId,
            { status: 'paid' },
            { new: true },
          );
        }

        return RESPONSE(
          HttpStatus.OK,
          updatedPayment,
          'PayMongo payment status updated',
        );
      }

      if (dto.paymentMethod === 'cod') {
        const updatedPayment = await this.paymentsModel.findOneAndUpdate(
          { orderId: dto.orderId, paymentMethod: 'cod' },
          { status: 'completed', paidAt: new Date() },
          { new: true },
        );

        await this.ordersModel.findByIdAndUpdate(
          dto.orderId,
          { status: 'paid' },
          { new: true },
        );

        return RESPONSE(
          HttpStatus.OK,
          updatedPayment,
          'COD payment marked as completed',
        );
      }

      return RESPONSE(
        HttpStatus.BAD_REQUEST,
        {},
        'Unsupported confirm method: ' + dto.paymentMethod,
      );
    } catch (error: any) {
      console.error(
        '[PaymentsService] confirmPayment error:',
        error?.message,
        error,
      );
      return RESPONSE(
        HttpStatus.INTERNAL_SERVER_ERROR,
        {},
        'Error confirming payment: ' + (error?.message ?? 'Unknown error'),
      );
    }
  }

  async handlePaymongoWebhook(body: any) {
    try {
      const eventType = body?.data?.attributes?.type ?? body?.type;
      console.log('[PaymentsService] PayMongo webhook eventType:', eventType);

      const paymentData = body?.data?.attributes?.data ?? body?.data;
      const paymentId = paymentData?.id ?? body?.data?.id;
      const paymentAttributes =
        paymentData?.attributes ?? body?.data?.attributes;

      const updatedPayment = await this.paymentsModel.findOneAndUpdate(
        { transactionId: paymentId },
        {
          status:
            paymentAttributes?.status === 'paid'
              ? 'completed'
              : paymentAttributes?.status === 'failed'
                ? 'failed'
                : paymentAttributes?.status === 'cancelled'
                  ? 'failed'
                  : 'processing',
          paidAt: paymentAttributes?.status === 'paid' ? new Date() : undefined,
          providerResponseRaw: JSON.stringify(body),
        },
        { new: true },
      );

      if (updatedPayment && updatedPayment.status === 'completed') {
        await this.ordersModel.findByIdAndUpdate(
          updatedPayment.orderId,
          { status: 'paid' },
          { new: true },
        );
      }

      return RESPONSE(HttpStatus.OK, updatedPayment, 'Webhook processed');
    } catch (error: any) {
      console.error(
        '[PaymentsService] handlePaymongoWebhook error:',
        error?.message,
        error,
      );
      return RESPONSE(
        HttpStatus.INTERNAL_SERVER_ERROR,
        {},
        'Webhook error: ' + (error?.message ?? 'Unknown error'),
      );
    }
  }

  async findAllPayments() {
    try {
      const payments = await this.paymentsModel
        .find()
        .populate('orderId')
        .populate('userId', 'fullName email')
        .exec();

      console.log('[PaymentsService] findAllPayments count:', payments.length);

      return RESPONSE(HttpStatus.OK, payments, 'Payments fetched successfully');
    } catch (error: any) {
      console.error(
        '[PaymentsService] findAllPayments error:',
        error?.message,
        error,
      );
      return RESPONSE(
        HttpStatus.INTERNAL_SERVER_ERROR,
        {},
        'Error fetching payments: ' + (error?.message ?? 'Unknown error'),
      );
    }
  }
}
