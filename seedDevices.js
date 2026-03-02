const mongoose = require('mongoose');
require('dotenv').config();

const Device = require('./src/models/Device');
const Brand = require('./src/models/Brand');

const devices = [
  {
    "name": "iPhone 11",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772117844351_1dbbb866-d798-4cb9-b72e-ac0cee641d0b-1_07468a90-6063-4acf-86eb-67a5dc9b5a19-595x595.webp"
  },
  {
    "name": "iPhone 11 Pro",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772118034019_57a443a0-5117-4d98-9147-19161f6e99c3-1_e0c0ce88-ff45-475b-9261-210a7cd533c9-595x595.webp"
  },
  {
    "name": "iPhone 11 Pro Max",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772118117540_57a443a0-5117-4d98-9147-19161f6e99c3-1_e0c0ce88-ff45-475b-9261-210a7cd533c9-595x595.webp"
  },
  {
    "name": "iPhone 12",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772118161649_Iphone-12-1.webp"
  },
  {
    "name": "iPhone 12 mini",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772118179995_Iphone-12-1.webp"
  },
  {
    "name": "iPhone 12 Pro",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772118300029_Iphone-12-Pro-Max-1-595x595.webp"
  },
  {
    "name": "iPhone 12 Pro Max",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772118353826_Iphone-12-Pro-Max-1-595x595.webp"
  },
  {
    "name": "iPhone 13",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772118392426_Iphone-13-1-595x595.webp"
  },
  {
    "name": "iPhone 13 mini",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772118431150_Iphone-13-Mini-595x595.webp"
  },
  {
    "name": "iPhone 13 Pro",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772118520495_Iphone-13-Pro-1-595x595.webp"
  },
  {
    "name": "iPhone 13 Pro Max",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772118564611_Iphone-13-Pro-Max-1.webp"
  },
  {
    "name": "iPhone 14",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772118620556_Iphone-14.webp"
  },
  {
    "name": "iPhone 14 Plus",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772118676245_Iphone-14-Plus.webp"
  },
  {
    "name": "iPhone 14 Pro",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772118839466_Iphone-14-pro-595x595.webp"
  },
  {
    "name": "iPhone 14 Pro Max",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772118866290_Iphone-14-pro-595x595.webp"
  },
  {
    "name": "iPhone 15",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772119146312_Iphone-15.webp"
  },
  {
    "name": "iPhone 15 Plus",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772119178979_Iphone-15-Plus.webp"
  },
  {
    "name": "iPhone 15 Pro",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772119248273_Iphone-15-Plus (1).webp"
  },
  {
    "name": "iPhone 15 Pro Max",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772119273100_Iphone-15-Pro-595x595 (1).webp"
  },
  {
    "name": "iPhone 16",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772119388665_iPhone_16_White_PDP_Image_Position_1__ESES_9e413317-97f7-4fec-b67d-61066c3605d2-595x595.webp"
  },
  {
    "name": "iPhone 16 Plus",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772119426232_iPhone_16_White_PDP_Image_Position_1__ESES_9e413317-97f7-4fec-b67d-61066c3605d2-595x595.webp"
  },
  {
    "name": "iPhone 16 Pro",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772119508387_iPhone_16_Pro_Max_Desert_Titanium_PDP_Image_Position_1__en-WW_90917597-6891-414c-91cd-68b6c661bb19-595x595.webp"
  },
  {
    "name": "iPhone 16 Pro Max",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772119550813_iPhone_16_Pro_Max_Desert_Titanium_PDP_Image_Position_1__en-WW_90917597-6891-414c-91cd-68b6c661bb19-595x595.webp"
  },
  {
    "name": "iPhone 17",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772119627084_a0230a04-68dd-4534-aa03-7819d13508bd.webp"
  },
  {
    "name": "iPhone 17 Pro",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772119657556_Apple_iPhone_17_Pro_cosmic_orange-full-product-front-600-1-595x992.webp"
  },
  {
    "name": "iPhone 17 Pro Max",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772119722497_Apple_iPhone_17_Pro_cosmic_orange-full-product-front-600-1-595x992.webp"
  },
  {
    "name": "Samsung Galaxy Note 20",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772119803415_Samsung-Galaxy-Note-20-595x595.webp"
  },
  {
    "name": "Samsung Galaxy Note 20 Ultra",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772119852214_Samsung-Galaxy-Note-20-Ultra-595x595.webp"
  },
  {
    "name": "Samsung Galaxy S20",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772120341134_Samsung-Galaxy-S20-595x595.webp"
  },
  {
    "name": "Samsung Galaxy S20 Ultra",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772120376134_Samsung-Galaxy-S20-Ultra-595x595.webp"
  },
  {
    "name": "Samsung Galaxy S21 5G",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772120439928_Samsung-Galaxy-S21-595x595.webp"
  },
  {
    "name": "Samsung Galaxy S21 FE 5G",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772120486274_Samsung-Galaxy-S21-595x595 (1).webp"
  },
  {
    "name": "Samsung Galaxy S21 Plus",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772120563227_Samsung-Galaxy-S21-1.webp"
  },
  {
    "name": "Samsung Galaxy S21 Ultra",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772122411826_Samsung-Galaxy-S21-Ultra.webp"
  },
  {
    "name": "Samsung Galaxy S22",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772126082214_Samsung-Galaxy-S22.webp"
  },
  {
    "name": "Samsung Galaxy S22 Plus",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772126121745_Samsung-Galaxy-S22-1-595x595.webp"
  },
  {
    "name": "Samsung Galaxy S22 Ultra",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772126162645_Samsung-Galaxy-S22-Ultra.webp"
  },
  {
    "name": "Samsung Galaxy S23 FE",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772126284480_Samsung Galaxy S23 FE.png"
  },
  {
    "name": "Samsung Galaxy S23 Plus",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772126355109_Samsung-Galaxy-S23-1-595x595.webp"
  },
  {
    "name": "Samsung Galaxy S23 Ultra",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772126397081_Samsung-Galaxy-S23-Ultra.webp"
  },
  {
    "name": "Samsung Galaxy S24",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772126487506_s24-595x595.webp"
  },
  {
    "name": "Samsung Galaxy S24 FE",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772126530331_Samsung Galaxy S23 FE.png"
  },
  {
    "name": "Samsung Galaxy S24 Plus",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772126553785_Samsung-Galaxy-S24-1-595x595.webp"
  },
  {
    "name": "Samsung Galaxy S24 Ultra",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772126623845_Samsung-Galaxy-S24-Ultra-595x595.webp"
  },
  {
    "name": "Samsung Galaxy S25",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772126775674_3d14ff49-c95a-4f93-a150-8412d0239222.webp"
  },
  {
    "name": "Samsung Galaxy S25 Edge",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772126823377_30626c7d-5c8b-4d6b-bcfd-95f887f7854d.webp"
  },
  {
    "name": "Samsung Galaxy Z Flip 4",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772126843257_Samsung-Galaxy-Z-Flip4-595x595.webp"
  },
  {
    "name": "Samsung Galaxy Z Flip 5",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772126930125_Samsung-Galaxy-Z-Flip5-595x595.webp"
  },
  {
    "name": "Samsung Galaxy Z Flip 6",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772126977223_Samsung-Galaxy-Z-Flip5-595x595.webp"
  },
  {
    "name": "Samsung Galaxy Z Fold 4",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772127044963_Samsung-Galaxy-Z-Fold4-595x595.webp"
  },
  {
    "name": "Samsung Galaxy Z Fold 5",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772127129963_Samsung-Galaxy-Z-Fold5-595x595.webp"
  },
  {
    "name": "Samsung Galaxy Z Fold 6",
    "imageUrl": "https://zennara-storage.s3.ap-south-1.amazonaws.com/devices/1772127175384_Color_Selection_CraftedBlack_MO.png"
  }
];

