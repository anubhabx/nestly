# Express.js Example API

A production-ready Express.js API built with JavaScript, featuring modular architecture, security best practices, and scalability.

## Features

- 🛡️ **Security First**: Helmet, CORS, rate limiting, XSS protection, input sanitization
- 🔐 **JWT Authentication**: Secure login/register system with refresh tokens
- 👥 **User Management**: CRUD operations with soft deletes and role-based access
- 📦 **Product Catalog**: Full product management with search, filtering, and pagination
- ⚡ **Performance**: Compression, caching headers, optimized queries
- 📝 **Validation**: Express-validator for request validation
- 🚨 **Error Handling**: Global error handler with structured responses
- 📊 **Logging**: Winston logger with multiple transports
- 🔒 **Rate Limiting**: Prevent abuse with configurable rate limits

## Project Structure

```
express-js-app/
├── src/
│   ├── controllers/     # Business logic
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   └── product.controller.js
│   ├── middleware/      # Custom middleware
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── validation.js
│   │   └── rateLimiter.js
│   ├── models/          # Database models
│   │   ├── base.model.js
│   │   ├── user.model.js
│   │   └── product.model.js
│   ├── routes/          # Route definitions
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   └── product.routes.js
│   └── utils/           # Utility functions
│       ├── AppError.js
│       └── logger.js
├── server.js            # Application entry point
├── package.json
└── .env.example
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd examples/express-js-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Update environment variables in `.env`:
```
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3001

JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=1h
JWT_REFRESH_SECRET=your-refresh-token-secret-change-in-production
JWT_REFRESH_EXPIRATION=7d

BCRYPT_ROUNDS=10

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

MONGODB_URI=mongodb://localhost:27017/express-example
```

5. Start the server:
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user (protected)

### Users
- `GET /api/users` - Get all users (protected)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user (protected)
- `DELETE /api/users/:id` - Delete user (protected)
- `GET /api/users/me` - Get current user profile (protected)

### Products
- `GET /api/products` - Get all products (supports search, filter, pagination)
- `GET /api/products/featured` - Get featured products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (protected)
- `PUT /api/products/:id` - Update product (protected)
- `DELETE /api/products/:id` - Delete product (protected)

## Query Parameters

### List Users
```
?search=[query]&page=[number]&limit=[number]&role=[user|admin]
```

### List Products
```
?search=[query]&category=[string]&priceMin=[number]&priceMax=[number]&inStock=[true|false]&page=[number]&limit=[number]&sortBy=[field]&sortOrder=[asc|desc]
```

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:cov
```

Lint code:
```bash
npm run lint
```

## Tech Stack

- **Framework**: Express.js
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: express-validator
- **Security**: helmet, cors, compression, express-rate-limit, xss-clean, mongo-sanitize
- **Logging**: winston
- **Database**: MongoDB (Mongoose)

## License

MIT
