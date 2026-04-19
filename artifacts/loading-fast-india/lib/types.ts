export type UserRole = 'driver' | 'vyapari' | 'admin';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  password?: string;
  aadhaarNumber: string;
  licenseNumber: string;
  licenseExpiry: string;
  rcBookNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notificationRadius: number;
  createdAt: string;
  isVerified: boolean;
  totalTrips: number;
  rating: number;
  pushToken?: string;
  latitude?: number;
  longitude?: number;
  lastLocationAt?: string;
  isBlocked?: boolean;
}

export interface Vyapari {
  id: string;
  name: string;
  businessName: string;
  phone: string;
  email?: string;
  password?: string;
  aadhaarNumber: string;
  gstNumber?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  createdAt: string;
  isVerified: boolean;
  totalBookings: number;
  advancePaid?: boolean;
  advancePaidAt?: string;
  advanceUTR?: string;
  isBlocked?: boolean;
}

export interface Vehicle {
  id: string;
  driverId: string;
  vehicleNumber: string;
  vehicleType: string;
  vehicleTypeName: string;
  model: string;
  year: string;
  maxLoadTons: number;
  rcNumber: string;
  rcExpiry: string;
  insuranceExpiry: string;
  isActive: boolean;
  createdAt: string;
}

export interface Trip {
  id: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  vehicleId: string;
  vehicleNumber: string;
  vehicleType: string;
  vehicleTypeName: string;
  fromCity: string;
  fromState: string;
  toCity: string;
  toState: string;
  loadTons: number;
  rentPerTon: number;
  totalRent: number;
  tripDate: string;
  description: string;
  status: 'available' | 'confirmed' | 'pending_confirmation' | 'completed' | 'cancelled';
  confirmedBy?: string;
  confirmedByName?: string;
  confirmedAt?: string;
  commissionPaid: boolean;
  commissionAmount: number;
  createdAt: string;
  tripStatus?: 'loading' | 'on_the_way' | 'delivered';
  currentLocation?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryOtp?: string;
  deliveryNotes?: string;
  deliveredAt?: string;
  completedAt?: string;
  paymentType?: 'sender' | 'receiver';
  paymentReceived?: boolean;
  paymentReceivedAt?: string;
  receiverName?: string;
  receiverPhone?: string;
  receiverCity?: string;
  receiverAddress?: string;
  receiverGst?: string;
  smsSent?: boolean;
}

export interface Bilty {
  id: string;
  tripId: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  vyapariId: string;
  vyapariName: string;
  vyapariPhone: string;
  vehicleNumber: string;
  vehicleType: string;
  fromCity: string;
  toCity: string;
  loadTons: number;
  totalRent: number;
  commissionAmount: number;
  netRent: number;
  upiRef: string;
  createdAt: string;
  biltyNumber: string;
  goodsCategory?: string;
  goodsType?: string;
  needsColdStorage?: boolean;
  advancePaid?: boolean;
  advanceAmount?: number;
}

export interface Complaint {
  id: string;
  complainantId: string;
  complainantName: string;
  complainantRole: UserRole;
  againstId: string;
  againstName: string;
  againstRole: UserRole;
  tripId?: string;
  bookingId?: string;
  subject: string;
  description: string;
  merchantVerifiedBy?: 'GST & Aadhaar' | 'Aadhaar Only';
  status: 'pending' | 'resolved' | 'escalated';
  createdAt: string;
}

