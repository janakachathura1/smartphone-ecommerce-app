import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export const searchSuggestions = async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json({ success: true, data: { products: [], brands: [], categories: [] } });

  const [products, brands, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { shortDesc: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true, name: true, slug: true, finalPrice: true, discountPercent: true,
        brand: { select: { name: true } },
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
      take: 6,
      orderBy: { soldCount: 'desc' },
    }),
    prisma.brand.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
      select: { id: true, name: true, slug: true, logo: true },
      take: 3,
    }),
    prisma.category.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
      select: { id: true, name: true, slug: true },
      take: 3,
    }),
  ]);

  res.json({ success: true, data: { products, brands, categories } });
};

export const getProducts = async (req, res) => {
  const {
    page = 1, limit = 12, search = '', brand, category,
    minPrice, maxPrice, ram, storage, battery, has5G,
    os, isFeatured, isNewArrival, isBestSeller, inStock,
    sortBy = 'createdAt', order = 'desc',
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = { isActive: true };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { shortDesc: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (brand) where.brand = { slug: brand };
  if (category) where.category = { slug: category };
  if (minPrice || maxPrice) {
    where.finalPrice = {};
    if (minPrice) where.finalPrice.gte = parseFloat(minPrice);
    if (maxPrice) where.finalPrice.lte = parseFloat(maxPrice);
  }
  if (ram) where.ram = { contains: ram, mode: 'insensitive' };
  if (storage) where.storage = { contains: storage, mode: 'insensitive' };
  if (battery) where.battery = { contains: battery, mode: 'insensitive' };
  if (has5G !== undefined) where.has5G = has5G === 'true';
  if (os) where.os = { contains: os, mode: 'insensitive' };
  if (isFeatured === 'true') where.isFeatured = true;
  if (isNewArrival === 'true') where.isNewArrival = true;
  if (isBestSeller === 'true') where.isBestSeller = true;
  if (inStock === 'true') where.stock = { gt: 0 };

  const validSortFields = { price: 'finalPrice', newest: 'createdAt', rating: 'rating', sales: 'soldCount', name: 'name' };
  const orderByField = validSortFields[sortBy] || 'createdAt';

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { [orderByField]: order === 'asc' ? 'asc' : 'desc' },
      include: {
        brand: { select: { id: true, name: true, slug: true, logo: true } },
        category: { select: { id: true, name: true, slug: true } },
        images: { where: { isPrimary: true }, take: 1 },
        variants: true,
      },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
};

export const getProductBySlug = async (req, res) => {
  const { slug } = req.params;
  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { slug: slug },
        { id: slug },
      ],
      isActive: true,
    },
    include: {
      brand: { select: { id: true, name: true, slug: true, logo: true } },
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { sortOrder: 'asc' } },
      variants: { orderBy: [{ color: 'asc' }, { storage: 'asc' }] },
      reviews: {
        where: { isApproved: true },
        include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });
  if (!product) throw new AppError('Product not found.', 404);
  res.json({ success: true, data: { product } });
};

export const getProductById = async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      brand: true,
      category: true,
      images: { orderBy: { sortOrder: 'asc' } },
      variants: { orderBy: [{ color: 'asc' }, { storage: 'asc' }] },
    },
  });
  if (!product) throw new AppError('Product not found.', 404);
  res.json({ success: true, data: { product } });
};

export const getFeaturedProducts = async (req, res) => {
  const products = await prisma.product.findMany({
    where: { isFeatured: true, isActive: true },
    include: {
      brand: { select: { name: true, slug: true } },
      images: { where: { isPrimary: true }, take: 1 },
    },
    take: 8,
    orderBy: { soldCount: 'desc' },
  });
  res.json({ success: true, data: { products } });
};

export const getNewArrivals = async (req, res) => {
  const products = await prisma.product.findMany({
    where: { isNewArrival: true, isActive: true },
    include: {
      brand: { select: { name: true, slug: true } },
      images: { where: { isPrimary: true }, take: 1 },
    },
    take: 8,
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: { products } });
};

export const getBestSellers = async (req, res) => {
  const products = await prisma.product.findMany({
    where: { isBestSeller: true, isActive: true },
    include: {
      brand: { select: { name: true, slug: true } },
      images: { where: { isPrimary: true }, take: 1 },
    },
    take: 8,
    orderBy: { soldCount: 'desc' },
  });
  res.json({ success: true, data: { products } });
};

