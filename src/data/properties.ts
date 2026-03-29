import property1 from "@/assets/property-1.jpg";
import property2 from "@/assets/property-2.jpg";
import property3 from "@/assets/property-3.jpg";
import property4 from "@/assets/property-4.jpg";
import property5 from "@/assets/property-5.jpg";
import property6 from "@/assets/property-6.jpg";

export interface Property {
  id: string;
  title: string;
  description: string;
  type: string;
  bedrooms: number;
  price: number;
  location: {
    neighborhood: string;
    county: string;
    lat: number;
    lng: number;
  };
  images: string[];
  amenities: string[];
  agent: {
    name: string;
    agency: string;
    avatar: string;
    verified: boolean;
    earbLicensed: boolean;
    memberSince: number;
    responseRate: string;
    slug: string;
  };
  status: "available" | "occupied" | "under-maintenance";
  createdAt: string;
}



export const PROPERTY_TYPES = [
  "All", "Bedsitter", "Studio", "1 Bedroom", "2 Bedroom", "3 Bedroom", "4+ Bedroom",
  "Maisonette", "Bungalow", "Townhouse"
];

export const PRICE_RANGES = [
  { label: "Any Price", min: 0, max: Infinity },
  { label: "KES 5K - 10K", min: 5000, max: 10000 },
  { label: "KES 10K - 20K", min: 10000, max: 20000 },
  { label: "KES 20K - 40K", min: 20000, max: 40000 },
  { label: "KES 40K - 80K", min: 40000, max: 80000 },
  { label: "KES 80K+", min: 80000, max: Infinity },
];

export const AMENITIES_LIST = [
  "Water Supply", "Electricity", "Parking", "Security/Guard", "CCTV", "Borehole",
  "Swimming Pool", "Gym", "Backup Generator", "Balcony", "Garden/Compound",
  "Furnished", "WiFi/Internet", "Pet Friendly", "Near School", "Near Hospital",
  "Near Shopping Centre", "Near Matatu Stage"
];

