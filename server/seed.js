import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcryptjs';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false } : false,
});

async function seed() {
  console.log('🌱 Seeding database...');
  const client = await pool.connect();

  try {
    // ── Clear tables in safe order ─────────────────────────────
    await client.query(`
      TRUNCATE reviews, cart_items, wishlist, orders, addresses,
               notifications, coupons, products, categories, users
      RESTART IDENTITY CASCADE
    `);
    console.log('✅ Tables cleared');

    // ── Admin & Demo users ─────────────────────────────────────
    const adminHash = await bcrypt.hash('admin123', 12);
    const demoHash  = await bcrypt.hash('demo123',  12);

    await client.query(`
      INSERT INTO users (name, email, password, role) VALUES
        ('HalfRobo Admin', 'admin@halfrobo.com', $1, 'admin'),
        ('Priyanshu Suman', 'demo@halfrobo.com', $2, 'user')
    `, [adminHash, demoHash]);
    console.log('✅ Users seeded');

    // ── Categories ─────────────────────────────────────────────
    const cats = await client.query(`
      INSERT INTO categories (name, slug, description) VALUES
        ('AI Robots',           'ai-robots',           'Intelligent autonomous robotic systems'),
        ('Drones & UAV',        'drones-uav',          'Autonomous aerial vehicles and drone systems'),
        ('Smart Home',          'smart-home',          'Connected smart home automation devices'),
        ('Security Systems',    'security-systems',    'AI-powered surveillance and security'),
        ('Industrial Robotics', 'industrial-robotics', 'Heavy-duty industrial automation'),
        ('AI Assistants',       'ai-assistants',       'Voice-controlled AI assistant devices'),
        ('IoT Sensors',         'iot-sensors',         'Smart sensors and monitoring devices'),
        ('Automation Kits',     'automation-kits',     'DIY automation and robotics kits')
      RETURNING id, slug
    `);
    const catMap = {};
    cats.rows.forEach(r => { catMap[r.slug] = r.id; });
    console.log('✅ Categories seeded:', Object.keys(catMap).length);

    // ── Products ───────────────────────────────────────────────
    const products = [
      { name: 'NeuroBot X1', slug: 'neurobot-x1', price: 2499, discount_price: 2199, stock: 45, sku: 'HR-0001', category: 'ai-robots', is_featured: true, description: 'Next-generation AI robot with neural processing core, 360° LiDAR sensors, and advanced machine learning capabilities.', specs: { processor: 'Neural Core i9', ai_engine: 'NeuroNet v5.0', battery: '48-hour lithium polymer', sensors: '360° LiDAR + depth camera', connectivity: 'WiFi 6E, BT 5.3, 5G', weight: '12.5 kg' }, tags: ['robot', 'AI', 'autonomous', 'featured'] },
      { name: 'SkyForce Pro Drone', slug: 'skyforce-pro-drone', price: 1799, discount_price: 1599, stock: 32, sku: 'HR-0002', category: 'drones-uav', is_featured: true, description: 'Professional autonomous drone with 45-min flight time, 8K camera, and AI obstacle avoidance.', specs: { flight_time: '45 minutes', camera: '8K Ultra HD', range: '12 km', speed: '95 km/h', obstacle_avoidance: 'AI-powered 360°', weight: '1.2 kg' }, tags: ['drone', 'UAV', 'aerial', 'camera'] },
      { name: 'SmartHub Infinity', slug: 'smarthub-infinity', price: 399, discount_price: null, stock: 150, sku: 'HR-0003', category: 'smart-home', is_featured: false, description: 'Central smart home controller supporting 500+ devices with AI-powered automation routines.', specs: { protocols: 'WiFi, Zigbee, Z-Wave, Matter', devices: 'Up to 500', voice: 'Alexa, Google, Siri', display: '7" touchscreen' }, tags: ['smart home', 'hub', 'automation'] },
      { name: 'VisionGuard AI Camera', slug: 'visionguard-ai-camera', price: 699, discount_price: 599, stock: 88, sku: 'HR-0004', category: 'security-systems', is_featured: false, description: '4K AI security camera with real-time facial recognition and 30-day cloud storage.', specs: { resolution: '4K Ultra HD', night_vision: '30m infrared', ai_features: 'Face recognition, anomaly detection', storage: '30-day cloud + local SD' }, tags: ['security', 'camera', 'AI', 'surveillance'] },
      { name: 'RoboArm Industrial', slug: 'roboarm-industrial', price: 12999, discount_price: 11499, stock: 8, sku: 'HR-0005', category: 'industrial-robotics', is_featured: true, description: '6-DOF industrial robotic arm with precision control, 15kg payload, and collaborative safety features.', specs: { dof: '6 degrees of freedom', payload: '15 kg', reach: '1.2 m', precision: '±0.02 mm', power: '1.5 kW' }, tags: ['industrial', 'robot arm', 'automation', 'manufacturing'] },
      { name: 'ARIA Voice Assistant', slug: 'aria-voice-assistant', price: 299, discount_price: 249, stock: 200, sku: 'HR-0006', category: 'ai-assistants', is_featured: false, description: 'Smart AI voice assistant with contextual awareness and multi-room audio.', specs: { mic_array: '8-mic far-field', speaker: '360° 10W', response_time: '<100ms', languages: '40+', smart_home: 'Compatible' }, tags: ['voice assistant', 'AI', 'smart speaker'] },
      { name: 'SensorMatrix Kit', slug: 'sensormatrix-kit', price: 199, discount_price: null, stock: 300, sku: 'HR-0007', category: 'iot-sensors', is_featured: false, description: 'Professional IoT sensor bundle — temperature, humidity, motion, air quality, and more.', specs: { sensors: '12 types included', connectivity: 'WiFi + LoRaWAN', battery: '2-year cell life', range: '2 km LoRa' }, tags: ['IoT', 'sensors', 'monitoring', 'kit'] },
      { name: 'AutomationPro Suite', slug: 'automationpro-suite', price: 899, discount_price: 799, stock: 65, sku: 'HR-0008', category: 'automation-kits', is_featured: false, description: 'Complete DIY automation starter kit with 50+ components and step-by-step AI-guided tutorials.', specs: { components: '50+ pieces', controller: 'Arduino + Raspberry Pi', tutorials: '100+ projects', difficulty: 'Beginner to Advanced' }, tags: ['DIY', 'automation', 'kit', 'robotics'] },
      { name: 'NanoBot Scout', slug: 'nanobot-scout', price: 1299, discount_price: 1099, stock: 55, sku: 'HR-0009', category: 'ai-robots', is_featured: false, description: 'Compact exploration robot with mapping capabilities and remote control via smartphone.', specs: { size: '15 x 12 x 8 cm', speed: '1.5 m/s', mapping: 'SLAM algorithm', camera: '1080p FPV', battery: '3 hours' }, tags: ['mini robot', 'scout', 'exploration'] },
      { name: 'SmartLock Quantum', slug: 'smartlock-quantum', price: 349, discount_price: null, stock: 120, sku: 'HR-0010', category: 'security-systems', is_featured: false, description: 'Biometric smart lock with fingerprint, face ID, and PIN — military-grade encryption.', specs: { biometrics: 'Fingerprint + Face ID', encryption: 'AES-256', battery: '1 year', users: 'Up to 100' }, tags: ['smart lock', 'security', 'biometric'] },
      { name: 'DroneSwarm Coordinator', slug: 'droneswarm-coordinator', price: 4999, discount_price: 4499, stock: 12, sku: 'HR-0011', category: 'drones-uav', is_featured: true, description: 'Advanced multi-drone coordination system — control up to 50 drones simultaneously for shows or surveying.', specs: { swarm_size: 'Up to 50 drones', range: '5 km', choreography: 'AI-powered', latency: '<10ms' }, tags: ['drone swarm', 'coordination', 'professional'] },
      { name: 'HealthBot Companion', slug: 'healthbot-companion', price: 3499, discount_price: 2999, stock: 25, sku: 'HR-0012', category: 'ai-robots', is_featured: false, description: 'Personal health monitoring AI robot — tracks vitals, reminds medications, and provides first-aid guidance.', specs: { vitals: 'HR, SpO2, BP, temp', ai_diagnosis: 'Symptom assessment', display: '5" touchscreen', battery: '24 hours' }, tags: ['health', 'medical robot', 'companion'] },
      { name: 'SmartGrid Controller', slug: 'smartgrid-controller', price: 599, discount_price: null, stock: 75, sku: 'HR-0013', category: 'smart-home', is_featured: false, description: 'Intelligent energy management controller that optimizes home power consumption with AI.', specs: { circuits: '16 channels', savings: 'Up to 40% energy', monitoring: 'Real-time kWh', solar: 'Solar compatible' }, tags: ['energy', 'smart grid', 'home automation'] },
      { name: 'VisionPro Analytics', slug: 'visionpro-analytics', price: 1999, discount_price: 1799, stock: 40, sku: 'HR-0014', category: 'security-systems', is_featured: false, description: 'AI-powered video analytics platform that detects anomalies, counts people, and tracks assets.', specs: { cameras: 'Up to 32', analytics: 'Object detection, counting, heatmaps', storage: '10TB NAS', cloud: 'Hybrid' }, tags: ['video analytics', 'AI', 'enterprise'] },
      { name: 'RoboChef Elite', slug: 'robochef-elite', price: 5999, discount_price: 5499, stock: 15, sku: 'HR-0015', category: 'ai-robots', is_featured: true, description: 'Fully autonomous kitchen robot that can prepare 100+ recipes — the future of home cooking.', specs: { recipes: '100+ built-in', hands: 'Dual 6-DOF arms', speed: 'Full meal in 15 min', cleaning: 'Self-cleaning' }, tags: ['kitchen robot', 'cooking', 'autonomous'] },
      { name: 'CleanBot Ultra', slug: 'cleanbot-ultra', price: 1499, discount_price: 1299, stock: 90, sku: 'HR-0016', category: 'ai-robots', is_featured: false, description: 'Next-gen AI cleaning robot with 3D mapping, UV sterilization, and multi-surface adaptability.', specs: { mapping: '3D LiDAR', suction: '4500 Pa', uv: 'Built-in UV sterilizer', battery: '180 min', coverage: '200 sqm/charge' }, tags: ['cleaning robot', 'UV', 'autonomous'] },
    ];

    for (const p of products) {
      await client.query(`
        INSERT INTO products
          (name, slug, description, price, discount_price, stock, sku,
           category_id, is_featured, is_active, specifications, tags, images)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,$10,$11,'[]')
      `, [
        p.name, p.slug, p.description,
        p.price, p.discount_price || null, p.stock, p.sku,
        catMap[p.category], p.is_featured,
        JSON.stringify(p.specs), JSON.stringify(p.tags),
      ]);
    }
    console.log('✅ Products seeded:', products.length);

    // ── Default coupon ─────────────────────────────────────────
    await client.query(`
      INSERT INTO coupons (code, discount_percent, min_order, max_uses, is_active)
      VALUES ('WELCOME10', 10, 500, 100, true)
      ON CONFLICT (code) DO NOTHING
    `);
    console.log('✅ Coupon seeded: WELCOME10');

    console.log('\n🎉 Database seeded successfully!');
    console.log('   Admin: admin@halfrobo.com / admin123');
    console.log('   User:  demo@halfrobo.com  / demo123');
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(e => { console.error(e); process.exit(1); });