export const VEHICLE_TYPES = [
  // ─── 3-चक्का (3 Wheelers) ───
  { id: 'riksha-3w',       name: '3-चक्का रिक्शा (माल)',    nameEn: 'Goods Rickshaw 3W',      maxLoad: 0.3,  wheels: 3,  category: '3-चक्का' },
  { id: 'carrier-3w',      name: '3-चक्का कैरियर (Ape/RE)', nameEn: '3W Carrier Ape/RE',      maxLoad: 0.75, wheels: 3,  category: '3-चक्का' },
  { id: 'auto-goods',      name: '3-चक्का ऑटो (माल)',       nameEn: 'Auto Goods 3W',          maxLoad: 0.5,  wheels: 3,  category: '3-चक्का' },
  { id: 'tempo-vikram',    name: '3-चक्का टेम्पो/विक्रम',   nameEn: 'Tempo Vikram 3W',        maxLoad: 1.5,  wheels: 3,  category: '3-चक्का' },

  // ─── 4-चक्का (4 Wheelers) ───
  { id: 'bolero-pickup',   name: 'बोलेरो पिकअप (4-चक्का)',  nameEn: 'Bolero Pickup 4W',       maxLoad: 1.5,  wheels: 4,  category: '4-चक्का' },
  { id: 'pickup',          name: 'पिकअप (4-चक्का)',          nameEn: 'Pickup 4W',              maxLoad: 1,    wheels: 4,  category: '4-चक्का' },
  { id: 'mini-truck',      name: 'मिनी ट्रक / छोटा हाथी (4W)', nameEn: 'Mini Truck / Chota Hathi 4W', maxLoad: 3, wheels: 4, category: '4-चक्का' },
  { id: 'tractor-trolley', name: 'ट्रैक्टर-ट्रॉली (4-चक्का)', nameEn: 'Tractor Trolley 4W',   maxLoad: 10,   wheels: 4,  category: '4-चक्का' },

  // ─── 6-चक्का (6 Wheelers / 2-Axle) ───
  { id: 'truck-6w',        name: '6-चक्का ट्रक (2 Axle)',    nameEn: 'Truck 6W 2-Axle',       maxLoad: 9,    wheels: 6,  category: '6-चक्का' },
  { id: 'truck-14',        name: 'ट्रक 14 फिट (6-चक्का)',    nameEn: 'Truck 14ft 6W',         maxLoad: 8,    wheels: 6,  category: '6-चक्का' },
  { id: 'truck-17',        name: 'ट्रक 17 फिट (6-चक्का)',    nameEn: 'Truck 17ft 6W',         maxLoad: 12,   wheels: 6,  category: '6-चक्का' },
  { id: 'tipper-6w',       name: 'टिपर (6-चक्का)',           nameEn: 'Tipper 6W',             maxLoad: 9,    wheels: 6,  category: '6-चक्का' },
  { id: 'flatbed-6w',      name: 'फ्लैटबेड (6-चक्का)',       nameEn: 'Flatbed 6W',            maxLoad: 10,   wheels: 6,  category: '6-चक्का' },
  { id: 'tanker-6w',       name: 'टैंकर (6-चक्का)',          nameEn: 'Tanker 6W',             maxLoad: 10,   wheels: 6,  category: '6-चक्का' },
  { id: 'refrigerated',    name: 'रेफ्रिजेरेटेड ट्रक (6W)',  nameEn: 'Refrigerated Truck 6W', maxLoad: 8,    wheels: 6,  category: '6-चक्का' },

  // ─── 10-चक्का (10 Wheelers / 3-Axle) ───
  { id: 'truck-10w',       name: '10-चक्का ट्रक (3 Axle)',   nameEn: 'Truck 10W 3-Axle',      maxLoad: 16,   wheels: 10, category: '10-चक्का' },
  { id: 'tipper-10w',      name: 'टिपर (10-चक्का)',          nameEn: 'Tipper 10W',            maxLoad: 18,   wheels: 10, category: '10-चक्का' },
  { id: 'tanker-10w',      name: 'टैंकर (10-चक्का)',         nameEn: 'Tanker 10W',            maxLoad: 18,   wheels: 10, category: '10-चक्का' },
  { id: 'container-20',    name: 'कंटेनर 20 फिट (10W)',      nameEn: 'Container 20ft 10W',    maxLoad: 18,   wheels: 10, category: '10-चक्का' },

  // ─── 12-चक्का (12 Wheelers / 4-Axle) ───
  { id: 'truck-12w',       name: '12-चक्का ट्रक (4 Axle)',   nameEn: 'Truck 12W 4-Axle',      maxLoad: 22,   wheels: 12, category: '12-चक्का' },
  { id: 'tipper-12w',      name: 'टिपर (12-चक्का)',          nameEn: 'Tipper 12W',            maxLoad: 20,   wheels: 12, category: '12-चक्का' },
  { id: 'tanker-12w',      name: 'टैंकर (12-चक्का)',         nameEn: 'Tanker 12W',            maxLoad: 20,   wheels: 12, category: '12-चक्का' },

  // ─── 14-चक्का (14 Wheelers / 5-Axle) ───
  { id: 'truck-14w',       name: '14-चक्का ट्रक (5 Axle)',   nameEn: 'Truck 14W 5-Axle',      maxLoad: 28,   wheels: 14, category: '14-चक्का' },
  { id: 'tipper-14w',      name: 'टिपर (14-चक्का)',          nameEn: 'Tipper 14W',            maxLoad: 26,   wheels: 14, category: '14-चक्का' },

  // ─── 16-चक्का (16 Wheelers / 6-Axle) ───
  { id: 'truck-16w',       name: '16-चक्का ट्रक (6 Axle)',   nameEn: 'Truck 16W 6-Axle',      maxLoad: 35,   wheels: 16, category: '16-चक्का' },
  { id: 'trailer-16w',     name: '16-चक्का ट्रेलर',          nameEn: 'Trailer 16W',           maxLoad: 32,   wheels: 16, category: '16-चक्का' },

  // ─── 18-चक्का (18 Wheelers / Semi-Truck) ───
  { id: 'trailer-18w',     name: '18-चक्का ट्रेलर (Semi)',   nameEn: 'Trailer 18W Semi-Truck', maxLoad: 40,  wheels: 18, category: '18-चक्का' },
  { id: 'container-40',    name: 'कंटेनर 40 फिट (18W)',      nameEn: 'Container 40ft 18W',    maxLoad: 30,   wheels: 18, category: '18-चक्का' },
  { id: 'tanker-18w',      name: 'टैंकर (18-चक्का)',         nameEn: 'Tanker 18W',            maxLoad: 35,   wheels: 18, category: '18-चक्का' },

  // ─── 20-चक्का (20 Wheelers / MAV) ───
  { id: 'mav-20w',         name: '20-चक्का MAV',             nameEn: 'MAV 20 Wheeler',        maxLoad: 45,   wheels: 20, category: '20-चक्का' },

  // ─── 22-चक्का (22 Wheelers / Heavy MAV) ───
  { id: 'mav-22w',         name: '22-चक्का MAV (भारी)',      nameEn: 'Heavy MAV 22W',         maxLoad: 50,   wheels: 22, category: '22-चक्का' },

  // ─── विशेष वाहन (Special) ───
  { id: 'crane-truck',     name: 'क्रेन ट्रक',               nameEn: 'Crane Truck',           maxLoad: 15,   wheels: 6,  category: 'विशेष' },
];