const seedDevices = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete all existing devices
    console.log('Deleting all existing devices...');
    const deleteResult = await Device.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} devices`);

    // Find or create Apple brand
    console.log('Finding or creating Apple brand...');
    let appleBrand = await Brand.findOne({ name: 'Apple' });
    if (!appleBrand) {
      appleBrand = await Brand.create({
        name: 'Apple',
        status: 'active',
        order: 1
      });
      console.log('Created Apple brand');
    } else {
      console.log('Apple brand already exists');
    }

    // Find or create Samsung brand
    console.log('Finding or creating Samsung brand...');
    let samsungBrand = await Brand.findOne({ name: 'Samsung' });
    if (!samsungBrand) {
      samsungBrand = await Brand.create({
        name: 'Samsung',
        status: 'active',
        order: 2
      });
      console.log('Created Samsung brand');
    } else {
      console.log('Samsung brand already exists');
    }

    // Prepare devices with brand references
    const devicesToCreate = devices.map(device => {
      const isApple = device.name.startsWith('iPhone');
      const brand = isApple ? appleBrand._id : samsungBrand._id;
      const category = 'smartphone';

      return {
        name: device.name,
        brand: brand,
        category: category,
        image: device.imageUrl,
        images: [device.imageUrl],
        status: 'active',
        storageOptions: ['64GB', '128GB', '256GB', '512GB', '1TB'],
        conditionOptions: ['Excellent', 'Good', 'Fair', 'Poor']
      };
    });

    // Insert devices
    console.log(`Inserting ${devicesToCreate.length} devices...`);
    const insertedDevices = await Device.insertMany(devicesToCreate);
    console.log(`Successfully inserted ${insertedDevices.length} devices`);

    // Summary
    const appleCount = insertedDevices.filter(d => d.name.startsWith('iPhone')).length;
    const samsungCount = insertedDevices.length - appleCount;
    console.log('\n=== Summary ===');
    console.log(`Total devices: ${insertedDevices.length}`);
    console.log(`Apple devices: ${appleCount}`);
    console.log(`Samsung devices: ${samsungCount}`);

    console.log('\n✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDevices();
