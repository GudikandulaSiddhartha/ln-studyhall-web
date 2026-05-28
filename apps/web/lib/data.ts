import {
  Armchair,
  BadgeCheck,
  BatteryCharging,
  Building2,
  Camera,
  Droplets,
  Fan,
  Lock,
  Moon,
  Sparkles,
  VolumeX,
  Wifi
} from "lucide-react";

export const contactDetails = {
  phone: "8555827719",
  phoneHref: "tel:+918555827719",
  whatsapp: "8555827719",
  whatsappHref: "https://wa.me/918555827719",
  email: "gudikadulabunny345@gmail.com",
  emailHref: "mailto:gudikadulabunny345@gmail.com"
};

export const branches = [
  {
    id: "ln-hanamkonda",
    name: "LN Study Hall Hanamkonda",
    area: "Gopalapuram Cross Road, Near KU Cross, Opp. Baby Sainik School, Hanamkonda",
    landmark: "Opp. Baby Sainik School",
    seats: 72,
    occupancy: 84,
    lat: 18.0108,
    lng: 79.5586,
    mapsUrl: "https://maps.app.goo.gl/ieUbt9ByBDWzXwF39",
    phone: contactDetails.phone,
    hours: "6:00 AM - 11:00 PM",
    facilities: ["Reading Room", "AC", "CCTV", "WiFi", "Individual Cabins", "Drinking Water"]
  },
  {
    id: "ln-warangal",
    name: "LN STUDY HALL Warangal",
    area: "15-3-55, Infrent of KMC gate, Rangampet Rd, near MGM Hospital, Warangal, Telangana 506002",
    landmark: "Opp. KMC, Rangampet, Vidya Nagar",
    seats: 42,
    occupancy: 79,
    lat: 17.9784,
    lng: 79.6000,
    mapsUrl: "https://maps.app.goo.gl/rxo4CqN7QP3V15WeA",
    phone: contactDetails.phone,
    hours: "6:00 AM - 11:00 PM",
    facilities: ["Reading Room", "AC", "CCTV", "WiFi", "Individual Cabins", "Drinking Water"]
  }
];

export const facilities = [
  { title: "Individual Cabins", icon: Building2, description: "Private focus pods with premium desk lighting and quiet partitions." },
  { title: "AC Rooms", icon: Fan, description: "Temperature controlled halls designed for long study sessions." },
  { title: "Soundproof Study Rooms", icon: VolumeX, description: "Acoustic zones that reduce outside noise and distraction." },
  { title: "Drinking Water", icon: Droplets, description: "Filtered water stations placed close to every seating zone." },
  { title: "High-Speed WiFi", icon: Wifi, description: "Reliable connectivity for online classes, tests, and research." },
  { title: "Neat Washrooms", icon: Sparkles, description: "Clean, inspected facilities maintained throughout the day." },
  { title: "CCTV Security", icon: Camera, description: "Monitored common areas with privacy-respecting security coverage." },
  { title: "Power Backup", icon: BatteryCharging, description: "Backup systems keep lights, WiFi, and fans active during outages." },
  { title: "Comfortable Chairs", icon: Armchair, description: "Ergonomic chairs selected for focused daily study routines." },
  { title: "Silent Environment", icon: Moon, description: "Strict quiet policy, soft lighting, and separated discussion areas." }
];

export const memberships = [
  {
    name: "Monthly Pass",
    price: 1500,
    description: "Best value for regular learners who need a focused monthly study routine.",
    features: ["Reading room access", "AC study hall", "High-speed WiFi", "Individual cabins", "Drinking water", "CCTV security"],
    featured: true
  }
];

export const revenue = [
  { month: "Jan", revenue: 180000, occupancy: 62 },
  { month: "Feb", revenue: 225000, occupancy: 68 },
  { month: "Mar", revenue: 248000, occupancy: 74 },
  { month: "Apr", revenue: 310000, occupancy: 81 },
  { month: "May", revenue: 342000, occupancy: 86 },
  { month: "Jun", revenue: 398000, occupancy: 91 }
];

export const seats = Array.from({ length: 72 }, (_, index) => {
  const status = index % 11 === 0 ? "blocked" : index % 5 === 0 || index % 7 === 0 ? "booked" : "available";
  return {
    id: `A-${String(index + 1).padStart(2, "0")}`,
    status
  };
});

export const adminLogs = [
  "New booking confirmed for Premium Cabin C-04",
  "Central branch uploaded 8 gallery images",
  "Monthly plan payment received from Aditi Sharma",
  "Seat A-12 released after QR checkout",
  "LN AI Assistant updated with holiday timings"
];

export const userActivity = [
  { date: "Mon", hours: 5.5 },
  { date: "Tue", hours: 7 },
  { date: "Wed", hours: 6 },
  { date: "Thu", hours: 8.5 },
  { date: "Fri", hours: 4 },
  { date: "Sat", hours: 9 },
  { date: "Sun", hours: 3.5 }
];

export const trustBadges = [
  { label: "Verified quiet zones", icon: BadgeCheck },
  { label: "Secure QR access", icon: Lock },
  { label: "Power backed halls", icon: BatteryCharging }
];
