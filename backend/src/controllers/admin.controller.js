import { prisma } from '../lib/prisma.js';

export const getDashboardStats = async (req, res) => {
  const [
    totalUsers,
    totalProducts,
    totalOrders,
    revenueData,
    recentOrders,
    lowStockProducts,
    ordersByStatus,
    monthlySales,
    bestSellersData,
    brandSalesData,
    latestReviews,
    criticalLowStockCount,
    pendingRepairsCount,
    activeWarrantyCount,
    pendingTradeInsCount,
    abandonedCartsCount,
    latestUsers,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'user' } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { paymentStatus: 'paid' } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        items: { take: 1 },
      },
    }),
    prisma.product.findMany({
      where: { stock: { lte: 10 }, isActive: true },
      select: { id: true, name: true, stock: true, sku: true },
      orderBy: { stock: 'asc' },
      take: 5,
    }),
    prisma.order.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
    // Simple monthly simulation
    prisma.order.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      select: { totalAmount: true, createdAt: true },
    }),
    prisma.orderItem.groupBy({
      by: ['productId', 'productName', 'productImage'],
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
    prisma.orderItem.findMany({
      select: {
        quantity: true,
        product: {
          select: {
            brand: { select: { name: true } },
          },
        },
      },
    }),
    prisma.review.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true } },
        product: { select: { name: true } },
      },
    }),
    prisma.product.count({ where: { stock: { lte: 3 }, isActive: true } }),
    prisma.repairJob.count({ where: { status: { notIn: ['delivered', 'cancelled'] } } }),
    prisma.deviceWarranty.count({ where: { status: 'active' } }),
    prisma.tradeInRequest.count({ where: { status: 'pending' } }),
    prisma.cart.count({
      where: {
        items: { some: {} },
        updatedAt: { lte: new Date(Date.now() - 2 * 60 * 60 * 1000) }
      }
    }),
    prisma.user.findMany({
      take: 5,
      where: { role: 'user' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, firstName: true, lastName: true, createdAt: true },
    }),
  ]);

  const totalRevenue = revenueData._sum.totalAmount || 0;

  // Process Brand Sales Data
  const brandAggregation = {};
  brandSalesData.forEach(item => {
    const brandName = item.product?.brand?.name || 'Unknown';
    if (!brandAggregation[brandName]) {
      brandAggregation[brandName] = 0;
    }
    brandAggregation[brandName] += item.quantity || 0;
  });
  const brandShare = Object.entries(brandAggregation).map(([name, value]) => ({
    name,
    value,
  })).sort((a, b) => b.value - a.value);

  // Process Activity Log
  const activities = [
    ...recentOrders.map(o => ({
      id: `order-${o.id}`,
      type: 'order',
      text: `New order #${o.orderNumber} placed by ${o.user?.firstName || 'Customer'}`,
      time: o.createdAt,
    })),
    ...latestReviews.map(r => ({
      id: `review-${r.id}`,
      type: 'review',
      text: `${r.user?.firstName || 'User'} reviewed "${r.product?.name}" (${r.rating} ★)`,
      time: r.createdAt,
    })),
    ...latestUsers.map(u => ({
      id: `user-${u.id}`,
      type: 'user',
      text: `New user account registered for ${u.firstName} ${u.lastName}`,
      time: u.createdAt,
    })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 7);

  // Best sellers clean mapping
  const bestSellers = bestSellersData.map(item => ({
    id: item.productId,
    name: item.productName,
    image: item.productImage,
    soldCount: item._sum.quantity || 0,
    revenue: item._sum.totalPrice || 0,
  }));

  res.json({
    success: true,
    data: {
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        criticalLowStockCount,
        pendingRepairsCount,
        activeWarrantyCount,
        pendingTradeInsCount,
        abandonedCartsCount,
      },
      widgets: {
        criticalLowStockCount,
        pendingRepairsCount,
        activeWarrantyCount,
        pendingTradeInsCount,
        abandonedCartsCount,
      },
      recentOrders,
      lowStockProducts,
      ordersByStatus,
      monthlySales,
      bestSellers,
      brandShare,
      activities,
    },
  });
};

export const getBrands = async (req, res) => {
  const brands = await prisma.brand.findMany({ orderBy: { name: 'asc' } });
  res.json({ success: true, data: { brands } });
};

export const createBrand = async (req, res) => {
  const brand = await prisma.brand.create({ data: req.body });
  res.status(201).json({ success: true, data: { brand } });
};