export const createProduct = async (req, res) => {
  const { images = [], variants = [], ...data } = req.body;

  if (data.basePrice && data.discountPercent !== undefined) {
    data.finalPrice = parseFloat(data.basePrice) * (1 - parseFloat(data.discountPercent) / 100);
  }

  // Parse new fields
  if (data.installmentPrice !== undefined && data.installmentPrice !== null) {
    data.installmentPrice = parseFloat(data.installmentPrice) || null;
  }
  if (data.nfc !== undefined) {
    data.nfc = data.nfc === true || data.nfc === 'true';
  }
  if (data.storePickup !== undefined) {
    data.storePickup = data.storePickup === true || data.storePickup === 'true';
  }
  if (data.deliveryFree !== undefined) {
    data.deliveryFree = data.deliveryFree === true || data.deliveryFree === 'true';
  }

  // Calculate total stock if variants provided
  if (variants && variants.length > 0) {
    data.stock = variants.reduce((acc, v) => acc + (parseInt(v.stock) || 0), 0);
  }

  const product = await prisma.product.create({
    data: {
      ...data,
      images: {
        create: images.map((url, i) => ({
          url,
          alt: `${data.name} image ${i + 1}`,
          isPrimary: i === 0,
          sortOrder: i,
        })),
      },
      ...(variants.length > 0 && {
        variants: {
          create: variants.map((v) => ({
            color: v.color,
            storage: v.storage,
            stock: parseInt(v.stock) || 0,
            price: v.price ? parseFloat(v.price) : null,
            sku: v.sku || `${data.sku || 'SKU'}-${(v.color || '').toUpperCase()}-${(v.storage || '').toUpperCase()}`,
          })),
        },
      }),
    },
    include: { images: true, brand: true, category: true, variants: true },
  });
  res.status(201).json({ success: true, data: { product } });
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { images, variants, ...data } = req.body;

  if (data.basePrice && data.discountPercent !== undefined) {
    data.finalPrice = parseFloat(data.basePrice) * (1 - parseFloat(data.discountPercent) / 100);
  }

  // Parse new fields
  if (data.installmentPrice !== undefined && data.installmentPrice !== null) {
    data.installmentPrice = parseFloat(data.installmentPrice) || null;
  }
  if (data.nfc !== undefined) {
    data.nfc = data.nfc === true || data.nfc === 'true';
  }
  if (data.storePickup !== undefined) {
    data.storePickup = data.storePickup === true || data.storePickup === 'true';
  }
  if (data.deliveryFree !== undefined) {
    data.deliveryFree = data.deliveryFree === true || data.deliveryFree === 'true';
  }

  if (images && images.length > 0) {
    data.images = {
      deleteMany: {},
      create: images.map((url, i) => ({
        url,
        alt: `${data.name || 'product'} image ${i + 1}`,
        isPrimary: i === 0,
        sortOrder: i,
      })),
    };
  }

  if (variants) {
    data.stock = variants.reduce((acc, v) => acc + (parseInt(v.stock) || 0), 0);
    data.variants = {
      deleteMany: {},
      create: variants.map((v) => ({
        color: v.color,
        storage: v.storage,
        stock: parseInt(v.stock) || 0,
        price: v.price ? parseFloat(v.price) : null,
        sku: v.sku || undefined,
      })),
    };
  }

  const product = await prisma.product.update({
    where: { id },
    data,
    include: { images: true, brand: true, category: true, variants: true },
  });
  res.json({ success: true, data: { product } });
};

export const deleteProduct = async (req, res) => {
  await prisma.product.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });
  res.json({ success: true, message: 'Product deactivated successfully.' });
};

export const createReview = async (req, res) => {
  const { rating, comment } = req.body;
  const productId = req.params.id;
  const userId = req.user.id;
  
  const review = await prisma.review.create({
    data: {
      rating: Number(rating),
      body: comment || '',
      product: { connect: { id: productId } },
      user: { connect: { id: userId } },
      isApproved: false,
    }
  });

  res.status(201).json({ success: true, data: { review } });
};
