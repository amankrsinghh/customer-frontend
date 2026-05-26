// ============================================================================
// Shared TypeScript types used by BOTH customer-frontend and admin-panel
// ============================================================================

export type Category = string;

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;          // MRP
  discountPrice?: number; // Selling price (optional)
  category: Category;
  sizes: string[];        // e.g. ["S","M","L","XL","Custom"]
  colors: string[];       // e.g. ["Rose Gold","Ivory"]
  stock: number;
  fabric: string;         // e.g. "Pure Silk"
  images: string[];       // image URLs (admin pastes manually)
  createdAt: number;
  featured?: boolean;
}

export interface CartItem {
  productId: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
}

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "In Production"
  | "Shipped"
  | "Delivered"
  | "Cancelled"
  | "Return Requested"
  | "Returned";

export type PaymentStatus = "Pending" | "Paid" | "Refunded" | "Failed";

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentMethod: "COD" | "Razorpay";
  createdAt: number;
  deliveredAt?: number;
}

export interface CustomRequest {
  id: string;
  userId: string;
  customerName: string;
  phone: string;
  email: string;
  inspirationImageUrl: string;
  description: string;
  budget: string;
  occasion: string;
  measurements: {
    bust?: string;
    waist?: string;
    hips?: string;
    height?: string;
    notes?: string;
  };
  status: "New" | "In Review" | "Quoted" | "Accepted" | "Closed";
  createdAt: number;
}

export interface User {
  uid: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  role: "customer" | "admin";
}
