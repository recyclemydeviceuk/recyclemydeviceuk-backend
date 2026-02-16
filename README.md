# RecycleMyDevice Backend

A comprehensive RESTful API backend for the RecycleMyDevice platform - the UK's trusted phone recycling comparison service.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Routes](#api-routes)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Development](#development)

## 🎯 Overview

RecycleMyDevice Backend provides a complete API solution for managing device recycling operations, connecting customers with approved recycler partners, and facilitating device pricing, orders, and reviews.

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + Session-based auth
- **File Storage**: AWS S3
- **Email Service**: AWS SES
- **Image Processing**: Sharp
- **Logging**: Winston
- **Security**: Helmet, express-mongo-sanitize, express-rate-limit
- **Validation**: express-validator

## ✨ Features

### Multi-Role System
- **Admin Panel**: Complete platform management
- **Recycler Portal**: Partner management and pricing configuration
- **Customer API**: Device browsing, price comparison, and ordering

### Core Functionality
- Dynamic device catalog with brands, categories, and specifications
- Storage and condition options (fully dynamic per device)
- Real-time price comparison across approved recyclers
- Secure order management and tracking
- Review and rating system
- Newsletter subscription management
- Contact form submissions
- FAQ management
- Image upload and optimization

### Security Features
- JWT token authentication
- Session management for admin and recycler portals
- Password hashing with bcryptjs
- Rate limiting on API endpoints
- Request sanitization
- CORS configuration
- Helmet security headers

## 🚀 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- AWS Account (for S3 and SES)

### Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd recyclemydevice/backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create a `.env` file in the root directory (see [Environment Variables](#environment-variables))

4. **Seed the database** (optional)
```bash
npm run seed:all
```

5. **Start the development server**
```bash
npm run dev
```

The server will start on `http://localhost:5000`

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=your_mongodb_connection_string

# JWT Secrets
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Session Secret
SESSION_SECRET=your_session_secret_key

# AWS Configuration
AWS_REGION=your_aws_region
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET_NAME=your_s3_bucket_name

# AWS SES (Email)
AWS_SES_FROM_EMAIL=noreply@yourdomain.com
AWS_SES_REGION=your_ses_region

# Admin Credentials (Initial Setup)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure_admin_password

# CORS
FRONTEND_URL=http://localhost:5173
ADMIN_FRONTEND_URL=http://localhost:5174
RECYCLER_FRONTEND_URL=http://localhost:5175

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🛣️ API Routes

### Public Routes

#### Customer API (`/api/customer`)
- `GET /devices` - Get all devices with filters
- `GET /devices/:id` - Get device by ID
- `GET /brands` - Get all brands
- `GET /pricing/device/:deviceId` - Get device pricing from recyclers
- `POST /orders` - Create new order
- `POST /contact` - Submit contact form
- `POST /newsletter/subscribe` - Subscribe to newsletter

#### Authentication (`/api/auth`)
- `POST /admin/login` - Admin login
- `POST /admin/logout` - Admin logout
- `POST /recycler/send-otp` - Send OTP to recycler
- `POST /recycler/verify-otp` - Verify OTP and login
- `POST /recycler/logout` - Recycler logout

### Protected Routes (Admin)

#### Admin API (`/api/admin`)
- `GET /dashboard/stats` - Dashboard statistics
- `GET /devices` - Manage devices
- `POST /devices` - Create device
- `PUT /devices/:id` - Update device
- `DELETE /devices/:id` - Delete device
- `GET /brands` - Manage brands
- `GET /recyclers` - Manage recycler applications
- `PUT /recyclers/:id/status` - Approve/reject recycler
- `GET /orders` - View all orders
- `GET /reviews` - Manage reviews
- `GET /contacts` - View contact submissions
- `GET /newsletter` - Newsletter subscribers
- `POST /utilities/clear-cache` - Clear cache

### Protected Routes (Recycler)

