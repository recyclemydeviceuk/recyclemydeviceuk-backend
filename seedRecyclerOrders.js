// Seed orders for recycler
require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const Device = require('./src/models/Device');
const Recycler = require('./src/models/Recycler');

const seedOrders = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/recyclemydevice');
    console.log('MongoDB Connected');

    // Get the logged-in recycler (from your session)
    const recyclerId = '69925a1101ae790b3eba0498';
    
    // Verify recycler exists
    const recycler = await Recycler.findById(recyclerId);
    if (!recycler) {
      console.log('❌ Recycler not found with ID:', recyclerId);
      process.exit(1);
    }
    console.log('✓ Found recycler:', recycler.companyName);

    // Get some devices
    const devices = await Device.find().limit(5);
    if (devices.length === 0) {
      console.log('❌ No devices found. Please seed devices first.');
      process.exit(1);
    }
    console.log(`✓ Found ${devices.length} devices`);

    // Delete existing orders for this recycler (for testing)
    await Order.deleteMany({ recyclerId });
    console.log('✓ Cleared existing orders for this recycler');

    // Create sample orders
    const sampleOrders = [
      {
        orderNumber: `ORD${Date.now()}A`,
        deviceId: devices[0]._id,
        recyclerId,
        deviceName: devices[0].name,
        recyclerName: recycler.companyName,
        deviceCondition: 'excellent',
        storage: '128GB',
        amount: 450,
        customerName: 'John Smith',
        customerEmail: 'john.smith@example.com',
        customerPhone: '07700 900123',
        address: '123 High Street',
        city: 'London',
        postcode: 'SW1A 1AA',
        status: 'pending',
        paymentStatus: 'pending',
      },
      {
        orderNumber: `ORD${Date.now()}B`,
        deviceId: devices[1]._id,
        recyclerId,
        deviceName: devices[1].name,
        recyclerName: recycler.companyName,
        deviceCondition: 'good',
        storage: '256GB',
        amount: 380,
        customerName: 'Sarah Johnson',
        customerEmail: 'sarah.j@example.com',
        customerPhone: '07700 900456',
        address: '456 Park Lane',
        city: 'Manchester',
        postcode: 'M1 1AA',
        status: 'processing',
        paymentStatus: 'pending',
      },
      {
        orderNumber: `ORD${Date.now()}C`,
        deviceId: devices[2]._id,
        recyclerId,
        deviceName: devices[2].name,
        recyclerName: recycler.companyName,
        deviceCondition: 'fair',
        storage: '64GB',
        amount: 220,
        customerName: 'Michael Brown',
        customerEmail: 'michael.brown@example.com',
        customerPhone: '07700 900789',
        address: '789 Queen Street',
        city: 'Birmingham',
        postcode: 'B1 1AA',
        status: 'completed',
        paymentStatus: 'paid',
        completedAt: new Date(),
        paidAt: new Date(),
      },
      {
        orderNumber: `ORD${Date.now()}D`,
        deviceId: devices[3]._id,
        recyclerId,
        deviceName: devices[3].name,
        recyclerName: recycler.companyName,
        deviceCondition: 'excellent',
        storage: '512GB',
        amount: 650,
        customerName: 'Emily Davis',
        customerEmail: 'emily.davis@example.com',
        customerPhone: '07700 900234',
        address: '234 King Road',
        city: 'Leeds',
        postcode: 'LS1 1AA',
        status: 'pending',
        paymentStatus: 'pending',
      },
      {
        orderNumber: `ORD${Date.now()}E`,
        deviceId: devices[4] ? devices[4]._id : devices[0]._id,
        recyclerId,
        deviceName: devices[4] ? devices[4].name : devices[0].name,
        recyclerName: recycler.companyName,
        deviceCondition: 'good',
        storage: '128GB',
        amount: 320,
        customerName: 'David Wilson',
        customerEmail: 'david.w@example.com',
        customerPhone: '07700 900567',
        address: '567 Main Street',
        city: 'Liverpool',
        postcode: 'L1 1AA',
        status: 'processing',
        paymentStatus: 'pending',
      },
    ];

    // Insert orders
    const createdOrders = await Order.insertMany(sampleOrders);
    console.log(`\n✅ Successfully created ${createdOrders.length} orders!`);
    console.log('\nOrder Summary:');
    createdOrders.forEach(order => {
      console.log(`  - ${order.orderNumber}: ${order.customerName} | ${order.deviceName} | £${order.amount} | ${order.status}`);
    });

    console.log('\n🎉 Seeding complete! Refresh your recycler portal to see the orders.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

seedOrders();
