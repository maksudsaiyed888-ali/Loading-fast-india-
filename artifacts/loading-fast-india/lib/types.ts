export type UserRole = 'driver' | 'vyapari' | 'admin';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  aadhaarNumber: string;
  licenseNumber: string;
  licenseExpiry: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notificationRadius: number;
  createdAt: string;
  isVerified: boolean;
  totalTrips: number;
  rating: number;
}

export interface Vyapari {
  id: string;
  name: string;
  businessName: string;
  phone: string;
  email: string;
  aadhaarNumber: string;
  gstNumber?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  createdAt: string;
  isVerified: boolean;
  totalBookings: number;
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
  status: 'available' | 'confirmed' | 'completed' | 'cancelled';
  confirmedBy?: string;
  confirmedByName?: string;
  confirmedAt?: string;
  commissionPaid: boolean;
  commissionAmount: number;
  createdAt: string;
  driverLat?: number;
  driverLng?: number;
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
  subject: string;
  description: string;
  status: 'pending' | 'resolved' | 'escalated';
  createdAt: string;
}

export const VEHICLE_TYPES = [
  { id: 'tractor-trolley', name: 'ट्रैक्टर-ट्रॉली', nameEn: 'Tractor Trolley', maxLoad: 10 },
  { id: 'mini-truck', name: 'मिनी ट्रक (छोटा हाथी)', nameEn: 'Mini Truck', maxLoad: 3 },
  { id: 'pickup', name: 'पिकअप', nameEn: 'Pickup', maxLoad: 1 },
  { id: 'truck-14', name: 'ट्रक 14 फिट', nameEn: 'Truck 14ft', maxLoad: 8 },
  { id: 'truck-17', name: 'ट्रक 17 फिट', nameEn: 'Truck 17ft', maxLoad: 12 },
  { id: 'truck-lorry', name: 'ट्रक / लॉरी', nameEn: 'Truck/Lorry', maxLoad: 25 },
  { id: 'trailer', name: 'ट्रेलर', nameEn: 'Trailer', maxLoad: 40 },
  { id: 'tipper', name: 'टिपर', nameEn: 'Tipper', maxLoad: 20 },
  { id: 'container-20', name: 'कंटेनर 20 फिट', nameEn: 'Container 20ft', maxLoad: 18 },
  { id: 'container-40', name: 'कंटेनर 40 फिट', nameEn: 'Container 40ft', maxLoad: 30 },
  { id: 'tanker', name: 'टैंकर', nameEn: 'Tanker', maxLoad: 25 },
  { id: 'flatbed', name: 'फ्लैटबेड', nameEn: 'Flatbed', maxLoad: 20 },
  { id: 'crane-truck', name: 'क्रेन ट्रक', nameEn: 'Crane Truck', maxLoad: 15 },
  { id: 'refrigerated', name: 'रेफ्रिजेरेटेड ट्रक', nameEn: 'Refrigerated Truck', maxLoad: 15 },
  { id: 'tempo', name: 'टेम्पो', nameEn: 'Tempo', maxLoad: 2 },
  { id: 'auto-goods', name: 'ऑटो (माल गाड़ी)', nameEn: 'Auto Goods', maxLoad: 0.5 },
  { id: 'bullock-cart', name: 'बैलगाड़ी', nameEn: 'Bullock Cart', maxLoad: 2 },
  { id: 'camel-cart', name: 'ऊंटगाड़ी', nameEn: 'Camel Cart', maxLoad: 1.5 },
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
    id: 'masale',
    name: 'मसाले',
    nameEn: 'Spices',
    icon: '🌶️',
    items: ['लाल मिर्च', 'हल्दी', 'धनिया', 'जीरा', 'सौंफ', 'काली मिर्च', 'इलायची', 'दालचीनी', 'मिश्रित मसाले'],
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
    id: 'tel',
    name: 'तेल / द्रव पदार्थ',
    nameEn: 'Oil & Liquids',
    icon: '🛢️',
    items: ['खाद्य तेल', 'डीजल', 'पेट्रोल', 'केरोसीन', 'केमिकल', 'पानी', 'एसिड', 'पेंट'],
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

export const COMMISSION_PERCENT = 2;
export const COMMISSION_UPI = 'hemaksudsaiyed888@oksbi';
export const APP_NAME = 'Loading Fast India';
export const ADMIN_PASSWORD = 'LFI@Admin2024';