export const INDIA_STATES = [
  'आंध्र प्रदेश', 'अरुणाचल प्रदेश', 'असम', 'बिहार', 'छत्तीसगढ़',
  'गोवा', 'गुजरात', 'हरियाणा', 'हिमाचल प्रदेश', 'झारखंड',
  'कर्नाटक', 'केरल', 'मध्य प्रदेश', 'महाराष्ट्र', 'मणिपुर',
  'मेघालय', 'मिजोरम', 'नागालैंड', 'ओडिशा', 'पंजाब',
  'राजस्थान', 'सिक्किम', 'तमिलनाडु', 'तेलंगाना', 'त्रिपुरा',
  'उत्तर प्रदेश', 'उत्तराखंड', 'पश्चिम बंगाल', 'दिल्ली'
];

export interface GoodsCategory {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  needsCold?: boolean;
  items: string[];
}

export const GOODS_CATEGORIES: GoodsCategory[] = [
  {
    id: 'anaj',
    name: 'अनाज / दाल',
    nameEn: 'Grains & Pulses',
    icon: '🌾',
    items: ['गेहूं', 'चावल', 'मक्का', 'बाजरा', 'जवार', 'चना', 'अरहर दाल', 'मूंग दाल', 'उड़द दाल', 'सोयाबीन', 'मटर', 'राजमा'],
  },
  {
    id: 'fal-sabzi',
    name: 'फल & सब्जी',
    nameEn: 'Fruits & Vegetables',
    icon: '🥦',
    items: ['आम', 'केला', 'सेब', 'अंगूर', 'संतरा', 'अनार', 'पपीता', 'तरबूज', 'टमाटर', 'प्याज', 'आलू', 'लहसुन', 'अदरक', 'गोभी', 'बैंगन', 'भिंडी', 'करेला'],
  },
  {
    id: 'coconut',
    name: 'नारियल',
    nameEn: 'Coconut',
    icon: '🥥',
    items: ['नारियल (कच्चा)', 'नारियल (सूखा)', 'नारियल तेल', 'नारियल खोपरा'],
  },
  {
    id: 'fish',
    name: '🧊 मछली (Insulated)',
    nameEn: 'Fish - Insulated Vehicle',
    icon: '🐟',
    needsCold: true,
    items: ['रोहू मछली', 'कटला मछली', 'पम्पलेट', 'झींगा', 'समुद्री मछली', 'सूखी मछली', 'केकड़ा', 'तिलापिया'],
  },
  {
    id: 'dairy',
    name: 'डेयरी उत्पाद',
    nameEn: 'Dairy Products',
    icon: '🥛',
    needsCold: true,
    items: ['दूध', 'दही', 'पनीर', 'मक्खन', 'घी', 'खोया', 'छाछ', 'आइसक्रीम'],
  },
  {
    id: 'kapda',
    name: 'कपड़ा / कपास',
    nameEn: 'Textile & Cotton',
    icon: '🧵',
    items: ['रुई / कपास', 'कपड़ा (थान)', 'धागा', 'रेडीमेड कपड़े', 'जूट बोरे', 'बिस्तर / गद्दे'],
  },
  {
    id: 'nirman',
    name: 'निर्माण सामग्री',
    nameEn: 'Construction Material',
    icon: '🧱',
    items: ['सीमेंट', 'रेत / बालू', 'बजरी / गिट्टी', 'ईंट', 'पत्थर', 'मार्बल / टाइल', 'सरिया / लोहा', 'लकड़ी', 'प्लाईवुड'],
  },
  {
    id: 'tel-masale',
    name: 'तेल, मसाले & द्रव पदार्थ',
    nameEn: 'Oil, Spices & Liquids',
    icon: '🛢️',
    items: ['खाद्य तेल', 'लाल मिर्च', 'हल्दी', 'धनिया', 'जीरा', 'सौंफ', 'काली मिर्च', 'इलायची', 'दालचीनी', 'मिश्रित मसाले', 'डीजल', 'पेट्रोल', 'केरोसीन', 'केमिकल', 'पानी', 'एसिड', 'पेंट'],
  },
  {
    id: 'khad',
    name: 'खाद / कृषि सामग्री',
    nameEn: 'Fertilizer & Agriculture',
    icon: '🌱',
    items: ['यूरिया', 'DAP खाद', 'पोटाश', 'जैविक खाद', 'कीटनाशक', 'बीज', 'पशु चारा / भूसा'],
  },
  {
    id: 'machine',
    name: 'मशीनरी / इलेक्ट्रॉनिक्स',
    nameEn: 'Machinery & Electronics',
    icon: '⚙️',
    items: ['कृषि मशीनरी', 'इलेक्ट्रिक उपकरण', 'पंप / मोटर', 'जेनरेटर', 'AC / फ्रिज', 'TV / Electronics', 'मोबाइल / कंप्यूटर'],
  },
  {
    id: 'pashu',
    name: 'पशु / जानवर',
    nameEn: 'Livestock',
    icon: '🐄',
    items: ['गाय / भैंस', 'बकरी / भेड़', 'ऊंट', 'घोड़ा', 'मुर्गी / पक्षी', 'मछली (जीवित)'],
  },
  {
    id: 'other',
    name: 'अन्य (Other)',
    nameEn: 'Other',
    icon: '📦',
    items: [],
  },
];