export const mockProperties: Property[] = [
  {
    id: "1",
    title: "Modern 2BR Apartment with City Views",
    description: "Stunning modern apartment in the heart of Kilimani with panoramic city views. Features an open-plan living area with floor-to-ceiling windows, modern kitchen with granite countertops, and a spacious master bedroom with ensuite bathroom. The apartment complex includes 24-hour security, ample parking, and a rooftop terrace. Perfect for professionals or young families looking for contemporary living in a prime Nairobi location.",
    type: "2 Bedroom",
    bedrooms: 2,
    price: 45000,
    location: { neighborhood: "Kilimani", county: "Nairobi", lat: -1.2921, lng: 36.7822 },
    images: [property1, property2, property5],
    amenities: ["Water Supply", "Electricity", "Parking", "Security/Guard", "CCTV", "Gym", "Backup Generator", "Balcony", "WiFi/Internet"],
    agent: { name: "James Mwangi", agency: "Prime Realty Kenya", avatar: "", verified: true, earbLicensed: true, memberSince: 2021, responseRate: "< 2 hours", slug: "prime-realty" },
    status: "available",
    createdAt: "2026-03-15",
  },
  {
    id: "2",
    title: "Spacious 3BR Maisonette in Karen",
    description: "Beautiful 3-bedroom maisonette in the leafy Karen suburb with a private garden and ample parking. Features include a large living room, separate dining area, fully fitted kitchen, and three generous bedrooms each with built-in wardrobes. The compound is gated with 24-hour security. Close to Karen Shopping Centre, international schools, and the Karen Country Club.",
    type: "Maisonette",
    bedrooms: 3,
    price: 85000,
    location: { neighborhood: "Karen", county: "Nairobi", lat: -1.3180, lng: 36.7114 },
    images: [property4, property6, property1],
    amenities: ["Water Supply", "Electricity", "Parking", "Security/Guard", "Borehole", "Garden/Compound", "Pet Friendly", "Near School", "Near Shopping Centre"],
    agent: { name: "Amina Hassan", agency: "Horizon Estates", avatar: "", verified: true, earbLicensed: true, memberSince: 2019, responseRate: "< 1 hour", slug: "horizon-estates" },
    status: "available",
    createdAt: "2026-03-10",
  },
  {
    id: "3",
    title: "Cozy Studio in Westlands",
    description: "Well-maintained studio apartment in Westlands, ideal for a young professional. Features a modern kitchenette, spacious bathroom, and built-in storage. The building has a swimming pool, gym, and secure parking. Walking distance to Sarit Centre and Westgate shopping malls.",
    type: "Studio",
    bedrooms: 0,
    price: 18000,
    location: { neighborhood: "Westlands", county: "Nairobi", lat: -1.2635, lng: 36.8103 },
    images: [property3, property5, property2],
    amenities: ["Water Supply", "Electricity", "Parking", "Security/Guard", "Swimming Pool", "Gym", "WiFi/Internet", "Near Shopping Centre"],
    agent: { name: "David Ochieng", agency: "Nest Finders", avatar: "", verified: true, earbLicensed: false, memberSince: 2023, responseRate: "< 4 hours", slug: "nest-finders" },
    status: "available",
    createdAt: "2026-03-12",
  },
  {
    id: "4",
    title: "Elegant 1BR in Lavington",
    description: "Charming one-bedroom apartment in Lavington with a beautiful balcony overlooking a lush compound. The apartment features hardwood floors, a modern kitchen, and ample natural light throughout. The complex has a borehole, backup generator, and playground.",
    type: "1 Bedroom",
    bedrooms: 1,
    price: 32000,
    location: { neighborhood: "Lavington", county: "Nairobi", lat: -1.2780, lng: 36.7721 },
    images: [property6, property1, property3],
    amenities: ["Water Supply", "Electricity", "Parking", "Security/Guard", "Borehole", "Backup Generator", "Balcony", "Garden/Compound"],
    agent: { name: "Amina Hassan", agency: "Horizon Estates", avatar: "", verified: true, earbLicensed: true, memberSince: 2019, responseRate: "< 1 hour", slug: "horizon-estates" },
    status: "available",
    createdAt: "2026-03-08",
  },
  {
    id: "5",
    title: "Luxurious 2BR with Pool Access",
    description: "Premium two-bedroom apartment in a modern complex along Ngong Road. Features include a spacious living area, fully equipped kitchen, master ensuite, and a guest bedroom. Residents enjoy access to a stunning swimming pool, gym, children's play area, and beautifully landscaped gardens.",
    type: "2 Bedroom",
    bedrooms: 2,
    price: 55000,
    location: { neighborhood: "Ngong Road", county: "Nairobi", lat: -1.2960, lng: 36.7610 },
    images: [property5, property1, property6],
    amenities: ["Water Supply", "Electricity", "Parking", "Security/Guard", "CCTV", "Swimming Pool", "Gym", "Backup Generator", "Balcony", "Garden/Compound", "WiFi/Internet", "Near School"],
    agent: { name: "James Mwangi", agency: "Prime Realty Kenya", avatar: "", verified: true, earbLicensed: true, memberSince: 2021, responseRate: "< 2 hours", slug: "prime-realty" },
    status: "available",
    createdAt: "2026-03-14",
  },
  {
    id: "6",
    title: "Affordable Bedsitter in South B",
    description: "Clean and well-lit bedsitter in South B, perfect for students or single professionals. Includes a shared kitchenette and ample storage. The building has security and is located near public transport, supermarkets, and hospitals.",
    type: "Bedsitter",
    bedrooms: 0,
    price: 8500,
    location: { neighborhood: "South B", county: "Nairobi", lat: -1.3100, lng: 36.8350 },
    images: [property3, property6, property1],
    amenities: ["Water Supply", "Electricity", "Security/Guard", "Near Hospital", "Near Shopping Centre", "Near Matatu Stage"],
    agent: { name: "Peter Kamau", agency: "Kamau Rentals", avatar: "", verified: false, earbLicensed: false, memberSince: 2024, responseRate: "< 6 hours", slug: "kamau-rentals" },
    status: "available",
    createdAt: "2026-03-16",
  },
  {
    id: "7",
    title: "Family 3BR Apartment in Kileleshwa",
    description: "Spacious three-bedroom apartment in serene Kileleshwa. Features a large master bedroom with ensuite, two additional bedrooms, a family bathroom, separate dining and living areas, and a DSQ. The compound has ample parking and a children's play area.",
    type: "3 Bedroom",
    bedrooms: 3,
    price: 70000,
    location: { neighborhood: "Kileleshwa", county: "Nairobi", lat: -1.2775, lng: 36.7860 },
    images: [property2, property4, property6],
    amenities: ["Water Supply", "Electricity", "Parking", "Security/Guard", "CCTV", "Borehole", "Backup Generator", "Balcony", "Garden/Compound", "Near School"],
    agent: { name: "David Ochieng", agency: "Nest Finders", avatar: "", verified: true, earbLicensed: false, memberSince: 2023, responseRate: "< 4 hours", slug: "nest-finders" },
    status: "available",
    createdAt: "2026-03-11",
  },
  {
    id: "8",
    title: "Furnished 1BR in Upper Hill",
    description: "Fully furnished one-bedroom apartment in Upper Hill, ideal for expatriates or business travelers. Modern finishes throughout, including a fitted kitchen with appliances, comfortable living area, and a balcony with city views. Building amenities include a gym, secure parking, and backup power.",
    type: "1 Bedroom",
    bedrooms: 1,
    price: 50000,
    location: { neighborhood: "Upper Hill", county: "Nairobi", lat: -1.2930, lng: 36.8143 },
    images: [property1, property3, property5],
    amenities: ["Water Supply", "Electricity", "Parking", "Security/Guard", "CCTV", "Gym", "Backup Generator", "Balcony", "Furnished", "WiFi/Internet"],
    agent: { name: "Amina Hassan", agency: "Horizon Estates", avatar: "", verified: true, earbLicensed: true, memberSince: 2019, responseRate: "< 1 hour", slug: "horizon-estates" },
    status: "available",
    createdAt: "2026-03-13",
  },
  {
    id: "9",
    title: "Townhouse in Syokimau",
    description: "Modern 3-bedroom townhouse in a gated community in Syokimau. Features an open-plan ground floor with a fitted kitchen, spacious living and dining areas, and a backyard garden. Three bedrooms upstairs with the master ensuite. Close to the Syokimau railway station for easy commute to the CBD.",
    type: "Townhouse",
    bedrooms: 3,
    price: 35000,
    location: { neighborhood: "Syokimau", county: "Machakos", lat: -1.3550, lng: 36.9280 },
    images: [property4, property2, property6],
    amenities: ["Water Supply", "Electricity", "Parking", "Security/Guard", "Borehole", "Garden/Compound", "Near Matatu Stage"],
    agent: { name: "Peter Kamau", agency: "Kamau Rentals", avatar: "", verified: false, earbLicensed: false, memberSince: 2024, responseRate: "< 6 hours", slug: "kamau-rentals" },
    status: "available",
    createdAt: "2026-03-09",
  },
];
