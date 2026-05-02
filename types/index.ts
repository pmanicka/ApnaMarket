// ─── ApnaMarket — TypeScript Data Models ───────────────────────────────────
// Mirrors the Supabase schema defined in the PRD Section 7

export type ContactPreference = 'phone' | 'whatsapp' | 'in_app';
export type Category = 'food' | 'clothes' | 'tuition' | 'services' | 'groceries' | 'handmade';
export type PriceType = 'fixed' | 'starting_from' | 'on_inspection';
export type TuitionMode = 'home' | 'online' | 'both';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';
export type FoodUnit = 'per_plate' | 'per_box' | 'per_kg' | 'per_litre' | 'per_piece';

// ─── Users ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  mobile: string;
  name: string;
  block: string;
  flat_number: string;
  profile_photo_url: string | null;
  is_seller: boolean;
  is_admin: boolean;
  is_approved: boolean;
  community_id: string;
  created_at: string;
}

// ─── Communities ──────────────────────────────────────────────────────────────
export interface Community {
  id: string;
  name: string;
  city: string;
  is_active: boolean;
  created_at: string;
}

// ─── Listings ─────────────────────────────────────────────────────────────────
export interface Listing {
  id: string;
  seller_id: string;
  community_id: string;
  category: Category;
  title: string;
  description: string;
  primary_photo_url: string | null;
  is_available: boolean;
  contact_preference: ContactPreference;
  delivery_available: boolean;
  delivery_charge: number | null;
  created_at: string;
  updated_at: string;
  // Joined fields (not in DB, populated by queries)
  seller?: User;
  photos?: { photo_url: string; sort_order: number }[];
  food_items?: FoodItem[];
  food_menu_settings?: FoodMenuSettings;
  cloth_items?: ClothItem[];
  tuition_details?: TuitionDetails;
  service_details?: ServiceDetails;
  grocery_items?: GroceryItem[];
  reviews?: Review[];
}

// ─── Listing Photos ────────────────────────────────────────────────────────────
export interface ListingPhoto {
  id: string;
  listing_id: string;
  photo_url: string;
  sort_order: number;
}

// ─── Food Items ─────────────────────────────────────────────────────────────
export interface FoodItem {
  id: string;
  listing_id: string;
  item_name: string;
  description: string | null;
  price: number;
  unit: FoodUnit;
  min_order: number;
  is_veg: boolean;
  photo_url: string | null;
}

export interface FoodMenuSettings {
  listing_id: string;
  pre_order_required: boolean;
  order_by_time: string | null;  // ISO time string
  available_days: string[];       // ['mon', 'tue', ...]
}

// ─── Clothes ──────────────────────────────────────────────────────────────────
export interface ClothItem {
  id: string;
  listing_id: string;
  item_name: string;
  material: string | null;
  sort_order: number;
  photos?: ClothItemPhoto[];
  variants?: ClothVariant[];
}

export interface ClothItemPhoto {
  id: string;
  cloth_item_id: string;
  photo_url: string;
  sort_order: number;
}

export interface ClothVariant {
  id: string;
  cloth_item_id: string;
  size: string;
  price: number;
  stock_count: number;
}

// ─── Tuition Details ──────────────────────────────────────────────────────────
export interface TuitionDetails {
  listing_id: string;
  subjects: string[];
  grades: string[];
  board: string;
  fee_per_month: number;
  max_students: number;
  mode: TuitionMode;
  experience: string;
  batch_timings: string[];
}

// ─── Service Details ──────────────────────────────────────────────────────────
export interface ServiceDetails {
  listing_id: string;
  service_type: string;
  starting_price: number;
  price_type: PriceType;
  availability: string;
  experience: string;
}

// ─── Groceries ────────────────────────────────────────────────────────────────
export interface GroceryItem {
  id: string;
  listing_id: string;
  item_name: string;
  description: string | null;
  price_per_unit: number;
  unit_type: string;
  min_order_qty: number;
  step_qty: number;
}

// ─── Orders (Phase 2) ─────────────────────────────────────────────────────────
export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  items_json: Record<string, unknown>;
  total_amount: number;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  created_at: string;
}

// ─── Reviews (Phase 2) ────────────────────────────────────────────────────────
export interface Review {
  id: string;
  order_id?: string;
  listing_id?: string;
  reviewer_id: string;
  seller_id: string;
  rating: number;   // 1–5
  comment: string;
  created_at: string;
  reviewer?: User;
}

// ─── Auth Context ─────────────────────────────────────────────────────────────
export interface AuthState {
  user: User | null;
  session: import('@supabase/supabase-js').Session | null;
  isLoading: boolean;
}
