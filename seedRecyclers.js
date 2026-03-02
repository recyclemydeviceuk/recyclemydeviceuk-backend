// Seed recyclers and link them to existing devices with pricing
// Usage: node seedRecyclers.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Recycler = require('./src/models/Recycler');
const RecyclerDevicePricing = require('./src/models/RecyclerDevicePricing');
const RecyclerPreferences = require('./src/models/RecyclerPreferences');
const Device = require('./src/models/Device');

const recyclerData = [
  {
    name: 'James Carter',
    email: 'james@techrecyclehub.co.uk',
    password: 'Password123!',
    phone: '07700 100001',
    companyName: 'TechRecycle Hub',
    website: 'https://techrecyclehub.co.uk',
    businessDescription: 'Leading UK recycler specialising in Apple and Samsung devices with fast same-day valuations.',
    address: '10 Innovation Street',
    city: 'London',
    postcode: 'EC1A 1BB',
    usps: ['Free Royal Mail collection', 'Same day payment', 'Best prices guaranteed'],
    status: 'approved',
    bankDetails: {
      accountName: 'TechRecycle Hub Ltd',
      accountNumber: '12345678',
      sortCode: '20-00-01',
      bankName: 'Barclays',
    },
  },
  {
    name: 'Priya Sharma',
    email: 'priya@greengadgets.co.uk',
    password: 'Password123!',
    phone: '07700 100002',
    companyName: 'Green Gadgets',
    website: 'https://greengadgets.co.uk',
    businessDescription: 'Eco-friendly device recycler committed to zero landfill. We refurbish and resell wherever possible.',
    address: '45 Eco Park Road',
    city: 'Manchester',
    postcode: 'M2 3AB',
    usps: ['Carbon neutral shipping', 'Eco certificate issued', 'Competitive prices'],
    status: 'approved',
    bankDetails: {
      accountName: 'Green Gadgets Ltd',
      accountNumber: '87654321',
      sortCode: '30-00-02',
      bankName: 'NatWest',
    },
  },
  {
    name: 'Oliver Bennett',
    email: 'oliver@phoneswap.co.uk',
    password: 'Password123!',
    phone: '07700 100003',
    companyName: 'PhoneSwap UK',
    website: 'https://phoneswap.co.uk',
    businessDescription: 'Volume recycler buying iPhones and Samsung Galaxy devices in bulk. Nationwide collection available.',
    address: '88 Commerce Way',
    city: 'Birmingham',
    postcode: 'B3 2HT',
    usps: ['Bulk discounts available', 'Next-day bank transfer', 'Nationwide collection'],
    status: 'approved',
    bankDetails: {
      accountName: 'PhoneSwap UK Ltd',
      accountNumber: '11223344',
      sortCode: '40-00-03',
      bankName: 'HSBC',
    },
  },
];

// Pricing multipliers per recycler (relative competitiveness)
const pricingMultipliers = [1.05, 0.95, 1.0];

