import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.ts';

const IMG = {
  espresso: '/src/assets/images/product_espresso_machine_1795528777155.jpg',
  chair: '/src/assets/images/product_lounge_chair_1795528777471.jpg',
  headphones: '/src/assets/images/product_wireless_headphones_1795528778708.jpg',
  cookware: '/src/assets/images/product_ceramic_cookware_1795528778734.jpg',
  lamp: '/src/assets/images/product_smart_lamp_1795528779890.jpg',
  purifier: '/src/assets/images/product_air_purifier_1795528779866.jpg',
  bedding: '/src/assets/images/product_linen_bedding_1795528780779.jpg',
  hero: '/src/assets/images/hero_living_room_1795528776734.jpg',
};

export async function seedDatabaseIfEmpty() {
  const categoryCount = await prisma.category.count();
  if (categoryCount > 0) {
    return;
  }

  const categoriesData = [
    {
      name: 'Furniture & Seating',
      slug: 'furniture-seating',
      description: 'Sculptural solid oak seating, coffee tables, and living room silhouettes.',
      image: IMG.chair,
    },
    {
      name: 'Kitchen & Dining',
      slug: 'kitchen-dining',
      description: 'Enameled cast-iron cookware, espresso brewers, and ceramic tableware.',
      image: IMG.cookware,
    },
    {
      name: 'Smart Home & Audio',
      slug: 'smart-home-audio',
      description: 'Acoustic wireless headphones and quiet-motor home electronics.',
      image: IMG.headphones,
    },
    {
      name: 'Architectural Lighting',
      slug: 'architectural-lighting',
      description: 'Warm-dim brass and anodized aluminum desk and floor luminaires.',
      image: IMG.lamp,
    },
    {
      name: 'Bedding & Textiles',
      slug: 'bedding-textiles',
      description: 'Stonewashed Belgian linen throws, duvets, and breathable pillow sets.',
      image: IMG.bedding,
    },
    {
      name: 'Air & Climate',
      slug: 'air-climate',
      description: 'Medical-grade HEPA air purifiers and silent ambient home care.',
      image: IMG.purifier,
    },
  ];

  const categories: Record<string, number> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    categories[cat.slug] = created.id;
  }

  const productsData = [
    {
      name: 'Verona Oak & Sage Bouclé Lounge Chair',
      slug: 'verona-oak-sage-boucle-lounge-chair',
      description:
        'Hand-finished kiln-dried European oak frame paired with heavyweight sage-green bouclé upholstery. Ergonomic 104-degree backrest angle built for reading corners and living spaces.',
      price: 18499,
      mrp: 24999,
      discountPercent: 26,
      stock: 14,
      sku: 'HM-FRN-101',
      images: JSON.stringify([IMG.chair, IMG.hero]),
      rating: 4.8,
      reviewCount: 2,
      soldCount: 142,
      isBestSeller: true,
      isNewArrival: false,
      isFeatured: true,
      categoryId: categories['furniture-seating'],
    },
    {
      name: 'Aura Barista 15-Bar Espresso Machine',
      slug: 'aura-barista-15-bar-espresso-machine',
      description:
        'PID temperature-controlled matte forest-green stainless steel espresso maker with commercial 58mm walnut portafilter, analog pressure gauge, and microfoam steam wand.',
      price: 22999,
      mrp: 29999,
      discountPercent: 23,
      stock: 9,
      sku: 'HM-KIT-204',
      images: JSON.stringify([IMG.espresso, IMG.cookware]),
      rating: 4.9,
      reviewCount: 2,
      soldCount: 218,
      isBestSeller: true,
      isNewArrival: true,
      isFeatured: true,
      categoryId: categories['kitchen-dining'],
    },
    {
      name: 'Kanso ANC Wireless Studio Headphones',
      slug: 'kanso-anc-wireless-studio-headphones',
      description:
        'Adaptive hybrid active noise cancellation up to 42dB with 40mm beryllium-coated drivers, anodized aluminum yokes, memory-foam lambskin earpads, and 45-hour USB-C battery life.',
      price: 8999,
      mrp: 12999,
      discountPercent: 31,
      stock: 28,
      sku: 'HM-AUD-309',
      images: JSON.stringify([IMG.headphones]),
      rating: 4.7,
      reviewCount: 1,
      soldCount: 385,
      isBestSeller: true,
      isNewArrival: false,
      isFeatured: true,
      categoryId: categories['smart-home-audio'],
    },
    {
      name: 'Botanica 5.5L Enameled Cast-Iron Dutch Oven',
      slug: 'botanica-5-5l-enameled-cast-iron-dutch-oven',
      description:
        'Triple-layer vitrified forest-green enamel over heavy-gauge cast iron for even thermal distribution. Includes solid brushed brass lid knob and oven-safe finish up to 260°C.',
      price: 5499,
      mrp: 7499,
      discountPercent: 27,
      stock: 22,
      sku: 'HM-KIT-218',
      images: JSON.stringify([IMG.cookware, IMG.espresso]),
      rating: 4.9,
      reviewCount: 1,
      soldCount: 290,
      isBestSeller: true,
      isNewArrival: false,
      isFeatured: false,
      categoryId: categories['kitchen-dining'],
    },
    {
      name: 'Nordic Brass & Forest Aluminum Task Lamp',
      slug: 'nordic-brass-forest-task-lamp',
      description:
        'Precision-milled dark-green aluminum shade with solid brushed brass articulated joint and weighted base. Stepless 2700K-4000K touch dimmer for eye-comfort desk work.',
      price: 3899,
      mrp: 5299,
      discountPercent: 26,
      stock: 4,
      sku: 'HM-LGT-402',
      images: JSON.stringify([IMG.lamp, IMG.hero]),
      rating: 4.6,
      reviewCount: 1,
      soldCount: 164,
      isBestSeller: false,
      isNewArrival: true,
      isFeatured: true,
      categoryId: categories['architectural-lighting'],
    },
    {
      name: 'Aeria H13 True HEPA Smart Air Purifier',
      slug: 'aeria-h13-true-hepa-smart-air-purifier',
      description:
        '360-degree cylindrical air intake captures 99.97% of PM2.5, allergens, and VOCs across rooms up to 520 sq ft. Whisper-quiet 21dB sleep mode with live laser AQI ring.',
      price: 11499,
      mrp: 15999,
      discountPercent: 28,
      stock: 3,
      sku: 'HM-AIR-501',
      images: JSON.stringify([IMG.purifier]),
      rating: 4.7,
      reviewCount: 1,
      soldCount: 112,
      isBestSeller: false,
      isNewArrival: true,
      isFeatured: false,
      categoryId: categories['air-climate'],
    },
    {
      name: 'Belgian Stonewashed Linen 4-Piece Bedding Set',
      slug: 'belgian-stonewashed-linen-4-piece-bedding-set',
      description:
        'OEKO-TEX certified 175 GSM European flax linen pre-washed for cloud-soft drape. Includes 1 queen duvet cover, 1 fitted sheet, and 2 envelope pillow shams in Sage & Chalk.',
      price: 6299,
      mrp: 8999,
      discountPercent: 30,
      stock: 19,
      sku: 'HM-BED-605',
      images: JSON.stringify([IMG.bedding, IMG.hero]),
      rating: 4.8,
      reviewCount: 1,
      soldCount: 198,
      isBestSeller: true,
      isNewArrival: true,
      isFeatured: false,
      categoryId: categories['bedding-textiles'],
    },
    {
      name: 'Solstice Walnut & Linen 3-Seater Living Sofa',
      slug: 'solstice-walnut-linen-3-seater-sofa',
      description:
        'Deep-cushion architectural sofa upholstered in stain-resistant forest-green performance linen with solid American walnut plinth legs and kiln-dried hardwood joinery.',
      price: 42999,
      mrp: 56999,
      discountPercent: 25,
      stock: 6,
      sku: 'HM-FRN-112',
      images: JSON.stringify([IMG.hero, IMG.chair]),
      rating: 4.9,
      reviewCount: 1,
      soldCount: 74,
      isBestSeller: false,
      isNewArrival: true,
      isFeatured: true,
      categoryId: categories['furniture-seating'],
    },
    {
      name: 'Kanso Pro Studio Over-Ear Acoustic Edition',
      slug: 'kanso-pro-studio-acoustic-edition',
      description:
        'Lossless wired USB-C DAC mode plus aptX Adaptive wireless streaming. Dual-chamber acoustic tuning engineered for home studios and deep focus.',
      price: 12499,
      mrp: 15999,
      discountPercent: 22,
      stock: 15,
      sku: 'HM-AUD-315',
      images: JSON.stringify([IMG.headphones]),
      rating: 4.5,
      reviewCount: 0,
      soldCount: 89,
      isBestSeller: false,
      isNewArrival: true,
      isFeatured: false,
      categoryId: categories['smart-home-audio'],
    },
    {
      name: 'Botanica Stoneware Soup & Pasta Bowls (Set of 4)',
      slug: 'botanica-stoneware-bowls-set-4',
      description:
        'Hand-glazed reactive sage-emerald stoneware bowls fired at 1240°C for chip resistance. Microwave and dishwasher safe.',
      price: 1899,
      mrp: 2499,
      discountPercent: 24,
      stock: 42,
      sku: 'HM-KIT-230',
      images: JSON.stringify([IMG.cookware]),
      rating: 4.6,
      reviewCount: 0,
      soldCount: 254,
      isBestSeller: true,
      isNewArrival: false,
      isFeatured: false,
      categoryId: categories['kitchen-dining'],
    },
  ];

  const createdProducts: Record<string, number> = {};
  for (const p of productsData) {
    const created = await prisma.product.create({ data: p });
    createdProducts[p.slug] = created.id;
  }

  // Coupons
  await prisma.coupon.createMany({
    data: [
      {
        code: 'WELCOME10',
        description: '10% off on orders above ₹999 (up to ₹500)',
        discountPercent: 10,
        minOrderAmount: 999,
        maxDiscount: 500,
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        code: 'HOME20',
        description: '20% off on orders above ₹3,999 (up to ₹1,500)',
        discountPercent: 20,
        minOrderAmount: 3999,
        maxDiscount: 1500,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    ],
  });

  // Seed regular demo customer accounts (non-admin)
  const customerPass = await bcrypt.hash('Customer@123', 10);
  const user1 = await prisma.user.create({
    data: {
      name: 'Aarav Sharma',
      email: 'customer@homemurt.com',
      passwordHash: customerPass,
      phone: '+91 98765 43210',
      role: 'USER',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Priya Nair',
      email: 'priya.nair@homemurt.com',
      passwordHash: customerPass,
      phone: '+91 98201 55412',
      role: 'USER',
    },
  });

  const addr1 = await prisma.address.create({
    data: {
      userId: user1.id,
      fullName: 'Aarav Sharma',
      phone: '+91 98765 43210',
      line1: '402 Emerald Courtyard, Indiranagar 100ft Rd',
      line2: 'Near Metro Station',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560038',
      country: 'India',
      isDefault: true,
    },
  });

  const addr2 = await prisma.address.create({
    data: {
      userId: user2.id,
      fullName: 'Priya Nair',
      phone: '+91 98201 55412',
      line1: '18B Seaface Residency, Bandra West',
      line2: '',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400050',
      country: 'India',
      isDefault: true,
    },
  });

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // Seed historical orders for live tracking & admin analytics graph
  const order1 = await prisma.order.create({
    data: {
      orderCode: 'HM-2026-1001',
      userId: user1.id,
      addressId: addr1.id,
      shippingAddressJson: JSON.stringify(addr1),
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      upiId: 'aarav@okaxis',
      status: 'DELIVERED',
      subtotal: 18499,
      discountAmount: 1500,
      shippingFee: 0,
      totalAmount: 16999,
      couponCode: 'HOME20',
      trackingHistoryJson: JSON.stringify([
        { status: 'PLACED', timestamp: new Date(now - 5 * dayMs).toISOString(), note: 'Order confirmed via UPI' },
        { status: 'PACKED', timestamp: new Date(now - 4 * dayMs).toISOString(), note: 'Packed at Bengaluru hub' },
        { status: 'SHIPPED', timestamp: new Date(now - 3 * dayMs).toISOString(), note: 'Dispatched with BlueDart' },
        { status: 'OUT_FOR_DELIVERY', timestamp: new Date(now - 2 * dayMs).toISOString(), note: 'Out for delivery in Indiranagar' },
        { status: 'DELIVERED', timestamp: new Date(now - 2 * dayMs + 3600000).toISOString(), note: 'Delivered to recipient' },
      ]),
      createdAt: new Date(now - 5 * dayMs),
      items: {
        create: [
          {
            productId: createdProducts['verona-oak-sage-boucle-lounge-chair'],
            productName: 'Verona Oak & Sage Bouclé Lounge Chair',
            productImage: IMG.chair,
            price: 18499,
            mrp: 24999,
            quantity: 1,
          },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      orderCode: 'HM-2026-1002',
      userId: user1.id,
      addressId: addr1.id,
      shippingAddressJson: JSON.stringify(addr1),
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      status: 'SHIPPED',
      subtotal: 5499,
      discountAmount: 500,
      shippingFee: 0,
      totalAmount: 4999,
      couponCode: 'WELCOME10',
      trackingHistoryJson: JSON.stringify([
        { status: 'PLACED', timestamp: new Date(now - 2 * dayMs).toISOString(), note: 'Order placed (Cash on Delivery)' },
        { status: 'PACKED', timestamp: new Date(now - 1.5 * dayMs).toISOString(), note: 'Quality checked & packed' },
        { status: 'SHIPPED', timestamp: new Date(now - 1 * dayMs).toISOString(), note: 'In transit to Bengaluru hub' },
      ]),
      createdAt: new Date(now - 2 * dayMs),
      items: {
        create: [
          {
            productId: createdProducts['botanica-5-5l-enameled-cast-iron-dutch-oven'],
            productName: 'Botanica 5.5L Enameled Cast-Iron Dutch Oven',
            productImage: IMG.cookware,
            price: 5499,
            mrp: 7499,
            quantity: 1,
          },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      orderCode: 'HM-2026-1003',
      userId: user2.id,
      addressId: addr2.id,
      shippingAddressJson: JSON.stringify(addr2),
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      upiId: 'priya@ybl',
      status: 'OUT_FOR_DELIVERY',
      subtotal: 22999,
      discountAmount: 0,
      shippingFee: 0,
      totalAmount: 22999,
      trackingHistoryJson: JSON.stringify([
        { status: 'PLACED', timestamp: new Date(now - 3 * dayMs).toISOString(), note: 'Order placed via UPI' },
        { status: 'PACKED', timestamp: new Date(now - 2 * dayMs).toISOString(), note: 'Packed cleanly' },
        { status: 'SHIPPED', timestamp: new Date(now - 1 * dayMs).toISOString(), note: 'Arrived at Mumbai hub' },
        { status: 'OUT_FOR_DELIVERY', timestamp: new Date(now - 3600000).toISOString(), note: 'Courier on the way' },
      ]),
      createdAt: new Date(now - 3 * dayMs),
      items: {
        create: [
          {
            productId: createdProducts['aura-barista-15-bar-espresso-machine'],
            productName: 'Aura Barista 15-Bar Espresso Machine',
            productImage: IMG.espresso,
            price: 22999,
            mrp: 29999,
            quantity: 1,
          },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      orderCode: 'HM-2026-1004',
      userId: user2.id,
      addressId: addr2.id,
      shippingAddressJson: JSON.stringify(addr2),
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      status: 'PLACED',
      subtotal: 8999,
      discountAmount: 0,
      shippingFee: 0,
      totalAmount: 8999,
      trackingHistoryJson: JSON.stringify([
        { status: 'PLACED', timestamp: new Date(now - 1800000).toISOString(), note: 'Order received' },
      ]),
      createdAt: new Date(now - 1800000),
      items: {
        create: [
          {
            productId: createdProducts['kanso-anc-wireless-studio-headphones'],
            productName: 'Kanso ANC Wireless Studio Headphones',
            productImage: IMG.headphones,
            price: 8999,
            mrp: 12999,
            quantity: 1,
          },
        ],
      },
    },
  });

  // Reviews
  await prisma.review.createMany({
    data: [
      {
        userId: user1.id,
        productId: createdProducts['verona-oak-sage-boucle-lounge-chair'],
        rating: 5,
        title: 'Solid oak joinery and plush fabric',
        comment: 'Looks even better in natural daylight. Zero wobble and the sage bouclé texture elevates our living room.',
      },
      {
        userId: user2.id,
        productId: createdProducts['verona-oak-sage-boucle-lounge-chair'],
        rating: 5,
        title: 'Worth every rupee',
        comment: 'Arrived pre-assembled and well protected. Extremely comfortable for long reading sessions.',
      },
      {
        userId: user1.id,
        productId: createdProducts['aura-barista-15-bar-espresso-machine'],
        rating: 5,
        title: 'Consistent 9-bar extraction',
        comment: 'Heats up in under 90 seconds and pulls rich crema every morning.',
      },
      {
        userId: user2.id,
        productId: createdProducts['aura-barista-15-bar-espresso-machine'],
        rating: 5,
        title: 'Matte green finish is stunning',
        comment: 'Sturdy walnut portafilter and powerful steam wand for lattes.',
      },
      {
        userId: user1.id,
        productId: createdProducts['kanso-anc-wireless-studio-headphones'],
        rating: 5,
        title: 'Crisp soundstage and deep ANC',
        comment: 'Blocks traffic noise completely during work calls.',
      },
      {
        userId: user2.id,
        productId: createdProducts['botanica-5-5l-enameled-cast-iron-dutch-oven'],
        rating: 5,
        title: 'Heirloom quality cookware',
        comment: 'Even heat retention for slow-cooked curries and sourdough bread.',
      },
      {
        userId: user1.id,
        productId: createdProducts['nordic-brass-forest-task-lamp'],
        rating: 5,
        title: 'Warm glare-free light',
        comment: 'Heavy base never tips and the brass hinge stays put.',
      },
      {
        userId: user2.id,
        productId: createdProducts['aeria-h13-true-hepa-smart-air-purifier'],
        rating: 5,
        title: 'Noticeable air quality difference overnight',
        comment: 'Sleep mode is practically silent.',
      },
      {
        userId: user1.id,
        productId: createdProducts['belgian-stonewashed-linen-4-piece-bedding-set'],
        rating: 5,
        title: 'Breathable and soft',
        comment: 'Gets softer after every wash.',
      },
      {
        userId: user2.id,
        productId: createdProducts['solstice-walnut-linen-3-seater-sofa'],
        rating: 5,
        title: 'Centerpiece of our apartment',
        comment: 'Deep seating and rich walnut base.',
      },
    ],
  });

  // Initial wishlist item for Aarav
  await prisma.wishlist.create({
    data: {
      userId: user1.id,
      productId: createdProducts['nordic-brass-forest-task-lamp'],
    },
  });

  // Initial pending return request on order1 so admin Returns tab has real data to review
  await prisma.returnRequest.create({
    data: {
      orderId: order1.id,
      userId: user1.id,
      type: 'REPLACE',
      reason: 'Minor scuff on outer leg packaging',
      comments: 'Requesting replacement cushion cover or leg touch-up kit.',
      status: 'PENDING',
    },
  });
}