export interface Rating {
  id: string;
  tripId: string;
  fromId: string;
  fromName: string;
  fromRole: 'driver' | 'vyapari';
  toId: string;
  toName: string;
  toRole: 'driver' | 'vyapari';
  stars: number;
  comment?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  tripId: string;
  senderId: string;
  senderName: string;
  senderRole: 'driver' | 'vyapari';
  text: string;
  timestamp: string;
}

export interface VyapariTrip {
  id: string;
  vyapariId: string;
  vyapariName: string;
  vyapariPhone: string;
  fromCity: string;
  fromState: string;
  toCity: string;
  toState: string;
  goodsCategory: string;
  weightTons: number;
  vehicleTypePref: string;
  ratePerTon: number;
  tripDate: string;
  description: string;
  status: 'open' | 'low_priority' | 'accepted' | 'completed' | 'cancelled';
  createdAt: string;
  paymentType?: 'sender' | 'receiver';
  advanceUTR?: string;
  acceptedByDriverId?: string;
  acceptedByDriverName?: string;
  acceptedAt?: string;
  completedAt?: string;
  receiverName?: string;
  receiverPhone?: string;
  receiverAddress?: string;
}

export interface CommissionPayment {
  id: string;
  driverId: string;
  driverName: string;
  vyapariTripId: string;
  vyapariId: string;
  amount: number;
  utrNumber: string;
  paidAt: string;
}

export interface AppRating {
  id: string;
  userId: string;
  userName: string;
  userRole: 'driver' | 'vyapari';
  stars: number;
  comment?: string;
  createdAt: string;
}

export interface AdvanceRequest {
  id: string;
  vyapariId: string;
  vyapariName: string;
  vyapariPhone: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  tripData: {
    fromCity: string;
    fromState: string;
    toCity: string;
    toState: string;
    goodsCategory: string;
    weightTons: number;
    vehicleTypePref: string;
    ratePerTon: number;
    tripDate: string;
    description: string;
  };
}

export const COMMISSION_PERCENT = 2;
export const COMMISSION_UPI = 'maksudsaiyed888@oksbi';
export const APP_NAME = 'Loading Fast India';
export const ADMIN_PASSWORD = 'LFI@Admin2024';