// Base prices for devices by series (rough market values in GBP)
const getBasePrice = (deviceName, storage) => {
  const storageMultiplier = {
    '64GB': 0.85,
    '128GB': 1.0,
    '256GB': 1.15,
    '512GB': 1.3,
    '1TB': 1.5,
  };

  const mult = storageMultiplier[storage] || 1.0;
  const name = deviceName.toLowerCase();

  // iPhone pricing
  if (name.includes('iphone 17 pro max')) return Math.round(900 * mult);
  if (name.includes('iphone 17 pro')) return Math.round(820 * mult);
  if (name.includes('iphone 17')) return Math.round(700 * mult);
  if (name.includes('iphone 16 pro max')) return Math.round(800 * mult);
  if (name.includes('iphone 16 pro')) return Math.round(730 * mult);
  if (name.includes('iphone 16 plus')) return Math.round(650 * mult);
  if (name.includes('iphone 16')) return Math.round(600 * mult);
  if (name.includes('iphone 15 pro max')) return Math.round(700 * mult);
  if (name.includes('iphone 15 pro')) return Math.round(630 * mult);
  if (name.includes('iphone 15 plus')) return Math.round(560 * mult);
  if (name.includes('iphone 15')) return Math.round(500 * mult);
  if (name.includes('iphone 14 pro max')) return Math.round(580 * mult);
  if (name.includes('iphone 14 pro')) return Math.round(520 * mult);
  if (name.includes('iphone 14 plus')) return Math.round(460 * mult);
  if (name.includes('iphone 14')) return Math.round(420 * mult);
  if (name.includes('iphone 13 pro max')) return Math.round(460 * mult);
  if (name.includes('iphone 13 pro')) return Math.round(400 * mult);
  if (name.includes('iphone 13 mini')) return Math.round(320 * mult);
  if (name.includes('iphone 13')) return Math.round(360 * mult);
  if (name.includes('iphone 12 pro max')) return Math.round(320 * mult);
  if (name.includes('iphone 12 pro')) return Math.round(280 * mult);
  if (name.includes('iphone 12 mini')) return Math.round(220 * mult);
  if (name.includes('iphone 12')) return Math.round(260 * mult);
  if (name.includes('iphone 11 pro max')) return Math.round(220 * mult);
  if (name.includes('iphone 11 pro')) return Math.round(200 * mult);
  if (name.includes('iphone 11')) return Math.round(180 * mult);

  // Samsung pricing
  if (name.includes('s25 edge')) return Math.round(700 * mult);
  if (name.includes('s25')) return Math.round(650 * mult);
  if (name.includes('s24 ultra')) return Math.round(620 * mult);
  if (name.includes('s24 plus')) return Math.round(520 * mult);
  if (name.includes('s24 fe')) return Math.round(380 * mult);
  if (name.includes('s24')) return Math.round(460 * mult);
  if (name.includes('s23 ultra')) return Math.round(540 * mult);
  if (name.includes('s23 plus')) return Math.round(440 * mult);
  if (name.includes('s23 fe')) return Math.round(320 * mult);
  if (name.includes('s22 ultra')) return Math.round(460 * mult);
  if (name.includes('s22 plus')) return Math.round(360 * mult);
  if (name.includes('s22')) return Math.round(300 * mult);
  if (name.includes('s21 ultra')) return Math.round(380 * mult);
  if (name.includes('s21 fe')) return Math.round(220 * mult);
  if (name.includes('s21 plus')) return Math.round(280 * mult);
  if (name.includes('s21 5g') || name.includes('s21')) return Math.round(240 * mult);
  if (name.includes('s20 ultra')) return Math.round(260 * mult);
  if (name.includes('s20')) return Math.round(200 * mult);
  if (name.includes('z fold 6')) return Math.round(820 * mult);
  if (name.includes('z fold 5')) return Math.round(700 * mult);
  if (name.includes('z fold 4')) return Math.round(580 * mult);
  if (name.includes('z flip 6')) return Math.round(580 * mult);
  if (name.includes('z flip 5')) return Math.round(480 * mult);
  if (name.includes('z flip 4')) return Math.round(380 * mult);
  if (name.includes('note 20 ultra')) return Math.round(320 * mult);
  if (name.includes('note 20')) return Math.round(260 * mult);

  return Math.round(200 * mult);
};

const conditions = ['Like New', 'Good', 'Fair', 'Poor', 'Faulty'];
const conditionMultipliers = {
  'Like New': 1.0,
  'Good': 0.82,
  'Fair': 0.65,
  'Poor': 0.45,
  'Faulty': 0.25,
};

const storageOptions = ['64GB', '128GB', '256GB', '512GB', '1TB'];

