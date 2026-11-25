import type { Request, Response } from 'express';
import { prisma } from '../config/db.ts';
import { Models, serializeProduct } from '../models/index.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';

export async function listCategories(_req: Request, res: Response) {
  try {
    const categories = await Models.Category.findMany({
      orderBy: { id: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    return res.json({
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        image: c.image,
        productCount: c._count.products,
      })),
    });
  } catch (err) {
    console.error('List categories error:', err);
    return res.status(500).json({ error: 'Failed to load categories.' });
  }
}

export async function listProducts(req: Request, res: Response) {
  try {
    const q = String(req.query.q || '').trim();
    const category = String(req.query.category || '').trim();
    const section = String(req.query.section || '').trim();
    const sort = String(req.query.sort || 'popularity').trim();
    const minPrice = Number(req.query.minPrice);
    const maxPrice = Number(req.query.maxPrice);
    const minRating = Number(req.query.minRating);

    const where: Record<string, unknown> = {};

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
        { sku: { contains: q } },
        { category: { name: { contains: q } } },
      ];
    }

    if (category && category !== 'all') {
      const catId = Number(category);
      if (Number.isInteger(catId) && catId > 0) {
        where.categoryId = catId;
      } else {
        where.category = { slug: category };
      }
    }

    if (!Number.isNaN(minPrice) && minPrice > 0) {
      where.price = { ...(where.price as object), gte: minPrice };
    }
    if (!Number.isNaN(maxPrice) && maxPrice > 0) {
      where.price = { ...(where.price as object), lte: maxPrice };
    }
    if (!Number.isNaN(minRating) && minRating > 0) {
      where.rating = { gte: minRating };
    }

    if (section === 'best_sellers') {
      where.isBestSeller = true;
    } else if (section === 'new_arrivals') {
      where.isNewArrival = true;
    } else if (section === 'offers') {
      where.discountPercent = { gte: 25 };
    }

    let orderBy: Record<string, 'asc' | 'desc'> = { soldCount: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    else if (sort === 'price_desc') orderBy = { price: 'desc' };
    else if (sort === 'newest') orderBy = { createdAt: 'desc' };
    else if (sort === 'rating') orderBy = { rating: 'desc' };
    else if (sort === 'discount') orderBy = { discountPercent: 'desc' };

    const products = await Models.Product.findMany({
      where,
      orderBy,
      include: { category: true },
    });

    return res.json({
      products: products.map((p) => serializeProduct(p)),
    });
  } catch (err) {
    console.error('List products error:', err);
    return res.status(500).json({ error: 'Failed to load products.' });
  }
}

export async function getProductByIdOrSlug(req: Request, res: Response) {
  try {
    const param = String(req.params.idOrSlug || '').trim();
    const numericId = Number(param);

    const product = await Models.Product.findFirst({
      where: Number.isInteger(numericId) && numericId > 0 ? { id: numericId } : { slug: param },
      include: {
        category: true,
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    return res.json({ product: serializeProduct(product) });
  } catch (err) {
    console.error('Get product error:', err);
    return res.status(500).json({ error: 'Failed to load product.' });
  }
}

export async function createProductReview(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Sign in required to leave a review.' });
    }
    const productId = Number(req.params.id);
    const rating = Number(req.body?.rating);
    const title = String(req.body?.title || '').trim();
    const comment = String(req.body?.comment || '').trim();

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ error: 'Invalid product ID.' });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }
    if (comment.length < 4) {
      return res.status(400).json({ error: 'Review comment must be at least 4 characters.' });
    }

    const product = await Models.Product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.review.upsert({
        where: { userId_productId: { userId: req.user!.userId, productId } },
        update: { rating, title, comment },
        create: { userId: req.user!.userId, productId, rating, title, comment },
      });

      const stats = await tx.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.product.update({
        where: { id: productId },
        data: {
          rating: Number((stats._avg.rating || rating).toFixed(1)),
          reviewCount: stats._count.rating,
        },
      });
    });

    const updated = await Models.Product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    return res.status(201).json({ product: updated ? serializeProduct(updated) : null });
  } catch (err) {
    console.error('Create review error:', err);
    return res.status(500).json({ error: 'Failed to submit review.' });
  }
}
