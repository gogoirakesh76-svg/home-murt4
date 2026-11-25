import type { Request, Response } from 'express';
import { prisma } from '../config/db.ts';
import {
  Models,
  safeJsonParse,
  sanitizeUser,
  serializeOrder,
  serializeProduct,
} from '../models/index.ts';
import { computeDiscountPercent, ORDER_STATUS_SEQUENCE } from '../../../src/utils/commerce.ts';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
}

export async function getDashboardStats(_req: Request, res: Response) {
  try {
    const [
      totalOrders,
      totalUsers,
      totalProducts,
      pendingReturns,
      allOrders,
      lowStockProducts,
      recentOrders,
    ] = await Promise.all([
      Models.Order.count(),
      Models.User.count(),
      Models.Product.count(),
      Models.ReturnRequest.count({ where: { status: 'PENDING' } }),
      Models.Order.findMany({
        select: { totalAmount: true, status: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      Models.Product.findMany({
        where: { stock: { lte: 5 } },
        orderBy: { stock: 'asc' },
        include: { category: true },
      }),
      Models.Order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      }),
    ]);

    const totalRevenue = allOrders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    // Build 7-day daily orders + revenue series
    const chartMap = new Map<string, { label: string; orders: number; revenue: number }>();
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      chartMap.set(key, { label, orders: 0, revenue: 0 });
    }
    for (const o of allOrders) {
      const key = new Date(o.createdAt).toISOString().slice(0, 10);
      const bucket = chartMap.get(key);
      if (bucket) {
        bucket.orders += 1;
        if (o.status !== 'CANCELLED') {
          bucket.revenue += o.totalAmount;
        }
      }
    }

    return res.json({
      stats: {
        totalOrders,
        totalRevenue,
        totalUsers,
        totalProducts,
        pendingReturns,
        lowStockCount: lowStockProducts.length,
      },
      lowStockProducts: lowStockProducts.map((p) => serializeProduct(p)),
      recentOrders: recentOrders.map((o) => serializeOrder(o)),
      chartSeries: Array.from(chartMap.values()),
    });
  } catch (err) {
    console.error('Admin dashboard stats error:', err);
    return res.status(500).json({ error: 'Failed to load dashboard metrics.' });
  }
}

export async function createProduct(req: Request, res: Response) {
  try {
    const name = String(req.body?.name || '').trim();
    const description = String(req.body?.description || '').trim();
    const price = Number(req.body?.price);
    const mrp = Number(req.body?.mrp || price);
    const stock = Math.max(0, Math.floor(Number(req.body?.stock || 0)));
    const categoryId = Number(req.body?.categoryId);
    const sku = String(req.body?.sku || `HM-${Date.now().toString().slice(-5)}`).trim();
    const isBestSeller = Boolean(req.body?.isBestSeller);
    const isNewArrival = Boolean(req.body?.isNewArrival);
    const isFeatured = Boolean(req.body?.isFeatured);
    const rawImages = Array.isArray(req.body?.images)
      ? req.body.images.filter((u: unknown) => typeof u === 'string' && u.trim())
      : [];

    if (!name || !description || !Number.isFinite(price) || price <= 0 || !Number.isInteger(categoryId)) {
      return res.status(400).json({ error: 'Name, description, valid price, and category are required.' });
    }

    const validMrp = Number.isFinite(mrp) && mrp >= price ? mrp : price;
    const explicitOffer = Number(req.body?.discountPercent);
    const discountPercent =
      Number.isFinite(explicitOffer) && explicitOffer >= 0 && explicitOffer <= 95
        ? Math.round(explicitOffer)
        : computeDiscountPercent(price, validMrp);

    const baseSlug = slugify(name) || `product-${Date.now()}`;
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const created = await Models.Product.create({
      data: {
        name,
        slug,
        description,
        price,
        mrp: validMrp,
        discountPercent,
        stock,
        sku,
        images: JSON.stringify(rawImages),
        isBestSeller,
        isNewArrival,
        isFeatured,
        categoryId,
      },
      include: { category: true },
    });

    return res.status(201).json({ product: serializeProduct(created) });
  } catch (err) {
    console.error('Create product error:', err);
    return res.status(500).json({ error: 'Failed to create product.' });
  }
}