export const updateBrand = async (req, res) => {
  const brand = await prisma.brand.update({ where: { id: req.params.id }, data: req.body });
  res.json({ success: true, data: { brand } });
};

export const deleteBrand = async (req, res) => {
  const { id } = req.params;
  const productsCount = await prisma.product.count({ where: { brandId: id } });
  if (productsCount > 0) {
    return res.status(400).json({ 
      success: false, 
      message: `Cannot delete brand with ${productsCount} associated products. Delete or reassign products first.` 
    });
  }
  await prisma.brand.delete({ where: { id } });
  res.json({ success: true, message: 'Brand deleted successfully.' });
};

export const getCategories = async (req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  res.json({ success: true, data: { categories } });
};

export const createCategory = async (req, res) => {
  const category = await prisma.category.create({ data: req.body });
  res.status(201).json({ success: true, data: { category } });
};

export const updateCategory = async (req, res) => {
  const category = await prisma.category.update({ where: { id: req.params.id }, data: req.body });
  res.json({ success: true, data: { category } });
};

export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  const productsCount = await prisma.product.count({ where: { categoryId: id } });
  if (productsCount > 0) {
    return res.status(400).json({ 
      success: false, 
      message: `Cannot delete category with ${productsCount} associated products. Delete or reassign products first.` 
    });
  }
  await prisma.category.delete({ where: { id } });
  res.json({ success: true, message: 'Category deleted successfully.' });
};

export const getReviews = async (req, res) => {
  const reviews = await prisma.review.findMany({
    include: {
      user: { select: { firstName: true, lastName: true, email: true, avatar: true } },
      product: { 
        select: { 
          name: true, 
          slug: true, 
          brandId: true,
          categoryId: true,
          brand: { select: { name: true, slug: true } },
          category: { select: { name: true, slug: true } },
          images: { where: { isPrimary: true }, take: 1 } 
        } 
      }
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: { reviews } });
};

export const updateReview = async (req, res) => {
  const review = await prisma.review.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json({ success: true, data: { review } });
};

export const deleteReview = async (req, res) => {
  await prisma.review.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Review deleted.' });
};

export const getReportData = async (req, res) => {
  const { type, startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  try {
    if (type === 'sales') {
      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          paymentStatus: 'paid',
        },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          coupon: { select: { code: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.json({ success: true, data: orders });
    }

    if (type === 'inventory') {
      const products = await prisma.product.findMany({
        include: {
          brand: { select: { name: true } },
          category: { select: { name: true } },
        },
        orderBy: { stock: 'asc' },
      });
      return res.json({ success: true, data: products });
    }

    if (type === 'brand') {
      const orderItems = await prisma.orderItem.findMany({
        where: {
          order: {
            createdAt: { gte: start, lte: end },
            paymentStatus: 'paid',
          },
        },
        include: {
          product: {
            include: {
              brand: { select: { name: true } },
            },
          },
        },
      });

      const brandSales = {};
      orderItems.forEach(item => {
        const brandName = item.product?.brand?.name || 'Unknown';
        if (!brandSales[brandName]) {
          brandSales[brandName] = { unitsSold: 0, revenue: 0 };
        }
        brandSales[brandName].unitsSold += item.quantity;
        brandSales[brandName].revenue += item.totalPrice;
      });

      const data = Object.entries(brandSales).map(([name, stats]) => ({
        brand: name,
        unitsSold: stats.unitsSold,
        revenue: Math.round(stats.revenue * 100) / 100,
      })).sort((a, b) => b.revenue - a.revenue);

      return res.json({ success: true, data });
    }

    if (type === 'coupon') {
      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          couponId: { not: null },
          paymentStatus: 'paid',
        },
        include: {
          coupon: { select: { code: true, discountType: true, discountValue: true } },
        },
      });

      const couponStats = {};
      orders.forEach(o => {
        const code = o.coupon?.code || 'Unknown';
        if (!couponStats[code]) {
          couponStats[code] = { count: 0, totalDiscounts: 0, totalRevenue: 0 };
        }
        couponStats[code].count += 1;
        couponStats[code].totalDiscounts += o.discountAmount;
        couponStats[code].totalRevenue += o.totalAmount;
      });

      const data = Object.entries(couponStats).map(([code, stats]) => ({
        code,
        uses: stats.count,
        totalDiscount: Math.round(stats.totalDiscounts * 100) / 100,
        totalRevenue: Math.round(stats.totalRevenue * 100) / 100,
      })).sort((a, b) => b.totalRevenue - a.totalRevenue);

      return res.json({ success: true, data });
    }

    if (type === 'customer') {
      const customerOrders = await prisma.order.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          paymentStatus: 'paid',
        },
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        },
      });

      const customerStats = {};
      customerOrders.forEach(o => {
        if (!o.user) return;
        const userId = o.userId;
        const name = `${o.user.firstName} ${o.user.lastName}`;
        const email = o.user.email;
        const phone = o.user.phone || 'N/A';

        if (!customerStats[userId]) {
          customerStats[userId] = { name, email, phone, orderCount: 0, totalSpent: 0 };
        }
        customerStats[userId].orderCount += 1;
        customerStats[userId].totalSpent += o.totalAmount;
      });

      const data = Object.entries(customerStats).map(([userId, stats]) => ({
        userId,
        name: stats.name,
        email: stats.email,
        phone: stats.phone,
        orders: stats.orderCount,
        spent: Math.round(stats.totalSpent * 100) / 100,
      })).sort((a, b) => b.spent - a.spent);

      return res.json({ success: true, data });
    }

    return res.status(400).json({ success: false, message: 'Invalid report type' });
  } catch (error) {
    console.error('Report Generation Error:', error);
    res.status(500).json({ success: false, message: 'Error generating report' });
  }
};

