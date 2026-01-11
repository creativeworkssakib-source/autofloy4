import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef, useState, memo, useCallback } from "react";
import { TrendingUp, Users, Clock, Wallet, Star, BadgeCheck, ShieldCheck, ThumbsUp, Plus, LogIn, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import TiltCard from "@/components/ui/TiltCard";
import { supabase } from "@/integrations/supabase/client";
import { createReview, likeReview } from "@/services/authService";
import { Link } from "react-router-dom";

interface CounterProps {
  from: number;
  to: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  likes: number;
  isLiked: boolean;
  isVerified: boolean;
}

const Counter = memo(({ from, to, suffix = "", prefix = "", duration = 2 }: CounterProps) => {
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(from);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (latest) => setDisplayValue(latest));
    return () => unsubscribe();
  }, [rounded]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          animate(count, to, { duration });
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [count, to, duration, hasAnimated]);

  return <span ref={ref}>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
});

Counter.displayName = "Counter";

const benefits = [
  { icon: TrendingUp, value: 10, suffix: "x", label: "Faster Responses", description: "AI replies to customers instantly", gradient: "from-primary to-primary-glow" },
  { icon: Clock, value: 85, suffix: "%", label: "Time Saved", description: "Automate messages & shop tasks", gradient: "from-secondary to-primary" },
  { icon: Users, value: 24, suffix: "/7", label: "Always Available", description: "Online & offline business support", gradient: "from-accent to-secondary" },
  { icon: Wallet, value: 80000, prefix: "৳", suffix: "+", label: "Monthly Savings", description: "Staff, inventory & management costs saved", gradient: "from-success to-primary" },
];

