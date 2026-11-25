import type { Request, Response } from 'express';
import { prisma } from '../config/db.ts';
import { Models, safeJsonParse, serializeOrder } from '../models/index.ts';
import {
  calculateCartTotals,
  calculateCouponDiscount,
} from '../../../src/utils/commerce.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';

export async function listPublicCoupons(_req: Request, res: Response) {
  try {
    const coupons = await Models.Coupon.findMany({
      where: {
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { discountPercent: 'desc' },
    });
    return res.json({ coupons });
  } catch (err) {
    console.error('List coupons error:', err);
    return res.status(500).json({ error: 'Failed to load offers.' });
  }
}

export async function validateCoupon(req: Request, res: Response) {
  try {
    const code = String(req.body?.code || '').trim().toUpperCase();
    const subtotal = Number(req.body?.subtotal || 0);

    if (!code) {
      return res.status(400).json({ error: 'Please enter a coupon code.' });
    }

    const coupon = await Models.Coupon.findUnique({ where: { code } });
    const check = calculateCouponDiscount(subtotal, coupon);

    if (!check.valid) {
      return res.status(400).json({ error: check.reason || 'Invalid coupon code.' });
    }

    return res.json({
      valid: true,
      coupon,
      discountAmount: check.discount,
    });
  } catch (err) {
    console.error('Validate coupon error:', err);
    return res.status(500).json({ error: 'Failed to validate coupon.' });
  }
}

export async function placeOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
    const paymentMethod = String(req.body?.paymentMethod || 'COD').toUpperCase();
    const upiId = String(req.body?.upiId || '').trim();
    const couponCode = String(req.body?.couponCode || '').trim().toUpperCase();
    const addressIdInput = req.body?.addressId ? Number(req.body.addressId) : null;
    const addressPayload = req.body?.address || null;
    const saveAddress = Boolean(req.body?.saveAddress);

    if (rawItems.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty.' });
    }
    if (paymentMethod !== 'COD' && paymentMethod !== 'UPI') {
      return res.status(400).json({ error: 'Payment method must be COD or UPI.' });
    }
    if (paymentMethod === 'UPI' && (!upiId || !upiId.includes('@'))) {
      return res.status(400).json({ error: 'Please enter a valid UPI ID (e.g. name@upi).' });
    }

    let resolvedAddress: {
      id?: number;
      fullName: string;
      phone: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    } | null = null;

    if (addressIdInput) {
      const owned = await Models.Address.findFirst({
        where: { id: addressIdInput, userId },
      });
      if (!owned) {
        return res.status(400).json({ error: 'Selected delivery address not found.' });
      }
      resolvedAddress = owned;
    } else if (addressPayload) {
      const fullName = String(addressPayload.fullName || '').trim();
      const phone = String(addressPayload.phone || '').trim();
      const line1 = String(addressPayload.line1 || '').trim();
      const line2 = String(addressPayload.line2 || '').trim();
      const city = String(addressPayload.city || '').trim();
      const state = String(addressPayload.state || '').trim();
      const postalCode = String(addressPayload.postalCode || '').trim();
      const country = String(addressPayload.country || 'India').trim();

      if (!fullName || !phone || !line1 || !city || !state || !postalCode) {
        return res.status(400).json({ error: 'All required shipping address fields must be provided.' });
      }
      resolvedAddress = { fullName, phone, line1, line2, city, state, postalCode, country };
    } else {
      return res.status(400).json({ error: 'Delivery address is required.' });
    }

    const order = await prisma.$transaction(async (tx) => {
      let savedAddressId: number | null = resolvedAddress!.id || null;
      if (!savedAddressId && saveAddress) {
        const createdAddr = await tx.address.create({
          data: {
            userId,
            fullName: resolvedAddress!.fullName,
            phone: resolvedAddress!.phone,
            line1: resolvedAddress!.line1,
            line2: resolvedAddress!.line2 || '',
            city: resolvedAddress!.city,
            state: resolvedAddress!.state,
            postalCode: resolvedAddress!.postalCode,
            country: resolvedAddress!.country,
            isDefault: false,
          },
        });
        savedAddressId = createdAddr.id;
      }

      const verifiedItems: Array<{
        productId: number;
        productName: string;
        productImage: string;
        price: number;
        mrp: number;
        quantity: number;
      }> = [];

      for (const entry of rawItems) {
        const productId = Number(entry?.productId);
        const quantity = Math.floor(Number(entry?.quantity));
        if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
          throw new Error('INVALID_ITEM');
        }
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) {
          throw new Error('PRODUCT_NOT_FOUND');
        }
        if (product.stock < quantity) {
          throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
        }

        await tx.product.update({
          where: { id: productId },
          data: {
            stock: { decrement: quantity },
            soldCount: { increment: quantity },
          },
        });

        const images = safeJsonParse<string[]>(product.images, []);
        verifiedItems.push({
          productId: product.id,
          productName: product.name,
          productImage: images[0] || '',
          price: product.price,
          mrp: product.mrp,
          quantity,
        });
      }

      let coupon = null;
      if (couponCode) {
        coupon = await tx.coupon.findUnique({ where: { code: couponCode } });
      }

      const totals = calculateCartTotals(verifiedItems, coupon);
      if (couponCode && totals.couponError) {
        throw new Error(`COUPON_ERROR:${totals.couponError}`);
      }
      if (coupon && totals.couponDiscount > 0) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usageCount: { increment: 1 } },
        });
      }

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const year = new Date().getFullYear();
      const orderCode = `HM-${year}-${Date.now().toString().slice(-4)}${randomSuffix}`.slice(0, 16);

      const initialNote =
        paymentMethod === 'UPI'
          ? `Order confirmed via UPI (${upiId})`
          : 'Order placed with Cash on Delivery';

      return tx.order.create({
        data: {
          orderCode,
          userId,
          addressId: savedAddressId,
          shippingAddressJson: JSON.stringify(resolvedAddress),
          paymentMethod,
          paymentStatus: paymentMethod === 'UPI' ? 'PAID' : 'PENDING',
          upiId: paymentMethod === 'UPI' ? upiId : '',
          status: 'PLACED',
          subtotal: totals.subtotal,
          discountAmount: totals.couponDiscount,
          shippingFee: totals.shippingFee,
          totalAmount: totals.totalAmount,
          couponCode: totals.couponDiscount > 0 ? couponCode : '',
          trackingHistoryJson: JSON.stringify([
            {
              status: 'PLACED',
              timestamp: new Date().toISOString(),
              note: initialNote,
            },
          ]),
          items: {
            create: verifiedItems,
          },
        },
        include: {
          items: true,
          returns: true,
        },
      });
    });

    return res.status(201).json({ order: serializeOrder(order) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '';
    if (message === 'INVALID_ITEM' || message === 'PRODUCT_NOT_FOUND') {
      return res.status(400).json({ error: 'One or more cart items are invalid or unavailable.' });
    }
    if (message.startsWith('INSUFFICIENT_STOCK:')) {
      return res.status(400).json({
        error: `Insufficient stock for ${message.replace('INSUFFICIENT_STOCK:', '')}.`,
      });
    }
    if (message.startsWith('COUPON_ERROR:')) {
      return res.status(400).json({ error: message.replace('COUPON_ERROR:', '') });
    }
    console.error('Place order error:', err);
    return res.status(500).json({ error: 'Failed to place order.' });
  }
}

