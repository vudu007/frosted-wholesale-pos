# 🍦 Frosted Wholesale - Enterprise POS & E-Commerce Platform

A comprehensive wholesale ice cream ordering platform with POS system, customer accounts, and flexible payment terms.

![Frosted Wholesale](https://img.shields.io/badge/Status-Production%20Ready-success)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![React](https://img.shields.io/badge/React-18.0-61dafb)
![NestJS](https://img.shields.io/badge/NestJS-10.0-e0234e)

## 🌟 Features

### 🛒 Customer E-Commerce Platform
- **Guest Checkout** - No login required for quick orders
- **Quantity-Based Payment Terms**
  - 1-3 items: Immediate payment required
  - 4-10 items: 1 week credit terms
  - 11+ items: 2 weeks credit terms
- **Customer Accounts** - Registration, login, order history
- **Loyalty Points System** - Earn points on purchases
- **Member Tiers** - STANDARD, SILVER, GOLD, PLATINUM
- **Order Tracking** - Track order status and history
- **Responsive Design** - Mobile, tablet, and desktop optimized

### 💼 Staff POS System
- **Point of Sale** - Fast product ordering interface
- **Inventory Management** - Track stock levels
- **Customer Management** - Search and manage customers
- **Sales Reports** - Comprehensive reporting
- **Shift Management** - Cash shift tracking
- **Multi-User Support** - ADMIN, MANAGER, CASHIER roles

### 🎨 Design
- **Frosted Wholesale Theme** - Purple, coral, and pink color scheme
- **Dark-Themed Cart** - Minimalist POS-style cart drawer
- **Premium Typography** - Playfair Display + Raleway fonts
- **Smooth Animations** - Professional transitions and effects
- **Ice Cream Branding** - Consistent theme throughout

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **Zustand** - State management
- **React Router** - Navigation
- **Axios** - API requests
- **Framer Motion** - Animations
- **React Hot Toast** - Notifications

### Backend
- **NestJS** - Node.js framework
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Passport** - Auth strategies
- **Nodemailer** - Email notifications

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### 1. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/frosted-wholesale.git
cd frosted-wholesale
```

### 2. Backend Setup
```bash
cd backend
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed

# Start backend server
npm run start:dev
```

Backend will run on: `http://localhost:3000`

### 3. Frontend Setup
```bash
cd frontend
npm install

# Start frontend server
npm run dev
```

Frontend will run on: `http://localhost:5173`

## 🔧 Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/frosted_wholesale"
JWT_SECRET="your-secret-key-here"
PORT=3000
```

### Frontend
No environment variables required for local development.

## 📱 Usage

### Customer Website
1. Visit `http://localhost:5173/`
2. Browse products at `/shop`
3. Add items to cart
4. Checkout as guest or create account
5. View order confirmation

### Staff POS
1. Visit `http://localhost:5173/admin/login`
2. Login with credentials:
   - Username: `admin1`
   - Password: `password123`
3. Access POS at `/ordering`
4. Manage inventory, customers, and sales

## 🎯 Key Pages

### Customer Pages
- `/` - Home page
- `/shop` - Product browsing with dark cart
- `/about` - Company information
- `/contact` - Contact form
- `/login` - Customer login
- `/register` - Create account
- `/account` - Customer dashboard
- `/order-confirmation/:id` - Order confirmation

### Staff Pages
- `/admin/login` - Staff login
- `/ordering` - POS interface
- `/admin` - Admin dashboard
- `/inventory` - Inventory management
- `/customers` - Customer management
- `/transactions` - Sales history
- `/reports` - Analytics and reports

## 💳 Payment Terms

Orders automatically apply payment terms based on quantity:

| Items | Payment Terms | Due Date |
|-------|--------------|----------|
| 1-3   | Immediate    | At checkout |
| 4-10  | 1 Week       | 7 days from order |
| 11+   | 2 Weeks      | 14 days from order |

## 🎨 Design System

### Colors
- **Primary Purple:** `#5E35B1`
- **Secondary Coral:** `#FF7E5F`
- **Accent Pink:** `#FFAFBC`
- **Dark Cart:** `#2C3E50`

### Typography
- **Headings:** Playfair Display (serif)
- **Body:** Raleway (sans-serif)

## 📊 Database Schema

### Key Models
- **User** - Staff accounts (ADMIN, MANAGER, CASHIER)
- **Customer** - Customer accounts with loyalty points
- **Product** - Ice cream products
- **Sale** - Orders with payment terms
- **Payment** - Payment records
- **Shift** - Cash shift tracking

## 🔐 Security

- JWT authentication for staff
- Password hashing with bcrypt
- Role-based access control
- Input validation
- SQL injection prevention (Prisma)
- XSS protection

## 📈 Future Enhancements

- [ ] Online payment integration (Stripe/PayPal)
- [ ] Email notifications for orders
- [ ] SMS notifications
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Multi-store support
- [ ] Inventory forecasting
- [ ] Automated reordering

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- **Your Name** - Initial work

## 🙏 Acknowledgments

- Ice cream icon designs
- Tailwind CSS community
- NestJS community
- React community

## 📞 Support

For support, email support@frostedwholesale.com or open an issue on GitHub.

---

**Built with ❤️ for the ice cream wholesale industry** 🍦
