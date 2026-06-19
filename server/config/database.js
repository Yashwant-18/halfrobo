import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

// ─── Connection Pool ──────────────────────────────────────────
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected DB pool error:', err.message);
});

// ─── Table Initialization ──────────────────────────────────────
export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        avatar TEXT,
        is_blocked BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        image TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        specifications JSONB DEFAULT '{}',
        price DECIMAL(10,2) NOT NULL,
        discount_price DECIMAL(10,2),
        category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        images JSONB DEFAULT '[]',
        stock INTEGER DEFAULT 0,
        sku VARCHAR(100) UNIQUE,
        gtin VARCHAR(100),
        brand VARCHAR(255),
        synced_to_meta BOOLEAN DEFAULT false,
        publish_date DATE,
        tags JSONB DEFAULT '[]',
        is_featured BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        rating DECIMAL(3,2) DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Add new product columns if they don't exist (for existing DBs)
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='gtin') THEN
          ALTER TABLE products ADD COLUMN gtin VARCHAR(100);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='brand') THEN
          ALTER TABLE products ADD COLUMN brand VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='synced_to_meta') THEN
          ALTER TABLE products ADD COLUMN synced_to_meta BOOLEAN DEFAULT false;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='publish_date') THEN
          ALTER TABLE products ADD COLUMN publish_date DATE;
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS cart_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER DEFAULT 1,
        saved_for_later BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      );

      CREATE TABLE IF NOT EXISTS wishlist (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      );

      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number VARCHAR(20) UNIQUE NOT NULL,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        items JSONB NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        shipping_cost DECIMAL(10,2) DEFAULT 0,
        discount DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        shipping_address JSONB NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        delivery_method VARCHAR(50) DEFAULT 'standard',
        coupon_code VARCHAR(50),
        estimated_delivery DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS coupons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) UNIQUE NOT NULL,
        discount_percent DECIMAL(5,2),
        discount_amount DECIMAL(10,2),
        min_order DECIMAL(10,2) DEFAULT 0,
        max_uses INTEGER,
        used_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS addresses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address_line1 TEXT NOT NULL,
        address_line2 TEXT,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        zip VARCHAR(20) NOT NULL,
        country VARCHAR(100) DEFAULT 'India',
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS site_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS print_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        file_name VARCHAR(500) NOT NULL,
        file_url TEXT NOT NULL,
        file_size BIGINT,
        material VARCHAR(100) DEFAULT 'PLA',
        color VARCHAR(100) DEFAULT 'White',
        quality VARCHAR(100) DEFAULT 'Standard (0.2mm)',
        infill VARCHAR(50) DEFAULT '20%',
        quantity INTEGER DEFAULT 1,
        supports BOOLEAN DEFAULT false,
        special_instructions TEXT,
        phone VARCHAR(30),
        status VARCHAR(50) DEFAULT 'pending',
        admin_note TEXT,
        price_estimate DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Insert default settings if they don't exist
    const defaults = {
      site_name:           'HalfRobo',
      currency:            'INR',
      free_shipping_threshold: '999',
      support_email:       'support@halfrobo.com',
      tax_rate:            '18',
      footer_tagline:      "Where AI meets robotics. Building the intelligent machines that will shape tomorrow's world.",
      footer_address:      'Bengaluru, Karnataka, India',
      footer_phone:        '+91 98765 43210',
      footer_email:        'hello@halfrobo.com',
      footer_copyright:    '© 2025 HalfRobo Technologies Pvt. Ltd. All rights reserved.',
      footer_twitter:      '#',
      footer_instagram:    '#',
      footer_linkedin:     '#',
      footer_youtube:      '#',
      footer_github:       '#',
      footer_map_location: 'Bengaluru, Karnataka, India',
      footer_map_show:     'true',
    };

    for (const [key, value] of Object.entries(defaults)) {
      await client.query(
        `INSERT INTO site_settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO NOTHING`,
        [key, value]
      );
    }

    console.log('✅ PostgreSQL tables ready');

    // ── Auto-seed: users ──────────────────────────────────────
    // bcrypt hash of 'admin123'  (cost 10)
    const adminHash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; // = 'password' placeholder
    // We'll hash properly using bcrypt
    const bcrypt = await import('bcryptjs');
    const adminPasswordHash = await bcrypt.default.hash('admin123', 10);
    const demoPasswordHash  = await bcrypt.default.hash('demo123',  10);

    await client.query(`
      INSERT INTO users (name, email, password, role)
      VALUES
        ('Admin', 'admin@halfrobo.com', $1, 'admin'),
        ('Demo User', 'demo@halfrobo.com', $2, 'user')
      ON CONFLICT (email) DO NOTHING
    `, [adminPasswordHash, demoPasswordHash]);

    // ── Auto-seed: categories ─────────────────────────────────
    await client.query(`
      INSERT INTO categories (name, slug, description) VALUES
        ('AI Robots',          'ai-robots',           'Autonomous AI-powered robots'),
        ('Drones & UAV',       'drones-uav',          'Consumer and professional drones'),
        ('Smart Home',         'smart-home',          'IoT devices for smart homes'),
        ('Security Systems',   'security-systems',    'AI-powered surveillance and security'),
        ('Industrial Robotics','industrial-robotics',  'Heavy-duty automation systems'),
        ('IoT Sensors',        'iot-sensors',         'Sensors and microcontrollers')
      ON CONFLICT (slug) DO NOTHING
    `);

    // ── Auto-seed: sample products ────────────────────────────
    const catRes = await client.query(`SELECT id, slug FROM categories LIMIT 6`);
    const catMap = Object.fromEntries(catRes.rows.map(r => [r.slug, r.id]));

    const sampleProducts = [
      {
        name: 'NeuroBot X1', slug: 'neurobot-x1',
        desc: 'Next-gen autonomous AI robot with real-time obstacle avoidance, voice commands and emotion recognition.',
        price: 89999, discount_price: 74999, stock: 15,
        sku: 'NB-X1-001', is_featured: true, category: 'ai-robots',
        images: JSON.stringify(['/uploads/neurobot.jpg']),
        tags: JSON.stringify(['ai', 'robot', 'autonomous']),
      },
      {
        name: 'SkyForce Drone Pro', slug: 'skyforce-drone-pro',
        desc: '4K gimbal drone with 40-min flight time, GPS auto-return, and obstacle sensing.',
        price: 54999, discount_price: 44999, stock: 28,
        sku: 'SF-DP-002', is_featured: true, category: 'drones-uav',
        images: JSON.stringify(['/uploads/drone.jpg']),
        tags: JSON.stringify(['drone', '4k', 'gps']),
      },
      {
        name: 'SmartHub 360', slug: 'smarthub-360',
        desc: 'Central IoT hub connecting up to 128 smart devices. Works with Alexa, Google Home.',
        price: 12999, discount_price: 9999, stock: 50,
        sku: 'SH-360-003', is_featured: true, category: 'smart-home',
        images: JSON.stringify(['/uploads/smarthub.jpg']),
        tags: JSON.stringify(['iot', 'smart home', 'hub']),
      },
      {
        name: 'Arduino Mega 2560', slug: 'arduino-mega-2560',
        desc: 'The classic microcontroller board for robotics and IoT projects.',
        price: 1499, discount_price: null, stock: 120,
        sku: 'AR-M2560-004', is_featured: false, category: 'iot-sensors',
        images: JSON.stringify([]),
        tags: JSON.stringify(['arduino', 'microcontroller']),
      },
      {
        name: 'Vision Guard AI Camera', slug: 'vision-guard-ai-camera',
        desc: 'AI-powered 4MP security camera with face recognition and night vision.',
        price: 8999, discount_price: 6999, stock: 35,
        sku: 'VG-CAM-005', is_featured: true, category: 'security-systems',
        images: JSON.stringify([]),
        tags: JSON.stringify(['security', 'ai', 'camera']),
      },
      {
        name: 'RoboArm Industrial 6-Axis', slug: 'roboarm-industrial-6axis',
        desc: '6-axis industrial robotic arm with 5kg payload, programmable via ROS.',
        price: 249999, discount_price: 199999, stock: 5,
        sku: 'RA-IND-006', is_featured: false, category: 'industrial-robotics',
        images: JSON.stringify([]),
        tags: JSON.stringify(['industrial', 'arm', 'ros']),
      },
    ];

    for (const p of sampleProducts) {
      const catId = catMap[p.category] || null;
      await client.query(`
        INSERT INTO products
          (name, slug, description, price, discount_price, stock, sku,
           is_featured, is_active, category_id, images, tags)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,$9,$10,$11)
        ON CONFLICT (slug) DO NOTHING
      `, [
        p.name, p.slug, p.desc, p.price, p.discount_price ?? null,
        p.stock, p.sku, p.is_featured, catId, p.images, p.tags,
      ]);
    }

    console.log('✅ Seed data ready (admin + demo users, categories, products)');
  } finally {
    client.release();
  }
}
