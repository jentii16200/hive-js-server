// src/modules/payments/payments.controller.ts
import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  async createPayment(@Body() createPaymentDto: CreatePaymentDto) {
    console.log('[DEBUG] createPaymentDto:', createPaymentDto);
    return this.paymentsService.createPayment(createPaymentDto);
  }

  @Post('confirm')
  async confirmPayment(@Body() dto: ConfirmPaymentDto) {
    return this.paymentsService.confirmPayment(dto);
  }

  @Post('webhook/paymongo')
  async paymongoWebhook(@Req() req: any) {
    return this.paymentsService.handlePaymongoWebhook(req.body);
  }

  @Get()
  async findAllPayments() {
    return this.paymentsService.findAllPayments();
  }

  // Option A: generic confirm with explicit paymentMethod param
  @Get('confirm/:paymentMethod/:transactionId')
  async confirmPaymentByParam(
    @Param('paymentMethod') paymentMethod: string,
    @Param('transactionId') transactionId: string,
    @Param('orderId') orderId: string,
    @Param('amount') amount: number,
  ) {
    if (!transactionId || transactionId.trim() === '') {
      return {
        statusCode: 400,
        message: 'Transaction ID is required',
        data: {},
      };
    }
    const dto: ConfirmPaymentDto = {
      transactionId,
      paymentMethod: paymentMethod as any,
      orderId,
      amount,
    };
    return this.paymentsService.confirmPayment(dto);
  }

  // Option B (simpler): if you only want GCash via GET
  // @Get('confirm/:transactionId')
  // async confirmPaymentByParam(@Param('transactionId') transactionId: string) {
  //   if (!transactionId || transactionId.trim() === '') {
  //     return { statusCode: 400, message: 'Transaction ID is required', data: {} };
  //   }
  //   const dto: ConfirmPaymentDto = {
  //     transactionId,
  //     paymentMethod: 'paymongo_gcash',
  //   };
  //   return this.paymentsService.confirmPayment(dto);
  // }
}
