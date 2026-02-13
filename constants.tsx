
import React from 'react';

export const APP_NAME = "Lifestyle Connect";
export const ADMIN_WHATSAPP = "263770000000";

export const ZIM_CITIES = [
  "Harare", "Bulawayo", "Chitungwiza", "Mutare", "Gweru", "Epworth", 
  "Kwekwe", "Kadoma", "Masvingo", "Chinhoyi", "Norton", "Marondera", 
  "Ruwa", "Chegutu", "Zvishavane", "Bindura", "Beitbridge", "Redcliff", 
  "Victoria Falls", "Hwange", "Rusape", "Chiredzi", "Kariba", "Karoi", 
  "Chipinge", "Gokwe", "Shurugwi"
].sort();

export const VENDOR_CATEGORIES = [
  "Wedding Venues",
  "Wedding Planners",
  "Wedding and Lobola Dresses",
  "Wedding Videographers",
  "Wedding Photographers",
  "Marriage Counselors"
];

export const Logo: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <div className={`relative flex items-center justify-center ${className} group`}>
    
    {/* Heart Container Background */}
    <svg 
      viewBox="0 0 24 24" 
      className="absolute inset-0 w-full h-full text-rose-600 drop-shadow-xl transform group-hover:scale-110 transition-transform duration-500 ease-out"
    >
      <defs>
        <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#E11D48', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#BE123C', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <path 
        fill="url(#heartGradient)" 
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      />
    </svg>

    {/* Rose Inside - Scaled down and centered */}
    <svg viewBox="0 0 24 24" className="relative z-10 w-[55%] h-[55%] translate-y-[2%]">
       {/* Rose Bloom Layers (White/Light Pink) */}
      <path 
        fill="#FFE4E6" 
        d="M12 21c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm0-14c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6z"
      />
      {/* Inner Petal Details (Rose Pink) */}
      <path 
        fill="#FB7185" 
        d="M12 16.5c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5zm0-7c-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5 2.5-1.1 2.5-2.5-1.1-2.5-2.5-2.5z"
      />
      {/* Rose Core (White) */}
      <circle cx="12" cy="12" r="1.5" fill="white" />
    </svg>
  </div>
);

export const VENDORS: any[] = [
  { 
    id: 'v1', 
    name: 'Golden Conifer', 
    category: 'Wedding Venues', 
    location: 'Harare', 
    address: '123 Strathaven Road, Harare',
    phone: '+263 77 123 4567',
    email: 'bookings@goldenconifer.co.zw',
    priceRange: '$1500 - $3000',
    images: ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=400&q=80']
  },
  { 
    id: 'v2', 
    name: 'Zuva Designs', 
    category: 'Wedding and Lobola Dresses', 
    location: 'Bulawayo',
    address: 'Shop 4, Bradfield Mall, Bulawayo',
    phone: '+263 71 987 6543',
    email: 'info@zuvadesigns.com',
    priceRange: '$300 - $800',
    images: ['https://images.unsplash.com/photo-1594553323242-c1947d6c4f1c?auto=format&fit=crop&w=400&q=80'] 
  },
];

export const GIFTS: any[] = [
  { id: 'g1', name: 'Luxury Rose Bouquet', price: 45, provider: 'Blooms Zim', image: 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?auto=format&fit=crop&w=400&q=80' },
  { id: 'g2', name: 'Assorted Chocolate Box', price: 25, provider: 'Sweet Treats', image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=400&q=80' },
  { id: 'g3', name: 'Custom Couple Mug', price: 15, provider: 'Print Shop', image: 'https://images.unsplash.com/photo-1517256011271-bf3f22b8214d?auto=format&fit=crop&w=400&q=80' },
];

export const INTEREST_OPTIONS = [
  "Bible Study", "Worship Music", "Traveling", "Fitness", "Reading", "Cooking", "Photography", "Gardening", "Social Media", "Podcasts"
];

export const MATURITY_LEVELS: any[] = [
  "New Believer", "Growing", "Deeply Rooted", "Church Leader"
];
