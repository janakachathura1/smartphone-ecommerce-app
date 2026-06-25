
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean DB
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  // Admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@techpulse.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+8801700000000',
      role: 'admin',
    },
  });

  // Regular user
  const userPassword = await bcrypt.hash('user1234', 12);
  const user = await prisma.user.create({
    data: {
      email: 'john@example.com',
      password: userPassword,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+8801711111111',
      role: 'user',
    },
  });

  console.log('✅ Users created');

  // Brands
  const brandsData = [
    { name: 'Apple', slug: 'apple', logo: 'https://placehold.co/80x80/1a1a1a/ffffff?text=Apple' },
    { name: 'Samsung', slug: 'samsung', logo: 'https://placehold.co/80x80/1428a0/ffffff?text=Samsung' },
    { name: 'Xiaomi', slug: 'xiaomi', logo: 'https://placehold.co/80x80/ff6900/ffffff?text=Xiaomi' },
    { name: 'OnePlus', slug: 'oneplus', logo: 'https://placehold.co/80x80/f5010c/ffffff?text=OnePlus' },
    { name: 'Google', slug: 'google', logo: 'https://placehold.co/80x80/4285f4/ffffff?text=Google' },
    { name: 'Realme', slug: 'realme', logo: 'https://placehold.co/80x80/ffd700/1a1a1a?text=Realme' },
  ];
  const brands = {};
  for (const b of brandsData) {
    brands[b.slug] = await prisma.brand.create({ data: b });
  }

  console.log('✅ Brands created');

  // Categories
  const cat = await prisma.category.create({
    data: { name: 'Smartphones', slug: 'smartphones', description: 'All smartphones' },
  });

  console.log('✅ Categories created');

  // Products
  const products = [
    {
      name: 'Apple iPhone 15 Pro Max',
      slug: 'apple-iphone-15-pro-max',
      description: 'The most powerful iPhone ever with titanium design, A17 Pro chip, and the most advanced camera system.',
      shortDesc: 'Titanium design, A17 Pro chip, 48MP camera',
      brandSlug: 'apple',
      basePrice: 1299,
      discountPercent: 5,
      stock: 45,
      sku: 'APPL-15PM-001',
      isFeatured: true,
      isBestSeller: true,
      os: 'iOS 17',
      ram: '8GB',
      storage: '256GB',
      battery: '4422 mAh',
      display: '6.7" Super Retina XDR OLED',
      processor: 'Apple A17 Pro',
      camera: '48MP + 12MP + 12MP',
      frontCamera: '12MP TrueDepth',
      has5G: true,
      weight: '221g',
      colors: JSON.stringify(['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium']),
      storageOptions: JSON.stringify(['256GB', '512GB', '1TB']),
      images: [
        'https://placehold.co/600x600/1a1a1a/ffffff?text=iPhone+15+Pro+Max',
        'https://placehold.co/600x600/2a2a2a/ffffff?text=iPhone+15+Pro+Max+Back',
        'https://placehold.co/600x600/333333/ffffff?text=iPhone+15+Pro+Max+Side',
      ],
    },
    {
      name: 'Apple iPhone 15',
      slug: 'apple-iphone-15',
      description: 'iPhone 15 features a durable color-infused glass and aluminum design, a 48MP Main camera, and Dynamic Island.',
      shortDesc: 'Dynamic Island, 48MP camera, USB-C',
      brandSlug: 'apple',
      basePrice: 799,
      discountPercent: 8,
      stock: 80,
      sku: 'APPL-15-001',
      isFeatured: true,
      isNewArrival: true,
      os: 'iOS 17',
      ram: '6GB',
      storage: '128GB',
      battery: '3877 mAh',
      display: '6.1" Super Retina XDR OLED',
      processor: 'Apple A16 Bionic',
      camera: '48MP + 12MP',
      frontCamera: '12MP TrueDepth',
      has5G: true,
      weight: '171g',
      colors: JSON.stringify(['Black', 'Yellow', 'Green', 'Pink', 'Blue']),
      storageOptions: JSON.stringify(['128GB', '256GB', '512GB']),
      images: [
        'https://placehold.co/600x600/2c3e50/ffffff?text=iPhone+15',
        'https://placehold.co/600x600/2c3e50/ffffff?text=iPhone+15+Back',
      ],
    },
    {
      name: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung-galaxy-s24-ultra',
      description: 'The ultimate AI smartphone with built-in S Pen, 200MP camera, and Snapdragon 8 Gen 3.',
      shortDesc: 'S Pen included, 200MP camera, AI features',
      brandSlug: 'samsung',
      basePrice: 1299,
      discountPercent: 10,
      stock: 35,
      sku: 'SAMS-S24U-001',
      isFeatured: true,
      isBestSeller: true,
      os: 'Android 14 (One UI 6.1)',
      ram: '12GB',
      storage: '256GB',
      battery: '5000 mAh',
      display: '6.8" Dynamic AMOLED 2X 120Hz',
      processor: 'Snapdragon 8 Gen 3',
      camera: '200MP + 50MP + 12MP + 10MP',
      frontCamera: '12MP',
      has5G: true,
      weight: '232g',
      colors: JSON.stringify(['Titanium Black', 'Titanium Gray', 'Titanium Violet', 'Titanium Yellow']),
      storageOptions: JSON.stringify(['256GB', '512GB', '1TB']),
      images: [
        'https://placehold.co/600x600/1428a0/ffffff?text=S24+Ultra',
        'https://placehold.co/600x600/1428a0/ffffff?text=S24+Ultra+Back',
      ],
    },
    {
      name: 'Samsung Galaxy S24+',
      slug: 'samsung-galaxy-s24-plus',
      description: 'Galaxy AI meets the biggest Galaxy S24 display with all-day battery and stunning performance.',
      shortDesc: '6.7" display, Galaxy AI, 50MP camera',
      brandSlug: 'samsung',
      basePrice: 999,
      discountPercent: 12,
      stock: 50,
      sku: 'SAMS-S24P-001',
      isFeatured: false,
      isNewArrival: true,
      os: 'Android 14 (One UI 6.1)',
      ram: '12GB',
      storage: '256GB',
      battery: '4900 mAh',
      display: '6.7" Dynamic AMOLED 2X 120Hz',
      processor: 'Snapdragon 8 Gen 3',
      camera: '50MP + 10MP + 12MP',
      frontCamera: '12MP',
      has5G: true,
      weight: '196g',
      colors: JSON.stringify(['Cobalt Violet', 'Onyx Black', 'Marble Gray', 'Lime']),
      storageOptions: JSON.stringify(['256GB', '512GB']),
      images: [
        'https://placehold.co/600x600/4a0082/ffffff?text=S24+Plus',
        'https://placehold.co/600x600/4a0082/ffffff?text=S24+Plus+Back',
      ],
    },
    {
      name: 'Xiaomi 14 Ultra',
      slug: 'xiaomi-14-ultra',
      description: 'Co-engineered with Leica, the Xiaomi 14 Ultra redefines mobile photography with a 1-inch sensor.',
      shortDesc: 'Leica 1-inch camera, Snapdragon 8 Gen 3',
      brandSlug: 'xiaomi',
      basePrice: 1099,
      discountPercent: 7,
      stock: 25,
      sku: 'XIAO-14U-001',
      isFeatured: true,
      isNewArrival: true,
      os: 'Android 14 (HyperOS)',
      ram: '16GB',
      storage: '512GB',
      battery: '5000 mAh',
      display: '6.73" LTPO AMOLED 120Hz',
      processor: 'Snapdragon 8 Gen 3',
      camera: '50MP (1-inch) + 50MP + 50MP + 50MP',
      frontCamera: '32MP',
      has5G: true,
      weight: '229.5g',
      colors: JSON.stringify(['Black', 'White', 'Dragon Jade']),
      storageOptions: JSON.stringify(['512GB', '1TB']),
      images: [
        'https://placehold.co/600x600/ff6900/ffffff?text=Xiaomi+14+Ultra',
        'https://placehold.co/600x600/ff6900/ffffff?text=Xiaomi+14+Ultra+Back',
      ],
    },
    {
      name: 'Xiaomi Redmi Note 13 Pro',
      slug: 'xiaomi-redmi-note-13-pro',
      description: 'The Redmi Note 13 Pro delivers flagship-level features at an incredible price with its 200MP camera.',
      shortDesc: '200MP camera, 67W fast charging, AMOLED',
      brandSlug: 'xiaomi',
      basePrice: 349,
      discountPercent: 15,
      stock: 120,
      sku: 'XIAO-RN13P-001',
      isBestSeller: true,
      os: 'Android 13 (MIUI 14)',
      ram: '8GB',
      storage: '256GB',
      battery: '5100 mAh',
      display: '6.67" AMOLED 120Hz',
      processor: 'Snapdragon 7s Gen 2',
      camera: '200MP + 8MP + 2MP',
      frontCamera: '16MP',
      has5G: true,
      weight: '187g',
      colors: JSON.stringify(['Midnight Black', 'Arctic White', 'Ocean Teal']),
      storageOptions: JSON.stringify(['128GB', '256GB']),
      images: [
        'https://placehold.co/600x600/1a1a2e/ffffff?text=Redmi+Note+13+Pro',
        'https://placehold.co/600x600/1a1a2e/ffffff?text=Redmi+Note+13+Pro+Back',
      ],
    },
    {
      name: 'OnePlus 12',
      slug: 'oneplus-12',
      description: 'OnePlus 12 with Hasselblad-tuned cameras, 100W SUPERVOOC charging, and flagship Snapdragon performance.',
      shortDesc: 'Hasselblad camera, 100W charging, 6000mAh',
      brandSlug: 'oneplus',
      basePrice: 799,
      discountPercent: 10,
      stock: 40,
      sku: 'OP-12-001',
      isFeatured: true,
      isBestSeller: true,
      os: 'Android 14 (OxygenOS 14)',
      ram: '12GB',
      storage: '256GB',
      battery: '5400 mAh',
      display: '6.82" LTPO AMOLED 120Hz',
      processor: 'Snapdragon 8 Gen 3',
      camera: '50MP + 48MP + 64MP',
      frontCamera: '32MP',
      has5G: true,
      weight: '220g',
      colors: JSON.stringify(['Silky Black', 'Flowy Emerald']),
      storageOptions: JSON.stringify(['256GB', '512GB']),
      images: [
        'https://placehold.co/600x600/f5010c/ffffff?text=OnePlus+12',
        'https://placehold.co/600x600/f5010c/ffffff?text=OnePlus+12+Back',
      ],
    },
    {
      name: 'Google Pixel 8 Pro',
      slug: 'google-pixel-8-pro',
      description: 'Google Pixel 8 Pro with Google Tensor G3, advanced AI features, and pro-level camera capabilities.',
      shortDesc: 'Google AI, Tensor G3, 50MP pro camera',
      brandSlug: 'google',
      basePrice: 999,
      discountPercent: 8,
      stock: 30,
      sku: 'GOOG-P8P-001',
      isFeatured: true,
      isNewArrival: true,
      os: 'Android 14',
      ram: '12GB',
      storage: '128GB',
      battery: '5050 mAh',
      display: '6.7" LTPO OLED 120Hz',
      processor: 'Google Tensor G3',
      camera: '50MP + 48MP + 48MP',
      frontCamera: '10.5MP',
      has5G: true,
      weight: '213g',
      colors: JSON.stringify(['Obsidian', 'Bay', 'Porcelain', 'Mint']),
      storageOptions: JSON.stringify(['128GB', '256GB', '1TB']),
      images: [
        'https://placehold.co/600x600/4285f4/ffffff?text=Pixel+8+Pro',
        'https://placehold.co/600x600/4285f4/ffffff?text=Pixel+8+Pro+Back',
      ],
    },
    {
      name: 'Samsung Galaxy A55 5G',
      slug: 'samsung-galaxy-a55-5g',
      description: 'Awesome by design — Galaxy A55 5G with stunning AMOLED display and IP67 water resistance.',
      shortDesc: '50MP OIS camera, AMOLED, IP67',
      brandSlug: 'samsung',
      basePrice: 449,
      discountPercent: 20,
      stock: 90,
      sku: 'SAMS-A55-001',
      isBestSeller: true,
      os: 'Android 14 (One UI 6.1)',
      ram: '8GB',
      storage: '128GB',
      battery: '5000 mAh',
      display: '6.6" Super AMOLED 120Hz',
      processor: 'Exynos 1480',
      camera: '50MP + 12MP + 5MP',
      frontCamera: '32MP',
      has5G: true,
      weight: '213g',
      colors: JSON.stringify(['Awesome Navy', 'Awesome Iceblue', 'Awesome Lilac', 'Awesome Lemon']),
      storageOptions: JSON.stringify(['128GB', '256GB']),
      images: [
        'https://placehold.co/600x600/003366/ffffff?text=Galaxy+A55',
        'https://placehold.co/600x600/003366/ffffff?text=Galaxy+A55+Back',
      ],
    },
    {
      name: 'Realme GT 6',
      slug: 'realme-gt-6',
      description: 'Realme GT 6 with Snapdragon 8s Gen 3, 50MP Sony LYT-808 sensor, and blazing 120W charging.',
      shortDesc: '120W charging, Sony camera, Snapdragon 8s Gen 3',
      brandSlug: 'realme',
      basePrice: 599,
      discountPercent: 0,
      stock: 60,
      sku: 'REAL-GT6-001',
      isNewArrival: true,
      os: 'Android 14 (realme UI 5.0)',
      ram: '12GB',
      storage: '256GB',
      battery: '5500 mAh',
      display: '6.78" LTPS AMOLED 120Hz',
      processor: 'Snapdragon 8s Gen 3',
      camera: '50MP + 8MP + 2MP',
      frontCamera: '32MP',
      has5G: true,
      weight: '199g',
      colors: JSON.stringify(['Fluid Silver', 'Razor Green']),
      storageOptions: JSON.stringify(['256GB', '512GB']),
      images: [
        'https://placehold.co/600x600/ffd700/1a1a1a?text=Realme+GT+6',
        'https://placehold.co/600x600/ffd700/1a1a1a?text=Realme+GT+6+Back',
      ],
    },
  ];

  for (const p of products) {
    const finalPrice = p.basePrice * (1 - p.discountPercent / 100);
    const brand = brands[p.brandSlug];
    const { images, brandSlug, ...productData } = p;

    const product = await prisma.product.create({
      data: {
        ...productData,
        finalPrice: Math.round(finalPrice * 100) / 100,
        brandId: brand.id,
        categoryId: cat.id,
        rating: +(Math.random() * 1.5 + 3.5).toFixed(1),
        reviewCount: Math.floor(Math.random() * 200 + 20),
        soldCount: Math.floor(Math.random() * 500 + 50),
      },
    });

    for (let i = 0; i < images.length; i++) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: images[i],
          alt: `${product.name} image ${i + 1}`,
          isPrimary: i === 0,
          sortOrder: i,
        },
      });
    }

    // Reviews for each product
    await prisma.review.create({
      data: {
        productId: product.id,
        userId: user.id,
        rating: 5,
        title: 'Excellent phone!',
        body: `I have been using the ${product.name} for a few weeks now and it is absolutely amazing. The performance is top-notch and the camera quality is outstanding.`,
      },
    });
  }

  console.log('✅ Products and reviews created');

  // Coupons
  await prisma.coupon.createMany({
    data: [
      { code: 'TECH10', discountType: 'percent', discountValue: 10, minOrderValue: 200, maxUses: 500 },
      { code: 'SAVE50', discountType: 'fixed', discountValue: 50, minOrderValue: 500, maxUses: 100 },
      { code: 'NEWUSER15', discountType: 'percent', discountValue: 15, minOrderValue: 100, maxUses: 1000 },
    ],
  });

  console.log('✅ Coupons created');
  console.log('🎉 Database seeded successfully!');
  console.log('\n📧 Admin email: admin@techpulse.com');
  console.log('🔑 Admin password: admin123');
  console.log('📧 User email: john@example.com');
  console.log('🔑 User password: user1234');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