// Default reviews to show - 105+ reviews
const defaultReviews: Review[] = [
  { id: "default-1", name: "Rakib H.", rating: 5, text: "আমার Facebook পেজে প্রতিদিন ১০০+ মেসেজ আসত, সব reply দিতে ৩-৪ ঘণ্টা লাগত। AutoFloy দিয়ে এখন সব automatic! Best decision ever! 🔥", likes: 24, isLiked: false, isVerified: true },
  { id: "default-2", name: "Nusrat J.", rating: 5, text: "রাতে ঘুমানোর পর কাস্টমার order দিলে আগে miss হয়ে যেত। এখন AutoFloy 24/7 reply দেয়। আমার sales 40% বেড়ে গেছে মাত্র ১ মাসে!", likes: 18, isLiked: false, isVerified: true },
  { id: "default-3", name: "Tanvir A.", rating: 5, text: "আমার ছোট business এর জন্য extra staff hire করার budget ছিল না। AutoFloy এখন আমার virtual assistant! পয়সা worth it!", likes: 31, isLiked: false, isVerified: true },
  { id: "default-4", name: "Fatema K.", rating: 5, text: "আমার দোকানের সব হিসাব এখন digital। Stock, বিক্রি, খরচ - সব এক জায়গায়। Invoice ও সুন্দর দেখায়। Customer রা impressed! 👍", likes: 15, isLiked: false, isVerified: true },
  { id: "default-5", name: "Rahim M.", rating: 5, text: "Online আর offline দুই জায়গায় বিক্রি করি। আগে stock গুলিয়ে যেত। এখন sync feature দিয়ে সব ঠিক থাকে। সময় অনেক বাঁচে!", likes: 22, isLiked: false, isVerified: true },
  { id: "default-6", name: "Ayesha B.", rating: 5, text: "AutoFloy এর AI chatbot সত্যিই বুদ্ধিমান! কাস্টমার এর সব প্রশ্নের উত্তর দেয় আমার মতো করেই। Amazing! 💯", likes: 45, isLiked: false, isVerified: true },
  { id: "default-7", name: "Kamal S.", rating: 5, text: "আমি clothing business করি। এখন সব order track করতে পারি, কোন product কত বিক্রি হচ্ছে সব দেখি। Super helpful!", likes: 28, isLiked: false, isVerified: true },
  { id: "default-8", name: "Shimu R.", rating: 5, text: "আমার cosmetics shop এর জন্য perfect! Customer দের product suggest করে automatically। Sales বেড়েছে অনেক!", likes: 33, isLiked: false, isVerified: true },
  { id: "default-9", name: "Jahid K.", rating: 5, text: "SMS feature টা অনেক কাজের। Due customer দের reminder পাঠাতে পারি। Collection rate 60% বেড়ে গেছে!", likes: 19, isLiked: false, isVerified: true },
  { id: "default-10", name: "Mitu P.", rating: 5, text: "আগে Excel এ হিসাব রাখতাম, অনেক ঝামেলা ছিল। এখন সব organized। Report ও সুন্দরভাবে পাই।", likes: 27, isLiked: false, isVerified: true },
  { id: "default-11", name: "Sohel A.", rating: 5, text: "Mobile দিয়েই সব manage করতে পারি। Shop এ না থাকলেও সব কিছু দেখতে পাই। Very convenient!", likes: 36, isLiked: false, isVerified: true },
  { id: "default-12", name: "Rima K.", rating: 5, text: "Customer service অসাধারণ! যখনই সমস্যা হয়েছে সাথে সাথে solve করে দিয়েছে। ধন্যবাদ AutoFloy team!", likes: 42, isLiked: false, isVerified: true },
  { id: "default-13", name: "Habib M.", rating: 5, text: "Grocery shop চালাই। Daily sales report দেখতে পারি এক click এ। Profit margin ও calculate হয়ে যায়।", likes: 21, isLiked: false, isVerified: true },
  { id: "default-14", name: "Tania S.", rating: 5, text: "Fashion page এর জন্য best! Product photo দেখালেই AI বলে দেয় কোন product, price কত। Customer impressed!", likes: 38, isLiked: false, isVerified: true },
  { id: "default-15", name: "Imran H.", rating: 5, text: "Pharmacy business এ product expiry date track করা important। AutoFloy alert দেয় আগেই। Loss কমে গেছে!", likes: 29, isLiked: false, isVerified: true },
  { id: "default-16", name: "Sabrina N.", rating: 4, text: "প্রথমে একটু শিখতে সময় লাগে, কিন্তু শিখে গেলে অসাধারণ! Support team ও অনেক helpful।", likes: 16, isLiked: false, isVerified: true },
  { id: "default-17", name: "Arif R.", rating: 5, text: "Electronics shop এ warranty track করা এখন সহজ। Customer call করলেই history দেখতে পাই।", likes: 25, isLiked: false, isVerified: true },
  { id: "default-18", name: "Lipi A.", rating: 5, text: "Home-based business করি। একা সব সামলাতাম। এখন AutoFloy আমার partner! Time অনেক বাঁচে।", likes: 47, isLiked: false, isVerified: true },
  { id: "default-19", name: "Masud K.", rating: 5, text: "Restaurant এ use করছি। Order নেওয়া থেকে billing সব streamlined। Staff রা ও happy!", likes: 34, isLiked: false, isVerified: true },
  { id: "default-20", name: "Nasima B.", rating: 5, text: "Boutique shop এর জন্য perfect! Custom order track করা এখন easy। Customer satisfaction বেড়েছে!", likes: 31, isLiked: false, isVerified: true },
  { id: "default-21", name: "Ripon S.", rating: 5, text: "Hardware store চালাই। ১০০০+ products আছে। Stock management এখন hassle-free! 👌", likes: 23, isLiked: false, isVerified: true },
  { id: "default-22", name: "Shila K.", rating: 5, text: "Jewelry business এ customer trust important। Digital invoice দিলে professional দেখায়।", likes: 39, isLiked: false, isVerified: true },
  { id: "default-23", name: "Jamil H.", rating: 5, text: "Furniture shop এ installment sale করি। Due tracking এখন automated। আর tension নেই!", likes: 26, isLiked: false, isVerified: true },
  { id: "default-24", name: "Popy R.", rating: 5, text: "Cake business করি। Order manage করা আগে nightmare ছিল। এখন সব organized! 🎂", likes: 44, isLiked: false, isVerified: true },
  { id: "default-25", name: "Selim A.", rating: 5, text: "Mobile shop এ IMEI tracking feature দরকার ছিল। AutoFloy তে আছে! Perfect solution!", likes: 32, isLiked: false, isVerified: true },
  { id: "default-26", name: "Monika S.", rating: 5, text: "Beauty parlor এ appointment booking feature use করছি। Customer রা নিজেই book করতে পারে।", likes: 37, isLiked: false, isVerified: true },
  { id: "default-27", name: "Sumon K.", rating: 5, text: "Stationary shop এ school season এ অনেক rush থাকে। Fast billing feature life saver!", likes: 20, isLiked: false, isVerified: true },
  { id: "default-28", name: "Runa P.", rating: 5, text: "Online saree business করি। Facebook থেকে order নিয়ে সব track করি এখানে। Super easy!", likes: 41, isLiked: false, isVerified: true },
  { id: "default-29", name: "Alamgir H.", rating: 5, text: "Construction materials বিক্রি করি। Big orders এর জন্য quotation তৈরি করা এখন সহজ।", likes: 24, isLiked: false, isVerified: true },
  { id: "default-30", name: "Bithi N.", rating: 5, text: "Gift shop চালাই। Seasonal products track করা দরকার। AutoFloy সব করে দেয়! 🎁", likes: 35, isLiked: false, isVerified: true },
  { id: "default-31", name: "Rafiq M.", rating: 5, text: "Shoe store এ size-wise stock maintain করা এখন easy। Customer কে সাথে সাথে বলতে পারি কোন size আছে।", likes: 28, isLiked: false, isVerified: true },
  { id: "default-32", name: "Shapla B.", rating: 5, text: "Handicraft business করি। International orders ও manage করতে পারি। Currency conversion ও আছে!", likes: 43, isLiked: false, isVerified: true },
  { id: "default-33", name: "Kashem S.", rating: 5, text: "Printing press আছে। Job costing আর delivery tracking এখন automated। Profit বুঝতে পারি!", likes: 22, isLiked: false, isVerified: true },
  { id: "default-34", name: "Nilima K.", rating: 5, text: "Flower shop এ fresh stock maintain করা important। Expiry alert feature অসাধারণ! 🌸", likes: 38, isLiked: false, isVerified: true },
  { id: "default-35", name: "Babul H.", rating: 5, text: "Wholesale business করি। Dealer-wise price set করতে পারি। বড় ব্যবসার জন্য perfect!", likes: 30, isLiked: false, isVerified: true },
  { id: "default-36", name: "Sumi R.", rating: 5, text: "Kids clothing business এ size chart maintain করা এখন সহজ। Parents রা happy!", likes: 33, isLiked: false, isVerified: true },
  { id: "default-37", name: "Monir A.", rating: 5, text: "Auto parts shop এ vehicle-wise parts track করি। Customer কে exact part দিতে পারি।", likes: 25, isLiked: false, isVerified: true },
  { id: "default-38", name: "Jesmin S.", rating: 5, text: "Tailoring business এ measurement save করে রাখি। Repeat customer দের জন্য easy!", likes: 40, isLiked: false, isVerified: true },
  { id: "default-39", name: "Shakil K.", rating: 5, text: "Computer shop এ service tracking feature use করি। Warranty আর repair record সব আছে।", likes: 27, isLiked: false, isVerified: true },
  { id: "default-40", name: "Rokeya B.", rating: 5, text: "Homemade food business করি। Daily order আর ingredient cost track করি। Profit clear!", likes: 46, isLiked: false, isVerified: true },
  { id: "default-41", name: "Faruk H.", rating: 5, text: "Optical shop এ prescription save করে রাখি। Customer আবার আসলে history দেখি।", likes: 29, isLiked: false, isVerified: true },
  { id: "default-42", name: "Mili N.", rating: 5, text: "Pet shop চালাই। Pet food expiry আর stock alert অনেক কাজের! 🐕", likes: 36, isLiked: false, isVerified: true },
  { id: "default-43", name: "Hanif M.", rating: 5, text: "Book shop এ ISBN দিয়ে search করতে পারি। Inventory management এখন professional!", likes: 23, isLiked: false, isVerified: true },
  { id: "default-44", name: "Poly S.", rating: 5, text: "Makeup artist হিসেবে booking আর payment track করি। Client management এখন easy!", likes: 42, isLiked: false, isVerified: true },
  { id: "default-45", name: "Jewel A.", rating: 5, text: "Gym supplements বিক্রি করি। Batch-wise expiry track করা এখন simple!", likes: 31, isLiked: false, isVerified: true },
  { id: "default-46", name: "Kakoli R.", rating: 5, text: "Photography studio তে package-wise billing করি। Album delivery tracking ও আছে!", likes: 34, isLiked: false, isVerified: true },
  { id: "default-47", name: "Shafiq K.", rating: 5, text: "Toy store এ age-wise product categorize করেছি। Parents easily পছন্দ করতে পারে।", likes: 26, isLiked: false, isVerified: true },
  { id: "default-48", name: "Rumana B.", rating: 5, text: "Organic products বিক্রি করি। Source আর certification track করি। Customers trust বেশি!", likes: 39, isLiked: false, isVerified: true },
  { id: "default-49", name: "Manik H.", rating: 5, text: "Spare parts business এ compatibility track করা important। Vehicle model দিলেই parts দেখায়।", likes: 24, isLiked: false, isVerified: true },
  { id: "default-50", name: "Dipa S.", rating: 5, text: "Dance class এ student attendance আর fee track করি। Monthly report পাই automatically!", likes: 37, isLiked: false, isVerified: true },
  { id: "default-51", name: "Asad M.", rating: 5, text: "AC repair service দিই। Service history আর parts used সব track করি। Professional service!", likes: 28, isLiked: false, isVerified: true },
  { id: "default-52", name: "Liza K.", rating: 5, text: "Perfume shop এ sample tracking feature use করি। Customers try করতে পারে আগে!", likes: 41, isLiked: false, isVerified: true },
  { id: "default-53", name: "Rubel A.", rating: 5, text: "Solar panel business এ installation tracking করি। Warranty আর maintenance record রাখি।", likes: 32, isLiked: false, isVerified: true },
  { id: "default-54", name: "Shirin N.", rating: 5, text: "Mehndi artist হিসেবে design portfolio আর booking manage করি। Very organized!", likes: 44, isLiked: false, isVerified: true },
  { id: "default-55", name: "Kabir H.", rating: 5, text: "Sports goods shop এ team orders handle করি। Bulk discount calculate হয়ে যায়!", likes: 25, isLiked: false, isVerified: true },
  { id: "default-56", name: "Ratna S.", rating: 5, text: "Interior decoration business এ project-wise costing করি। Material আর labor সব track!", likes: 38, isLiked: false, isVerified: true },
  { id: "default-57", name: "Sajib K.", rating: 5, text: "Motorcycle showroom এ EMI calculation আর tracking করি। Customer financing easy!", likes: 30, isLiked: false, isVerified: true },
  { id: "default-58", name: "Munni R.", rating: 5, text: "Music class এ student progress track করি। Practice schedule আর fee সব organized!", likes: 35, isLiked: false, isVerified: true },
  { id: "default-59", name: "Taher M.", rating: 5, text: "Paint shop এ color mixing formula save করি। Repeat order এ exact color match!", likes: 27, isLiked: false, isVerified: true },
  { id: "default-60", name: "Farzana B.", rating: 5, text: "Event planning business এ vendor আর budget track করি। Client satisfaction বেড়েছে!", likes: 43, isLiked: false, isVerified: true },
  { id: "default-61", name: "Nazrul H.", rating: 5, text: "Fertilizer shop এ seasonal demand predict করতে পারি। Stock ready রাখি আগেই!", likes: 22, isLiked: false, isVerified: true },
  { id: "default-62", name: "Champa K.", rating: 5, text: "Pottery business এ custom order আর delivery date track করি। কোন order miss হয় না!", likes: 36, isLiked: false, isVerified: true },
  { id: "default-63", name: "Dulal S.", rating: 5, text: "Fishing equipment shop এ warranty track করি। Brand-wise stock ও maintain করি।", likes: 24, isLiked: false, isVerified: true },
  { id: "default-64", name: "Josna A.", rating: 5, text: "Candle making business এ raw material আর production cost track করি। Handmade with love! 🕯️", likes: 40, isLiked: false, isVerified: true },
  { id: "default-65", name: "Milon R.", rating: 5, text: "Leather goods shop এ custom order manage করি। Design approval থেকে delivery সব track!", likes: 33, isLiked: false, isVerified: true },
  { id: "default-66", name: "Lovely S.", rating: 5, text: "Yoga studio তে class schedule আর membership manage করি। Students নিজেই book করতে পারে!", likes: 45, isLiked: false, isVerified: true },
  { id: "default-67", name: "Badal K.", rating: 5, text: "Cement dealer হিসেবে bulk order আর delivery schedule track করি। Big business এর জন্য must!", likes: 29, isLiked: false, isVerified: true },
  { id: "default-68", name: "Rina B.", rating: 5, text: "Silk saree business এ exclusive pieces track করি। Each saree এর story customer কে বলি!", likes: 42, isLiked: false, isVerified: true },
  { id: "default-69", name: "Salam H.", rating: 5, text: "Security services দিই। Guard duty roster আর client billing সব manage করি।", likes: 26, isLiked: false, isVerified: true },
  { id: "default-70", name: "Pinky N.", rating: 5, text: "Craft workshop এ material আর student projects track করি। Creative business made easy!", likes: 38, isLiked: false, isVerified: true },
  { id: "default-71", name: "Harun M.", rating: 5, text: "Tile showroom এ room-wise calculation করি। Customer exact quantity জানতে পারে!", likes: 31, isLiked: false, isVerified: true },
  { id: "default-72", name: "Mina S.", rating: 5, text: "Embroidery business এ design catalog আর order track করি। Traditional craft, modern management!", likes: 47, isLiked: false, isVerified: true },
  { id: "default-73", name: "Kadir A.", rating: 5, text: "Water purifier business এ service schedule track করি। AMC renewal reminder পাই!", likes: 25, isLiked: false, isVerified: true },
  { id: "default-74", name: "Shanta K.", rating: 5, text: "Chocolate making business এ ingredient আর batch track করি। Fresh quality maintain! 🍫", likes: 44, isLiked: false, isVerified: true },
  { id: "default-75", name: "Firoz R.", rating: 5, text: "Plumbing service দিই। Job booking আর material cost track করি। Professional billing!", likes: 28, isLiked: false, isVerified: true },
  { id: "default-76", name: "Moury B.", rating: 5, text: "Pickle business এ batch production আর expiry track করি। Homemade goodness! 🥒", likes: 39, isLiked: false, isVerified: true },
  { id: "default-77", name: "Shahin H.", rating: 5, text: "Music instrument shop এ brand আর warranty track করি। Musicians love our service!", likes: 32, isLiked: false, isVerified: true },
  { id: "default-78", name: "Jhuma S.", rating: 5, text: "Art supplies shop এ student discount আর bulk order manage করি। Creative community support!", likes: 36, isLiked: false, isVerified: true },
  { id: "default-79", name: "Abul K.", rating: 5, text: "Rice wholesaler হিসেবে variety আর quality grade track করি। Agricultural business এ perfect!", likes: 23, isLiked: false, isVerified: true },
  { id: "default-80", name: "Tuli A.", rating: 5, text: "Dried flower business এ seasonal stock আর custom arrangement track করি। Nature's beauty! 🌺", likes: 41, isLiked: false, isVerified: true },
  { id: "default-81", name: "Raju M.", rating: 5, text: "Pest control service দিই। Treatment schedule আর warranty track করি। Customer followup easy!", likes: 27, isLiked: false, isVerified: true },
  { id: "default-82", name: "Keya N.", rating: 5, text: "Baking class এ recipe, student progress আর certification track করি। Sweet success! 🎂", likes: 48, isLiked: false, isVerified: true },
  { id: "default-83", name: "Motin H.", rating: 5, text: "Glass shop এ custom cutting আর installation track করি। Measurement save করে রাখি!", likes: 24, isLiked: false, isVerified: true },
  { id: "default-84", name: "Sonali S.", rating: 5, text: "Handloom saree business এ weaver আর stock track করি। Traditional art preserve করছি!", likes: 43, isLiked: false, isVerified: true },
  { id: "default-85", name: "Jamal K.", rating: 5, text: "Electric motor repair এ service history আর parts track করি। Industrial clients trust us!", likes: 30, isLiked: false, isVerified: true },
  { id: "default-86", name: "Alo R.", rating: 5, text: "Spice business এ blend recipe আর batch track করি। Authentic taste guarantee! 🌶️", likes: 37, isLiked: false, isVerified: true },
  { id: "default-87", name: "Zahid A.", rating: 5, text: "CCTV installation service দিই। Site survey থেকে warranty সব track করি। Security first!", likes: 29, isLiked: false, isVerified: true },
  { id: "default-88", name: "Nila B.", rating: 5, text: "Terracotta art business এ custom order আর shipping track করি। Handcrafted with care!", likes: 40, isLiked: false, isVerified: true },
  { id: "default-89", name: "Kalam H.", rating: 5, text: "Poultry farm এ daily production আর feed cost track করি। Farming made smart! 🐔", likes: 26, isLiked: false, isVerified: true },
  { id: "default-90", name: "Shapna S.", rating: 5, text: "Bag manufacturing এ raw material আর production batch track করি। Quality control easy!", likes: 35, isLiked: false, isVerified: true },
  { id: "default-91", name: "Omar K.", rating: 5, text: "Courier service দিই। Parcel tracking আর delivery confirmation সব automated!", likes: 33, isLiked: false, isVerified: true },
  { id: "default-92", name: "Mukta A.", rating: 5, text: "Soap making business এ ingredient আর curing time track করি। Natural products! 🧼", likes: 42, isLiked: false, isVerified: true },
  { id: "default-93", name: "Shamsul R.", rating: 5, text: "Welding workshop এ job card আর material cost track করি। Professional fabrication!", likes: 25, isLiked: false, isVerified: true },
  { id: "default-94", name: "Rubi N.", rating: 5, text: "Honey business এ source আর purity grade track করি। Pure and natural! 🍯", likes: 46, isLiked: false, isVerified: true },
  { id: "default-95", name: "Liton H.", rating: 5, text: "Signboard making এ design approval আর installation track করি। Creative advertising!", likes: 28, isLiked: false, isVerified: true },
  { id: "default-96", name: "Sathi S.", rating: 5, text: "Bamboo craft business এ artisan আর stock track করি। Eco-friendly products! 🎋", likes: 38, isLiked: false, isVerified: true },
  { id: "default-97", name: "Belal K.", rating: 5, text: "Dairy farm এ milk production আর distribution track করি। Fresh daily! 🥛", likes: 31, isLiked: false, isVerified: true },
  { id: "default-98", name: "Jharna A.", rating: 5, text: "Incense stick business এ fragrance আর batch track করি। Divine aroma! 🪔", likes: 39, isLiked: false, isVerified: true },
  { id: "default-99", name: "Mostafa R.", rating: 5, text: "Generator rental service দিই। Equipment আর billing cycle track করি। Power solutions!", likes: 27, isLiked: false, isVerified: true },
  { id: "default-100", name: "Bina B.", rating: 5, text: "Jute product business এ eco-friendly items আর export order track করি। Green business! 🌿", likes: 44, isLiked: false, isVerified: true },
  { id: "default-101", name: "Shaheen H.", rating: 5, text: "Car wash service এ membership আর service history track করি। Shiny cars! 🚗", likes: 32, isLiked: false, isVerified: true },
  { id: "default-102", name: "Dolly S.", rating: 5, text: "Dry cleaning business এ garment tracking আর delivery manage করি। Professional service!", likes: 36, isLiked: false, isVerified: true },
  { id: "default-103", name: "Younus K.", rating: 5, text: "Fish farm এ pond-wise production আর feed cost track করি। Aquaculture made easy! 🐟", likes: 29, isLiked: false, isVerified: true },
  { id: "default-104", name: "Lucky A.", rating: 5, text: "Balloon decoration business এ event booking আর package track করি। Party time! 🎈", likes: 45, isLiked: false, isVerified: true },
  { id: "default-105", name: "Mizan R.", rating: 5, text: "Roof repair service দিই। Site inspection আর material cost track করি। Quality work!", likes: 26, isLiked: false, isVerified: true },
];

