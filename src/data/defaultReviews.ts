// Default reviews data - loaded lazily
export interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  likes: number;
  isLiked: boolean;
  isVerified: boolean;
}

// Initial 20 reviews shown first for faster load
export const defaultReviews: Review[] = [
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
];