export async function getMyOrders(req: AuthenticatedRequest, res: Response) {
  try {
    const orders = await Models.Order.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        returns: { orderBy: { createdAt: 'desc' } },
      },
    });
    return res.json({ orders: orders.map((o) => serializeOrder(o)) });
  } catch (err) {
    console.error('Get my orders error:', err);
    return res.status(500).json({ error: 'Failed to load orders.' });
  }
}

export async function trackOrderByCode(req: Request, res: Response) {
  try {
    const code = String(req.params.orderCode || '').trim().toUpperCase();
    if (!code) {
      return res.status(400).json({ error: 'Order ID is required.' });
    }

    const order = await Models.Order.findUnique({
      where: { orderCode: code },
      include: { items: true, returns: true },
    });

    if (!order) {
      return res.status(404).json({ error: `No order found matching ID "${code}".` });
    }

    const addr = safeJsonParse<Record<string, string>>(order.shippingAddressJson, {});
    const serialized = serializeOrder(order);

    // Mask street line/phone for public tracking lookup while keeping city/state/items/timeline
    return res.json({
      order: {
        ...serialized,
        shippingAddress: {
          fullName: addr.fullName || 'Customer',
          city: addr.city || '',
          state: addr.state || '',
          postalCode: addr.postalCode || '',
        },
      },
    });
  } catch (err) {
    console.error('Track order error:', err);
    return res.status(500).json({ error: 'Failed to track order.' });
  }
}

export async function requestReturn(req: AuthenticatedRequest, res: Response) {
  try {
    const orderId = Number(req.params.id);
    const type = String(req.body?.type || 'RETURN').toUpperCase();
    const reason = String(req.body?.reason || '').trim();
    const comments = String(req.body?.comments || '').trim();

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: 'Invalid order ID.' });
    }
    if (type !== 'RETURN' && type !== 'REPLACE') {
      return res.status(400).json({ error: 'Request type must be RETURN or REPLACE.' });
    }
    if (reason.length < 4) {
      return res.status(400).json({ error: 'Please specify a reason for your request.' });
    }

    const order = await Models.Order.findFirst({
      where: { id: orderId, userId: req.user!.userId },
      include: { returns: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    if (order.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Cancelled orders cannot be returned.' });
    }
    if (order.returns.some((r) => r.status === 'PENDING' || r.status === 'APPROVED')) {
      return res.status(409).json({ error: 'A return or replacement request already exists for this order.' });
    }

    const created = await Models.ReturnRequest.create({
      data: {
        orderId: order.id,
        userId: req.user!.userId,
        type,
        reason,
        comments,
        status: 'PENDING',
      },
    });

    return res.status(201).json({ returnRequest: created });
  } catch (err) {
    console.error('Request return error:', err);
    return res.status(500).json({ error: 'Failed to submit return request.' });
  }
}
