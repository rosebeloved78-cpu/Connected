
export type Tier = 'free' | 'tier2' | 'tier3' | 'diaspora_free' | 'diaspora_premium' | 'diaspora_vetted';

export type SpiritualMaturity = "'Nepios', a baby" | "'Teknon', growing" | "'Huios', mature";

export interface User {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  country: string;
  city: string;
  location: string; 
  bio: string;
  images: string[];
  coverImage?: string;
  attendsChurch: boolean;
  churchName?: string;
  servesInChurch: boolean;
  department?: string;
  vowAccepted: boolean;
  tier: Tier;
  isDiaspora: boolean;
  isVetted?: boolean;
  showInDiaspora: boolean;
  education?: string;
  profession?: string;
  interests?: string[];
  spiritualMaturity?: SpiritualMaturity;
  verificationStatus: 'unverified' | 'pending' | 'verified';
  verificationImage?: string;
  maritalStatus?: 'Never Married' | 'Divorced';
  hasChildren?: boolean;
  numberOfChildren?: number;
  wantsChildren?: 'Yes' | 'No' | 'Maybe';
  isAdmin?: boolean;
  isHidden?: boolean;
}

export interface Comment {
  id: string;
  userName: string;
  content: string;
  timestamp: Date;
}

export interface PrayerRequest {
  id: string;
  userId: string;
  userName: string;
  content: string;
  isAnonymous: boolean;
  timestamp: Date;
  amenCount: number;
  audioUrl?: string;
  isAdminPost?: boolean;
  comments?: Comment[];
}

export interface FriendshipPost {
  id: string;
  userId: string;
  userName: string;
  userLocation: string;
  userChurch?: string;
  content: string;
  category: 'Prayer Partner' | 'Same Church' | 'Same City';
  timestamp: Date;
  comments?: Comment[];
}

export interface Testimony {
  id: string;
  title: string;
  content: string;
  image: string;
  coupleNames: string;
  comments?: Comment[];
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  location: string; // City
  address: string;
  phone: string;
  email: string;
  priceRange: string;
  images: string[]; // Array of up to 5 images
}

export interface VideoPost {
  id: string;
  title: string;
  url: string;
  videoId: string;
  timestamp: Date;
}

export interface Gift {
  id: string;
  name: string;
  price: number;
  provider: string;
  image: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: any;
}

export interface ChatSession {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantImages: Record<string, string>;
  lastMessage: string;
  lastMessageTimestamp: any;
  unreadCount?: number;
}

export interface PrayerPost extends PrayerRequest {}