// ----------------------------------------------------
// 1. IMEI & Warranty Management
// ----------------------------------------------------
export const getWarranties = async (req, res) => {
  const { search = '', status, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { imei: { contains: search, mode: 'insensitive' } },
      { serialNo: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
      { customerPhone: { contains: search, mode: 'insensitive' } },
      { productName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [warranties, total] = await Promise.all([
    prisma.deviceWarranty.findMany({
      where,
      include: { claims: { orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.deviceWarranty.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      warranties,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    }
  });
};

export const getWarrantyByImei = async (req, res) => {
  const { imei } = req.params;
  const warranty = await prisma.deviceWarranty.findUnique({
    where: { imei },
    include: { claims: { orderBy: { createdAt: 'desc' } } }
  });
  if (!warranty) {
    return res.status(404).json({ success: false, message: 'No warranty record found for this IMEI / Serial number.' });
  }
  res.json({ success: true, data: { warranty } });
};

export const createWarranty = async (req, res) => {
  const {
    imei, serialNo, productName, productId, orderId,
    customerName, customerPhone, customerEmail,
    warrantyPeriod = '1 Year', warrantyType = 'Company Warranty',
    warrantyProvider, purchaseDate, notes
  } = req.body;

  if (!imei || !productName || !customerName || !customerPhone) {
    return res.status(400).json({ success: false, message: 'IMEI, Product Name, Customer Name, and Phone are required.' });
  }

  const existing = await prisma.deviceWarranty.findUnique({ where: { imei } });
  if (existing) {
    return res.status(400).json({ success: false, message: 'A warranty record with this IMEI already exists.' });
  }

  const pDate = purchaseDate ? new Date(purchaseDate) : new Date();
  
  // Calculate expiration date
  let expiresAt = new Date(pDate);
  if (warrantyPeriod.includes('Month')) {
    const months = parseInt(warrantyPeriod) || 6;
    expiresAt.setMonth(expiresAt.getMonth() + months);
  } else if (warrantyPeriod.includes('Year')) {
    const years = parseInt(warrantyPeriod) || 1;
    expiresAt.setFullYear(expiresAt.getFullYear() + years);
  } else {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  }

  const warranty = await prisma.deviceWarranty.create({
    data: {
      imei: imei.trim(),
      serialNo: serialNo?.trim(),
      productName,
      productId,
      orderId,
      customerName,
      customerPhone,
      customerEmail,
      warrantyPeriod,
      warrantyType,
      warrantyProvider,
      purchaseDate: pDate,
      expiresAt,
      status: expiresAt > new Date() ? 'active' : 'expired',
      notes,
    }
  });

  res.status(201).json({ success: true, data: { warranty } });
};

export const updateWarranty = async (req, res) => {
  const { id } = req.params;
  const warranty = await prisma.deviceWarranty.update({
    where: { id },
    data: req.body,
  });
  res.json({ success: true, data: { warranty } });
};

export const deleteWarranty = async (req, res) => {
  const { id } = req.params;
  await prisma.deviceWarranty.delete({ where: { id } });
  res.json({ success: true, message: 'Warranty record deleted.' });
};

export const createWarrantyClaim = async (req, res) => {
  const { warrantyId, issueDescription, repairCost = 0 } = req.body;
  if (!warrantyId || !issueDescription) {
    return res.status(400).json({ success: false, message: 'Warranty ID and issue description are required.' });
  }

  const claimNumber = `CLM-${Date.now().toString().slice(-6)}`;
  const claim = await prisma.warrantyClaim.create({
    data: {
      warrantyId,
      claimNumber,
      issueDescription,
      repairCost: parseFloat(repairCost || 0),
      status: 'received',
    }
  });

  // Mark warranty status as claimed
  await prisma.deviceWarranty.update({
    where: { id: warrantyId },
    data: { status: 'claimed' }
  });

  res.status(201).json({ success: true, data: { claim } });
};

export const updateWarrantyClaim = async (req, res) => {
  const { id } = req.params;
  const { status, resolutionNotes, repairCost } = req.body;
  const claim = await prisma.warrantyClaim.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(resolutionNotes !== undefined && { resolutionNotes }),
      ...(repairCost !== undefined && { repairCost: parseFloat(repairCost) }),
    }
  });
  res.json({ success: true, data: { claim } });
};

// ----------------------------------------------------
// 2. Order Fulfillment with IMEI & Courier Tracking
// ----------------------------------------------------
export const fulfillOrder = async (req, res) => {
  const { id } = req.params;
  const { courierName, trackingNumber, status = 'shipped', itemImeis = {} } = req.body;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, address: true, user: true }
  });

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  // Update IMEI for order items and automatically create Warranty Records
  for (const item of order.items) {
    const assignedImei = itemImeis[item.id];
    if (assignedImei && assignedImei.trim()) {
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { imei: assignedImei.trim() }
      });

      // Register device warranty automatically
      const existing = await prisma.deviceWarranty.findUnique({ where: { imei: assignedImei.trim() } });
      if (!existing) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        const warrantyPeriod = product?.warrantyPeriod || '1 Year Company Warranty';
        const warrantyType = product?.warrantyType || 'Company Warranty';
        
        let expiresAt = new Date();
        if (warrantyPeriod.includes('Month')) {
          expiresAt.setMonth(expiresAt.getMonth() + (parseInt(warrantyPeriod) || 6));
        } else {
          expiresAt.setFullYear(expiresAt.getFullYear() + (parseInt(warrantyPeriod) || 1));
        }

        await prisma.deviceWarranty.create({
          data: {
            imei: assignedImei.trim(),
            productName: item.productName,
            productId: item.productId,
            orderId: order.id,
            customerName: order.address?.fullName || `${order.user?.firstName} ${order.user?.lastName}`,
            customerPhone: order.address?.phone || order.user?.phone || 'N/A',
            customerEmail: order.user?.email,
            warrantyPeriod,
            warrantyType,
            warrantyProvider: product?.warrantyProvider || 'Authorized Distributor',
            purchaseDate: new Date(),
            expiresAt,
            status: 'active',
            notes: `Auto-registered on Order #${order.orderNumber} fulfillment`,
          }
        }).catch((err) => console.error('Auto warranty creation error:', err));
      }
    }
  }

  // Update order status & courier details
  const updatedOrder = await prisma.order.update({
    where: { id },
    data: {
      status,
      ...(courierName && { courierName }),
      ...(trackingNumber && { trackingNumber }),
      courierStatus: 'Dispatched',
    },
    include: { items: true, address: true, user: true }
  });

  res.json({ success: true, message: 'Order fulfilled and warranty registered.', data: { order: updatedOrder } });
};

