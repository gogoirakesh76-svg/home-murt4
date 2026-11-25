import type { Response } from 'express';
import { prisma } from '../config/db.ts';
import { Models, serializeProduct } from '../models/index.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';

export async function getAddresses(req: AuthenticatedRequest, res: Response) {
  try {
    const addresses = await Models.Address.findMany({
      where: { userId: req.user!.userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return res.json({ addresses });
  } catch (err) {
    console.error('Get addresses error:', err);
    return res.status(500).json({ error: 'Failed to load addresses.' });
  }
}

export async function addAddress(req: AuthenticatedRequest, res: Response) {
  try {
    const fullName = String(req.body?.fullName || '').trim();
    const phone = String(req.body?.phone || '').trim();
    const line1 = String(req.body?.line1 || '').trim();
    const line2 = String(req.body?.line2 || '').trim();
    const city = String(req.body?.city || '').trim();
    const state = String(req.body?.state || '').trim();
    const postalCode = String(req.body?.postalCode || '').trim();
    const country = String(req.body?.country || 'India').trim();
    const isDefault = Boolean(req.body?.isDefault);

    if (!fullName || !phone || !line1 || !city || !state || !postalCode) {
      return res.status(400).json({ error: 'Please fill all required address fields.' });
    }

    const address = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.address.updateMany({
          where: { userId: req.user!.userId },
          data: { isDefault: false },
        });
      }
      return tx.address.create({
        data: {
          userId: req.user!.userId,
          fullName,
          phone,
          line1,
          line2,
          city,
          state,
          postalCode,
          country,
          isDefault,
        },
      });
    });

    return res.status(201).json({ address });
  } catch (err) {
    console.error('Add address error:', err);
    return res.status(500).json({ error: 'Failed to save address.' });
  }
}

export async function deleteAddress(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid address ID.' });
    }

    const existing = await Models.Address.findFirst({
      where: { id, userId: req.user!.userId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Address not found.' });
    }

    await Models.Address.delete({ where: { id } });
    return res.json({ message: 'Address removed.' });
  } catch (err) {
    console.error('Delete address error:', err);
    return res.status(500).json({ error: 'Failed to delete address.' });
  }
}

export async function getWishlist(req: AuthenticatedRequest, res: Response) {
  try {
    const entries = await Models.Wishlist.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      include: { product: { include: { category: true } } },
    });
    return res.json({
      items: entries.map((e) => serializeProduct(e.product)),
    });
  } catch (err) {
    console.error('Get wishlist error:', err);
    return res.status(500).json({ error: 'Failed to load wishlist.' });
  }
}

export async function toggleWishlist(req: AuthenticatedRequest, res: Response) {
  try {
    const productId = Number(req.body?.productId ?? req.params.productId);
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ error: 'Invalid product ID.' });
    }

    const product = await Models.Product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const existing = await Models.Wishlist.findUnique({
      where: { userId_productId: { userId: req.user!.userId, productId } },
    });

    let saved = false;
    if (existing) {
      await Models.Wishlist.delete({ where: { id: existing.id } });
      saved = false;
    } else {
      await Models.Wishlist.create({
        data: { userId: req.user!.userId, productId },
      });
      saved = true;
    }

    const entries = await Models.Wishlist.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      include: { product: { include: { category: true } } },
    });

    return res.json({
      saved,
      items: entries.map((e) => serializeProduct(e.product)),
    });
  } catch (err) {
    console.error('Toggle wishlist error:', err);
    return res.status(500).json({ error: 'Failed to update wishlist.' });
  }
}