const seedRecyclers = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/recyclemydevice');
    console.log('Connected to MongoDB\n');

    // Fetch all active devices
    const devices = await Device.find({ status: 'active' });
    if (devices.length === 0) {
      console.log('No devices found. Please run seedDevices.js first.');
      process.exit(1);
    }
    console.log(`Found ${devices.length} active devices\n`);

    const createdRecyclers = [];

    for (let i = 0; i < recyclerData.length; i++) {
      const data = recyclerData[i];

      // Check if recycler already exists
      const existing = await Recycler.findOne({ email: data.email });
      if (existing) {
        console.log(`⚠️  Recycler already exists: ${data.email} — skipping creation, will update pricing`);
        createdRecyclers.push({ recycler: existing, multiplier: pricingMultipliers[i] });
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const recycler = await Recycler.create({
        ...data,
        password: hashedPassword,
        approvedAt: new Date(),
        lastLogin: new Date(),
        businessHours: {
          monday: { open: '09:00', close: '17:30' },
          tuesday: { open: '09:00', close: '17:30' },
          wednesday: { open: '09:00', close: '17:30' },
          thursday: { open: '09:00', close: '17:30' },
          friday: { open: '09:00', close: '17:00' },
          saturday: { open: '10:00', close: '14:00' },
          sunday: { open: null, close: null },
        },
      });

      console.log(`✅ Created recycler: ${recycler.companyName} (${recycler.email})`);
      createdRecyclers.push({ recycler, multiplier: pricingMultipliers[i] });
    }

    console.log('');

    // For each recycler, create preferences and device pricing
    for (const { recycler, multiplier } of createdRecyclers) {
      const recyclerId = recycler._id;

      // Upsert RecyclerPreferences
      await RecyclerPreferences.findOneAndUpdate(
        { recyclerId },
        {
          recyclerId,
          enabledStorage: new Map(storageOptions.map(s => [s, true])),
          enabledConditions: new Map(conditions.map(c => [c, true])),
          enabledNetworks: new Map([['Unlocked', true], ['EE', true], ['Vodafone', true], ['O2', true]]),
          selectedDevices: devices.map(d => d._id),
        },
        { upsert: true, new: true }
      );

      // Build pricing for each device
      let pricingCreated = 0;
      let pricingUpdated = 0;

      for (const device of devices) {
        const storagePricing = storageOptions.map(storage => {
          const basePrice = getBasePrice(device.name, storage);
          const conditionsMap = {};
          for (const condition of conditions) {
            const rawPrice = Math.round(basePrice * conditionMultipliers[condition] * multiplier);
            conditionsMap[condition.toLowerCase()] = Math.max(rawPrice, 5); // lowercase key to match controller's condition.toLowerCase() lookup
          }
          return {
            storage,
            network: 'Unlocked',
            conditions: conditionsMap,
          };
        });

        const existing = await RecyclerDevicePricing.findOne({ recyclerId, deviceId: device._id });

        if (existing) {
          existing.storagePricing = storagePricing;
          existing.isActive = true;
          await existing.save();
          pricingUpdated++;
        } else {
          await RecyclerDevicePricing.create({
            recyclerId,
            deviceId: device._id,
            storagePricing,
            isActive: true,
          });
          pricingCreated++;
        }
      }

      console.log(`📱 ${recycler.companyName}:`);
      console.log(`   Preferences set for ${devices.length} devices`);
      console.log(`   Pricing: ${pricingCreated} created, ${pricingUpdated} updated`);
    }

    console.log('\n=== Summary ===');
    console.log(`Recyclers processed: ${createdRecyclers.length}`);
    for (const { recycler } of createdRecyclers) {
      console.log(`  - ${recycler.companyName} | ${recycler.email} | Status: ${recycler.status}`);
    }
    console.log(`\nDevices linked per recycler: ${devices.length}`);
    console.log('\n✅ Recycler seeding completed successfully!');
    console.log('\nLogin credentials (password is same for all):');
    recyclerData.forEach(r => {
      console.log(`  Email: ${r.email}  |  Password: ${r.password}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding recyclers:', error);
    process.exit(1);
  }
};

seedRecyclers();