export async function updateProduct(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid product ID.' });
    }

    const existing = await Models.Product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const name = req.body?.name !== undefined ? String(req.body.name).trim() : existing.name;
    const description =
      req.body?.description !== undefined ? String(req.body.description).trim() : existing.description;
    const price = req.body?.price !== undefined ? Number(req.body.price) : existing.price;
    const mrp = req.body?.mrp !== undefined ? Number(req.body.mrp) : existing.mrp;
    const stock =
      req.body?.stock !== undefined ? Math.max(0, Math.floor(Number(req.body.stock))) : existing.stock;
    const categoryId =
      req.body?.categoryId !== undefined ? Number(req.body.categoryId) : existing.categoryId;
    const sku = req.body?.sku !== undefined ? String(req.body.sku).trim() : existing.sku;
    const isBestSeller =
      req.body?.isBestSeller !== undefined ? Boolean(req.body.isBestSeller) : existing.isBestSeller;
    const isNewArrival =
      req.body?.isNewArrival !== undefined ? Boolean(req.body.isNewArrival) : existing.isNewArrival;
    const isFeatured =
      req.body?.isFeatured !== undefined ? Boolean(req.body.isFeatured) : existing.isFeatured;
    const images = Array.isArray(req.body?.images)
      ? JSON.stringify(req.body.images.filter((u: unknown) => typeof u === 'string' && u.trim()))
      : existing.images;

    const validMrp = Number.isFinite(mrp) && mrp >= price ? mrp : price;
    const discountPercent =
      req.body?.discountPercent !== undefined
        ? Math.max(0, Math.min(95, Math.round(Number(req.body.discountPercent))))
        : computeDiscountPercent(price, validMrp);

    const updated = await Models.Product.update({
      where: { id },
      data: {
        name,
        description,
        price,
        mrp: validMrp,
        discountPercent,
        stock,
        sku,
        categoryId,
        images,
        isBestSeller,
        isNewArrival,
        isFeatured,
      },
      include: { category: true },
    });

    return res.json({ product: serializeProduct(updated) });
  } catch (err) {
    console.error('Update product error:', err);
    return res.status(500).json({ error: 'Failed to update product.' });
  }
}

export async function deleteProduct(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid product ID.' });
    }
    await Models.Product.delete({ where: { id } });
    return res.json({ message: 'Product deleted.' });
  } catch (err) {
    console.error('Delete product error:', err);
    return res.status(500).json({ error: 'Failed to delete product.' });
  }
}

export function uploadProductImage(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded.' });
  }
  return res.status(201).json({
    url: `/uploads/${req.file.filename}`,
  });
}

export async function listAllOrders(_req: Request, res: Response) {
  try {
    const orders = await Models.Order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        returns: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
    return res.json({ orders: orders.map((o) => serializeOrder(o)) });
  } catch (err) {
    console.error('Admin list orders error:', err);
    return res.status(500).json({ error: 'Failed to load orders.' });
  }
}

export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const status = String(req.body?.status || '').toUpperCase();
    const note = String(req.body?.note || '').trim();

    const allowed = [...ORDER_STATUS_SEQUENCE, 'CANCELLED'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status.' });
    }

    const order = await Models.Order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const history = safeJsonParse<Array<{ status: string; timestamp: string; note: string }>>(
      order.trackingHistoryJson,
      []
    );
    history.push({
      status,
      timestamp: new Date().toISOString(),
      note: note || `Order status updated to ${status.replace(/_/g, ' ')}`,
    });

    const updated = await Models.Order.update({
      where: { id },
      data: {
        status,
        paymentStatus: status === 'DELIVERED' ? 'PAID' : order.paymentStatus,
        trackingHistoryJson: JSON.stringify(history),
      },
      include: {
        items: true,
        returns: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    return res.json({ order: serializeOrder(updated) });
  } catch (err) {
    console.error('Update order status error:', err);
    return res.status(500).json({ error: 'Failed to update order status.' });
  }
}

export async function listReturnRequests(_req: Request, res: Response) {
  try {
    const returns = await Models.ReturnRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        order: { include: { items: true } },
      },
    });
    return res.json({ returns });
  } catch (err) {
    console.error('List returns error:', err);
    return res.status(500).json({ error: 'Failed to load return requests.' });
  }
}

