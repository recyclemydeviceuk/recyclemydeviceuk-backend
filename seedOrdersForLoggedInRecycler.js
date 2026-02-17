// Seed orders for recycler - accepts email as argument
// Usage: node seedOrdersForLoggedInRecycler.js <email>
require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const Device = require('./src/models/Device');
const Recycler = require('./src/models/Recycler');

const seedOrdersForRecycler = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/recyclemydevice');
    console.log('✅ MongoDB Connected\n');

    // Get email from command line arguments
    const email = process.argv[2];
    
    if (!email) {
      console.log('❌ Please provide an email address');
      console.log('Usage: node seedOrdersForLoggedInRecycler.js <email>');
      console.log('Example: node seedOrdersForLoggedInRecycler.js aiagents22@gmail.com\n');
      process.exit(1);
    }

    // Find recycler by email (case insensitive)
    const recycler = await Recycler.findOne({ 
      email: { $regex: new RegExp('^' + email + '$', 'i') } 
    });
    
    if (!recycler) {
      console.log('❌ Recycler not found with email:', email);
      console.log('Available recyclers:');
      const allRecyclers = await Recycler.find({}, 'email companyName').limit(10);
      allRecyclers.forEach(r => {
        console.log(`  - ${r.email} (${r.companyName})`);
      });
      process.exit(1);
    }
    
    const recyclerId = recycler._id.toString();
    console.log('✅ Found recycler:');
    console.log('   Company:', recycler.companyName);
    console.log('   Email:', recycler.email);
    console.log('   MongoDB ID:', recyclerId);
    console.log('   Partner ID: RP-' + recyclerId.slice(-4).toUpperCase());
    console.log();

    // Get devices
    const devices = await Device.find().limit(5);
    if (devices.length === 0) {
      console.log('❌ No devices found. Please seed devices first.');
      process.exit(1);
    }
    console.log(`✅ Found ${devices.length} devices\n`);

    // Delete existing orders for this recycler
    const deleteResult = await Order.deleteMany({ recyclerId });
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing orders for this recycler\n`);

    // Create sample orders with different statuses for dashboard variety
    const sampleOrders = [
      {
        orderNumber: `ORD-${Date.now().toString(36).toUpperCase().slice(-6)}-01`,
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
        orderNumber: `ORD-${Date.now().toString(36).toUpperCase().slice(-6)}-02`,
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
        orderNumber: `ORD-${Date.now().toString(36).toUpperCase().slice(-6)}-03`,
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
        orderNumber: `ORD-${Date.now().toString(36).toUpperCase().slice(-6)}-04`,
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
        orderNumber: `ORD-${Date.now().toString(36).toUpperCase().slice(-6)}-05`,
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
    
    console.log('✅ Successfully created', createdOrders.length, 'orders!\n');
    console.log('Order Summary:');
    console.log('================');
    
    // Count by status
    const pending = createdOrders.filter(o => o.status === 'pending').length;
    const processing = createdOrders.filter(o => o.status === 'processing').length;
    const completed = createdOrders.filter(o => o.status === 'completed').length;
    const totalRevenue = createdOrders
      .filter(o => o.status === 'completed' && o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.amount, 0);
    
    createdOrders.forEach(order => {
      console.log(`  📦 ${order.orderNumber}`);
      console.log(`     Customer: ${order.customerName}`);
      console.log(`     Device: ${order.deviceName}`);
      console.log(`     Amount: £${order.amount}`);
      console.log(`     Status: ${order.status.toUpperCase()}`);
      console.log(`     Payment: ${order.paymentStatus.toUpperCase()}`);
      console.log();
    });
    
    console.log('================');
    console.log('Dashboard Stats Preview:');
    console.log(`  Total Orders: ${createdOrders.length}`);
    console.log(`  Pending: ${pending}`);
    console.log(`  Processing: ${processing}`);
    console.log(`  Completed: ${completed}`);
    console.log(`  Total Revenue: £${totalRevenue}`);
    console.log();
    console.log('🎉 Seeding complete! Refresh your recycler portal to see the orders.');
    console.log('   The orders should now appear in:');
    console.log('   - Dashboard (Key Metrics + Recent Orders)');
    console.log('   - Orders page (with filters)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

seedOrdersForRecycler();