#### Recycler API (`/api/recycler`)
- `GET /dashboard/stats` - Recycler dashboard stats
- `GET /profile` - Get recycler profile
- `PUT /profile` - Update profile
- `GET /devices` - Get all available devices
- `GET /device-config` - Get device configuration
- `POST /device-config/batch-save` - Save device pricing (batch)
- `GET /orders` - Get recycler orders
- `PUT /orders/:id/status` - Update order status
- `GET /reviews` - Get recycler reviews

## 📁 Project Structure

```
backend/
├── server.js                 # Entry point
├── src/
│   ├── app.js               # Express app configuration
│   ├── config/              # Configuration files
│   │   ├── database.js      # MongoDB config
│   │   ├── aws.js          # AWS S3/SES config
│   │   └── cloudinary.js   # Cloudinary config (if used)
│   ├── controllers/         # Request handlers
│   │   ├── admin/          # Admin controllers
│   │   ├── auth/           # Authentication controllers
│   │   ├── customer/       # Customer controllers
│   │   └── recycler/       # Recycler controllers
│   ├── middlewares/         # Custom middleware
│   │   ├── auth.js         # Authentication middleware
│   │   ├── errorHandler.js # Error handling
│   │   ├── upload.js       # File upload
│   │   └── validation.js   # Request validation
│   ├── models/              # Mongoose schemas
│   │   ├── Admin.js
│   │   ├── Device.js
│   │   ├── Brand.js
│   │   ├── Recycler.js
│   │   ├── RecyclerDevicePricing.js
│   │   ├── Order.js
│   │   ├── Review.js
│   │   └── ...
│   ├── routes/              # API routes
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── customer/
│   │   ├── recycler/
│   │   └── index.js        # Route aggregator
│   ├── services/            # Business logic
│   ├── utils/               # Utility functions
│   │   ├── logger.js       # Winston logger
│   │   ├── generateOTP.js  # OTP generation
│   │   └── constants.js    # Constants
│   ├── seeders/             # Database seeders
│   └── scripts/             # Utility scripts
├── logs/                    # Application logs
├── .env                     # Environment variables (not in git)
├── .gitignore
├── package.json
└── README.md
```

## 📜 Scripts

### Development
```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
```

### Database Management
```bash
npm run seed:all         # Run all seeders
npm run seed:devices     # Seed devices only
npm run seed:recyclers   # Seed recyclers only
npm run seed:pricing     # Seed pricing data
npm run seed:faqs        # Seed FAQs
npm run cleanup          # Clean database
npm run reset-db         # Clean and reseed database
```

### Testing
```bash
npm test            # Run tests (to be implemented)
```

## 👨‍💻 Development

### Adding a New Route

1. Create controller in `src/controllers/[role]/`
2. Create route file in `src/routes/[role]/`
3. Register route in `src/routes/index.js`
4. Add middleware if needed

### Adding a New Model

1. Create schema in `src/models/`
2. Define indexes and virtuals
3. Add any pre/post hooks
4. Export model

### Code Standards

- Use async/await for asynchronous operations
- Always use try-catch blocks
- Log errors with Winston logger
- Validate requests with express-validator
- Use HTTP status constants
- Return consistent response format:
  ```json
  {
    "success": true/false,
    "message": "Response message",
    "data": {}
  }
  ```

### Dynamic Storage & Condition Options

The platform supports fully dynamic storage and condition options:
- Each device has its own `storageOptions` and `conditionOptions` arrays
- Admin manages these through device creation/editing
- Frontend automatically renders available options
- Recycler pricing tables adapt to device-specific options
- No hardcoded values anywhere in the system

## 🔒 Security Considerations

- Never commit `.env` file
- Always use environment variables for sensitive data
- Implement rate limiting on all public endpoints
- Sanitize all user inputs
- Use HTTPS in production
- Keep dependencies updated
- Review and rotate JWT secrets regularly
- Implement proper CORS policies

## 📝 License

ISC

## 👥 Support

For support and questions, contact the development team.

---

**Note**: This is backend API documentation. Make sure to configure all environment variables before running the application. Never expose sensitive credentials in public repositories.