export async function resolveReturnRequest(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const status = String(req.body?.status || '').toUpperCase();
    const adminNote = String(req.body?.adminNote || '').trim();

    if (!['APPROVED', 'REJECTED', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid return resolution status.' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const rr = await tx.returnRequest.update({
        where: { id },
        data: { status, adminNote },
      });
      if (status === 'APPROVED' && rr.type === 'RETURN') {
        await tx.order.update({
          where: { id: rr.orderId },
          data: { paymentStatus: 'REFUNDED' },
        });
      }
      return rr;
    });

    return res.json({ returnRequest: updated });
  } catch (err) {
    console.error('Resolve return error:', err);
    return res.status(500).json({ error: 'Failed to update return request.' });
  }
}

export async function listCoupons(_req: Request, res: Response) {
  try {
    const coupons = await Models.Coupon.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json({ coupons });
  } catch (err) {
    console.error('Admin list coupons error:', err);
    return res.status(500).json({ error: 'Failed to load coupons.' });
  }
}

export async function createCoupon(req: Request, res: Response) {
  try {
    const code = String(req.body?.code || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const description = String(req.body?.description || '').trim();
    const discountPercent = Math.round(Number(req.body?.discountPercent));
    const minOrderAmount = Math.max(0, Number(req.body?.minOrderAmount || 0));
    const maxDiscount = Math.max(0, Number(req.body?.maxDiscount || 0));
    const expiresAt = new Date(String(req.body?.expiresAt || ''));

    if (!code || code.length < 3) {
      return res.status(400).json({ error: 'Coupon code must be at least 3 alphanumeric characters.' });
    }
    if (!Number.isFinite(discountPercent) || discountPercent < 1 || discountPercent > 90) {
      return res.status(400).json({ error: 'Discount percentage must be between 1% and 90%.' });
    }
    if (Number.isNaN(expiresAt.getTime())) {
      return res.status(400).json({ error: 'Valid expiry date is required.' });
    }

    const created = await Models.Coupon.create({
      data: {
        code,
        description: description || `${discountPercent}% off`,
        discountPercent,
        minOrderAmount,
        maxDiscount,
        expiresAt,
        isActive: true,
      },
    });
    return res.status(201).json({ coupon: created });
  } catch (err) {
    console.error('Create coupon error:', err);
    return res.status(500).json({ error: 'Failed to create coupon. Code may already exist.' });
  }
}

export async function toggleCoupon(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const existing = await Models.Coupon.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Coupon not found.' });
    }
    const updated = await Models.Coupon.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });
    return res.json({ coupon: updated });
  } catch (err) {
    console.error('Toggle coupon error:', err);
    return res.status(500).json({ error: 'Failed to toggle coupon.' });
  }
}

export async function deleteCoupon(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    await Models.Coupon.delete({ where: { id } });
    return res.json({ message: 'Coupon deleted.' });
  } catch (err) {
    console.error('Delete coupon error:', err);
    return res.status(500).json({ error: 'Failed to delete coupon.' });
  }
}

export async function listUsers(_req: Request, res: Response) {
  try {
    const users = await Models.User.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { orders: true, addresses: true } } },
    });
    return res.json({
      users: users.map((u) => ({
        ...sanitizeUser(u),
        orderCount: u._count.orders,
        addressCount: u._count.addresses,
      })),
    });
  } catch (err) {
    console.error('List users error:', err);
    return res.status(500).json({ error: 'Failed to load users.' });
  }
}

export async function toggleBlockUser(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const existing = await Models.User.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const updated = await Models.User.update({
      where: { id },
      data: { isBlocked: !existing.isBlocked },
    });
    return res.json({ user: sanitizeUser(updated) });
  } catch (err) {
    console.error('Toggle block user error:', err);
    return res.status(500).json({ error: 'Failed to update user status.' });
  }
}

export async function listAddresses(_req: Request, res: Response) {
  try {
    const addresses = await Models.Address.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return res.json({ addresses });
  } catch (err) {
    console.error('Admin list addresses error:', err);
    return res.status(500).json({ error: 'Failed to load addresses.' });
  }
}