// Check if user has a paid plan (not trial or none)
const isPaidPlan = (plan: string | undefined): boolean => {
  if (!plan) return false;
  return ['starter', 'professional', 'business', 'lifetime'].includes(plan);
};

const BenefitsSection = memo(() => {
  const { settings } = useSiteSettings();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>(defaultReviews);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newReview, setNewReview] = useState({ text: "", rating: 5 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const reviewsPerPage = 5;
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const reviewsContainerRef = useRef<HTMLDivElement>(null);

  // Fetch reviews from database
  const fetchReviews = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (data && data.length > 0) {
        const dbReviews: Review[] = data.map(r => ({
          id: r.id,
          name: r.name,
          rating: r.rating,
          text: r.comment,
          likes: r.likes_count || 0,
          isLiked: likedReviews.has(r.id),
          isVerified: r.is_verified || false,
        }));
        setReviews([...dbReviews, ...defaultReviews]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  }, [likedReviews]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleLike = async (reviewId: string) => {
    // Only allow like for logged-in users
    if (!user) {
      toast({ 
        title: "Login Required", 
        description: "Please login to like reviews", 
        variant: "destructive" 
      });
      return;
    }

    // For demo reviews, just update local state (no API call)
    if (reviewId.startsWith('default-')) {
      const isCurrentlyLiked = likedReviews.has(reviewId);
      const newLikedReviews = new Set(likedReviews);
      
      if (isCurrentlyLiked) {
        newLikedReviews.delete(reviewId);
      } else {
        newLikedReviews.add(reviewId);
      }
      setLikedReviews(newLikedReviews);

      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId
            ? { 
                ...review, 
                likes: isCurrentlyLiked ? Math.max(0, review.likes - 1) : review.likes + 1, 
                isLiked: !isCurrentlyLiked 
              }
            : review
        )
      );
      return;
    }

    // Toggle local state
    const isCurrentlyLiked = likedReviews.has(reviewId);
    const newLikedReviews = new Set(likedReviews);
    
    if (isCurrentlyLiked) {
      newLikedReviews.delete(reviewId);
    } else {
      newLikedReviews.add(reviewId);
    }
    setLikedReviews(newLikedReviews);

    // Optimistically update local UI
    setReviews((prev) =>
      prev.map((review) =>
        review.id === reviewId
          ? { 
              ...review, 
              likes: isCurrentlyLiked ? Math.max(0, review.likes - 1) : review.likes + 1, 
              isLiked: !isCurrentlyLiked 
            }
          : review
      )
    );

    // Update via edge function
    try {
      const result = await likeReview(reviewId, isCurrentlyLiked);
      if (!result.success) {
        // Revert on error
        setLikedReviews(likedReviews);
        setReviews((prev) =>
          prev.map((review) =>
            review.id === reviewId
              ? { ...review, likes: result.likes_count || review.likes, isLiked: isCurrentlyLiked }
              : review
          )
        );
      }
    } catch (error) {
      console.error('Error updating like:', error);
      // Revert on error
      setLikedReviews(likedReviews);
    }
  };

  const handleAddReview = async () => {
    if (!user) {
      toast({ 
        title: "Login Required", 
        description: "Please login to add a review", 
        variant: "destructive" 
      });
      return;
    }

    if (!newReview.text.trim()) {
      toast({ 
        title: "Error", 
        description: "Please write your review", 
        variant: "destructive" 
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if user has paid plan for verified status
      const isVerified = isPaidPlan(user.subscriptionPlan);
      
      // Use edge function instead of direct Supabase call
      const result = await createReview(newReview.rating, newReview.text.trim());
      
      if (!result.review) {
        throw new Error('Failed to create review');
      }

      // Add to local state
      const review: Review = {
        id: result.review.id,
        name: result.review.name,
        rating: result.review.rating,
        text: result.review.comment,
        likes: 0,
        isLiked: false,
        isVerified: result.review.is_verified || isVerified,
      };

      setReviews((prev) => [review, ...prev]);
      setNewReview({ text: "", rating: 5 });
      setIsDialogOpen(false);
      toast({ 
        title: "Thank you!", 
        description: isVerified 
          ? "Your verified review has been added." 
          : "Your review has been added. Upgrade to a paid plan to get verified badge!" 
      });
    } catch (error) {
      console.error('Error adding review:', error);
      toast({ 
        title: "Error", 
        description: "Failed to add review. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-10 lg:py-14 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-10"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium mb-4">
            Real Results
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Why Thousands of Businesses{" "}
            <span className="gradient-text">Choose {settings.company_name}</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Join the revolution - automate online sales AND manage offline shops from one platform.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <TiltCard key={benefit.label} className="h-full" tiltAmount={8}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="relative text-center p-6 bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 h-full"
              >
                <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center`}>
                  <benefit.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="text-4xl md:text-5xl font-extrabold gradient-text mb-2">
                  <Counter from={0} to={benefit.value} suffix={benefit.suffix} prefix={benefit.prefix} />
                </div>
                <h3 className="text-xl font-bold mb-2">{benefit.label}</h3>
                <p className="text-muted-foreground text-sm">{benefit.description}</p>
              </motion.div>
            </TiltCard>
          ))}
        </div>

        {/* Social Proof Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 px-6 py-4 rounded-2xl bg-card/80 border border-border/50 shadow-lg">
            <div className="text-left">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex items-center gap-0.5 text-amber-500">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <span className="text-lg font-bold">4.9/5</span>
                <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">500+ active sellers</strong> trust {settings.company_name} daily
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success/10 border border-success/20">
              <ShieldCheck className="w-5 h-5 text-success" />
              <div className="text-left">
                <p className="text-xs font-semibold text-success flex items-center gap-1">
                  Verified <BadgeCheck className="w-3.5 h-3.5" />
                </p>
                <p className="text-[10px] text-muted-foreground">Secure & Trusted</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Customer Reviews */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 max-w-4xl mx-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Customer Reviews</h3>
            
            {user ? (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Review
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Write a Review</DialogTitle>
                    <DialogDescription>
                      Share your experience with {settings.company_name}
                      {!isPaidPlan(user.subscriptionPlan) && (
                        <span className="block mt-1 text-amber-500 text-xs">
                          Upgrade to a paid plan to get "Verified User" badge
                        </span>
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Your Name</label>
                      <p className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                        {user.name || user.email.split('@')[0]}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewReview({ ...newReview, rating: star })}
                            className="hover:scale-110 transition-transform"
                          >
                            <Star className={`w-6 h-6 ${star <= newReview.rating ? "text-amber-500 fill-current" : "text-muted-foreground"}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Your Review</label>
                      <Textarea
                        placeholder="Share your experience..."
                        value={newReview.text}
                        onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
                        rows={4}
                        maxLength={500}
                      />
                    </div>
                    <Button 
                      onClick={handleAddReview} 
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Submitting..." : "Submit Review"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm" className="gap-2">
                  <LogIn className="w-4 h-4" />
                  Login to Review
                </Button>
              </Link>
            )}
          </div>
          
          {/* Reviews Carousel */}
          <div className="relative" ref={reviewsContainerRef}>
            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Showing {currentPage * reviewsPerPage + 1}-{Math.min((currentPage + 1) * reviewsPerPage, reviews.length)} of {reviews.length} reviews
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                  {currentPage + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="h-8 w-8"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Reviews Grid */}
            <motion.div 
              key={currentPage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {reviews
                .slice(currentPage * reviewsPerPage, (currentPage + 1) * reviewsPerPage)
                .map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card/80 border border-border/50 rounded-xl p-5 hover:border-primary/20 transition-colors"
                >
                  <div className="flex gap-0.5 text-amber-500 mb-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className={`w-4 h-4 ${i <= review.rating ? "fill-current" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium">{review.name}</span>
                    {review.isVerified && (
                      <span className="inline-flex items-center gap-1 text-xs text-success">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        Verified User
                      </span>
                    )}
                  </div>
                  <p className="text-sm mb-3">{review.text}</p>
                  <button
                    onClick={() => handleLike(review.id)}
                    className={`flex items-center gap-1.5 transition-colors ${review.isLiked ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${review.isLiked ? "fill-current" : ""}`} />
                    <span className="text-xs font-medium">{review.likes}</span>
                  </button>
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination Dots */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => {
                  // Show dots around current page
                  const pageIndex = totalPages <= 10 
                    ? i 
                    : Math.max(0, Math.min(currentPage - 4, totalPages - 10)) + i;
                  
                  return (
                    <button
                      key={pageIndex}
                      onClick={() => setCurrentPage(pageIndex)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        currentPage === pageIndex 
                          ? 'bg-primary w-6' 
                          : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                      }`}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
});

BenefitsSection.displayName = "BenefitsSection";

export default BenefitsSection;