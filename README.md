# Food Delivery Platform - Microservices Architecture

A cloud-based food delivery platform built using microservices architecture with Node.js and Docker, deployed on AWS.

---

## 🚀 Project Overview

This project is a prototype of a food delivery platform built using microservices architecture. Each service is containerized using Docker and deployed on AWS. The system follows DevOps best practices with CI/CD pipelines and security measures.

---

## 🏗️ Architecture

<img src="https://github.com/user-attachments/assets/62035c34-b6aa-483e-98c8-0e673defb2a8" width="400" alt="Architecture Diagram">




The platform consists of four main microservices:
 

1. **Authentication Service**: Handles user registration, login, and authorization  
2. **Restaurant Management Service**: Manages restaurant profiles and details  
3. **Menu Service**: Handles food categories and menu items  
4. **Order Service**: Processes customer orders and payments  

---

## 🛠️ Technologies Used

- **Backend**: Node.js, Express.js  
- **Database**: MongoDB  
- **Authentication**: JWT (JSON Web Tokens)  
- **Containerization**: Docker  
- **Cloud Provider**: AWS  
- **CI/CD**: GitHub Actions  
- **Security**: Helmet, Rate Limiting, CORS, DevSecOps practices  
- **Payment Processing**: Stripe API  

---

## ✨ Features

### Authentication Service
- User registration and login  
- Role-based access control (user, restaurant owner, admin)  
- JWT-based authentication  
- Secure password handling  

### Restaurant Management Service
- Restaurant profile management  
- Location-based restaurant search  
- Restaurant status management  
- Featured restaurants listing  

### Menu Service
- Food category management  
- Menu item management with detailed information  
- Item availability control  
- Popular items listing  

### Order Service
- Order creation and tracking  
- Order status updates  
- Payment processing (card and cash on delivery)  
- Order rating and feedback  

---

## 🔧 Setup and Installation

### Prerequisites
- Node.js (v16 or later)  
- Docker and Docker Compose  
- MongoDB account  
- AWS account (for deployment)  
- Stripe account (for payment processing)  

### Local Development

1. Clone the repository:

```bash
git clone https://github.com/yourusername/food-delivery-platform.git
cd food-delivery-platform
```

2. Set up environment variables:  
Create `.env` files in each service directory using the provided `.env.example` templates.

3. Start services individually:

```bash
# Authentication Service
cd food-delivery-auth-service
npm install
npm run dev

# Restaurant Service
cd ../food-delivery-restaurant-service
npm install
npm run dev

# Menu Service
cd ../food-delivery-menu-service
npm install
npm run dev

# Order Service
cd ../food-delivery-order-service
npm install
npm run dev
```

4. Docker Setup:  
Run all services using Docker Compose::

```bash
docker-compose up
```

This will build and start all microservices, creating a connected network.

---

## 📊 API Documentation

### Authentication Service (Port 5000)

- `POST /api/v1/auth/register` - Register a new user  
- `POST /api/v1/auth/login` - Authenticate a user  
- `GET /api/v1/auth/me` - Get current user  
- `GET /api/v1/auth/logout` - Logout user  

### Restaurant Service (Port 5002)

- `GET /api/v1/restaurants` - Get all restaurants  
- `GET /api/v1/restaurants/:id` - Get single restaurant  
- `POST /api/v1/restaurants` - Create restaurant (restaurant owners)  
- `PUT /api/v1/restaurants/:id` - Update restaurant (owners)  
- `DELETE /api/v1/restaurants/:id` - Delete restaurant (owners)  
- `GET /api/v1/restaurants/user` - Get current user's restaurant  
- `GET /api/v1/restaurants/featured` - Get featured restaurants  
- `GET /api/v1/restaurants/nearby` - Find nearby restaurants  

### Menu Service (Port 5001)

- `GET /api/v1/categories` - Get all food categories  
- `POST /api/v1/categories` - Create category (restaurant owners)  
- `GET /api/v1/menu-items` - Get all menu items  
- `GET /api/v1/menu-items/:id` - Get single menu item  
- `POST /api/v1/categories/:categoryId/menu-items` - Add item to category  
- `PUT /api/v1/menu-items/:id` - Update menu item  
- `DELETE /api/v1/menu-items/:id` - Delete menu item  
- `GET /api/v1/menu-items/popular` - Get popular items  

### Order Service (Port 5003)

- `POST /api/v1/orders` - Create a new order  
- `GET /api/v1/orders/user` - Get user's orders  
- `GET /api/v1/orders/:id` - Get order details  
- `PATCH /api/v1/orders/:id/status` - Update order status  
- `POST /api/v1/payments/create-payment-intent` - Create payment intent  
- `PATCH /api/v1/payments/cash/:orderId` - Set cash payment  

---

## 🔒 Security Considerations

Thi project implements several security measures:

- **Authentication & Authorization**: JWT-based auth with role-based access control  
- **Data Protection**: Secure password hashing with bcrypt  
- **API Security**: Helmet for HTTP headers, rate limiting to prevent abuse  
- **DevSecOps**: Integration with security scanning tools (SonarCloud/Snyk)  
- **CORS**: Configured to restrict cross-origin requests  
- **Least Privilege**: IAM roles and security groups in AWS follow principle of least privilege  

---

## 🚢 Deployment

The platform is deployed on AWS using containerized services:

- **Container Registry**: Amazon ECR for storing Docker images  
- **Container Orchestration**: Amazon ECS for running containers  
- **Load Balancing**: Application Load Balancer for distributing traffic  
- **Networking**: VPC configuration with public and private subnets  
- **CI/CD**: GitHub Actions for automated testing and deployment  

---

## 🧪 Testing

Each service includes API tests that can be run using Postman.  
Import the Postman collection from the `postman` directory to test the endpoints.

---

## 👥 Team Members

- **Member 1** - Saranga Siriwardhana 
- **Member 2** - Eshan Imesh
- **Member 3** - Umesh Dewasinghe
- **Member 4** - Kavindi fernando