// ----------------------------------------------------
// 3. Smartphone Repair & Service Job Tracker
// ----------------------------------------------------
export const getRepairJobs = async (req, res) => {
  const { search = '', status, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { jobNumber: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { deviceModel: { contains: search, mode: 'insensitive' } },
      { imei: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [repairs, total] = await Promise.all([
    prisma.repairJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.repairJob.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      repairs,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    }
  });
};

export const createRepairJob = async (req, res) => {
  const { customerName, phone, email, deviceModel, imei, passcode, issue, estimatedCost = 0, advancePaid = 0, technician, notes } = req.body;
  if (!customerName || !phone || !deviceModel || !issue) {
    return res.status(400).json({ success: false, message: 'Customer Name, Phone, Device Model, and Issue are required.' });
  }

  const jobNumber = `REP-${Date.now().toString().slice(-6)}`;
  const repair = await prisma.repairJob.create({
    data: {
      jobNumber,
      customerName,
      phone,
      email,
      deviceModel,
      imei,
      passcode,
      issue,
      estimatedCost: parseFloat(estimatedCost || 0),
      advancePaid: parseFloat(advancePaid || 0),
      technician,
      notes,
      status: 'received',
    }
  });

  res.status(201).json({ success: true, data: { repair } });
};

export const updateRepairJob = async (req, res) => {
  const { id } = req.params;
  const { status, estimatedCost, advancePaid, technician, notes } = req.body;

  const data = {
    ...(status && { status }),
    ...(estimatedCost !== undefined && { estimatedCost: parseFloat(estimatedCost) }),
    ...(advancePaid !== undefined && { advancePaid: parseFloat(advancePaid) }),
    ...(technician !== undefined && { technician }),
    ...(notes !== undefined && { notes }),
    ...(status === 'delivered' || status === 'ready' ? { completedAt: new Date() } : {}),
  };

  const repair = await prisma.repairJob.update({
    where: { id },
    data,
  });

  res.json({ success: true, data: { repair } });
};

export const deleteRepairJob = async (req, res) => {
  const { id } = req.params;
  await prisma.repairJob.delete({ where: { id } });
  res.json({ success: true, message: 'Repair job deleted.' });
};

// ----------------------------------------------------
// 4. Trade-In / Device Exchange Manager
// ----------------------------------------------------
export const getTradeIns = async (req, res) => {
  const { search = '', status, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { requestCode: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { deviceModel: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [tradeIns, total] = await Promise.all([
    prisma.tradeInRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.tradeInRequest.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      tradeIns,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    }
  });
};

export const createTradeIn = async (req, res) => {
  const { customerName, phone, email, deviceBrand, deviceModel, storage, condition = 'good', batteryHealth, screenCondition, accessories, estimatedValue = 0, notes } = req.body;
  if (!customerName || !phone || !deviceBrand || !deviceModel) {
    return res.status(400).json({ success: false, message: 'Customer Name, Phone, Brand, and Model are required.' });
  }

  const requestCode = `TRD-${Date.now().toString().slice(-6)}`;
  const tradeIn = await prisma.tradeInRequest.create({
    data: {
      requestCode,
      customerName,
      phone,
      email,
      deviceBrand,
      deviceModel,
      storage,
      condition,
      batteryHealth,
      screenCondition,
      accessories,
      estimatedValue: parseFloat(estimatedValue || 0),
      notes,
      status: 'pending',
    }
  });

  res.status(201).json({ success: true, data: { tradeIn } });
};

export const updateTradeIn = async (req, res) => {
  const { id } = req.params;
  const { status, offeredValue, couponCode, notes } = req.body;
  const tradeIn = await prisma.tradeInRequest.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(offeredValue !== undefined && { offeredValue: parseFloat(offeredValue) }),
      ...(couponCode !== undefined && { couponCode }),
      ...(notes !== undefined && { notes }),
    }
  });
  res.json({ success: true, data: { tradeIn } });
};

export const deleteTradeIn = async (req, res) => {
  const { id } = req.params;
  await prisma.tradeInRequest.delete({ where: { id } });
  res.json({ success: true, message: 'Trade-in request deleted.' });
};

// ----------------------------------------------------
// 5. Abandoned Cart Recovery
// ----------------------------------------------------
export const getAbandonedCarts = async (req, res) => {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const carts = await prisma.cart.findMany({
    where: {
      items: { some: {} },
      updatedAt: { lte: twoHoursAgo },
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, finalPrice: true, images: { where: { isPrimary: true }, take: 1 } } }
        }
      }
    },
    orderBy: { updatedAt: 'desc' },
  });

  const formattedCarts = carts.map(cart => {
    const totalValue = cart.items.reduce((sum, item) => sum + (item.product?.finalPrice || 0) * item.quantity, 0);
    return {
      id: cart.id,
      userId: cart.userId,
      user: cart.user,
      items: cart.items,
      itemCount: cart.items.length,
      totalValue,
      updatedAt: cart.updatedAt,
      abandonedHours: Math.round((Date.now() - new Date(cart.updatedAt).getTime()) / (1000 * 60 * 60)),
    };
  });

  res.json({ success: true, data: { carts: formattedCarts, count: formattedCarts.length } });
};


