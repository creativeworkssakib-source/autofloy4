import ShopLayout from "@/components/offline-shop/ShopLayout";
import { DailyCashRegister } from "@/components/offline-shop/DailyCashRegister";
import { useLanguage } from "@/contexts/LanguageContext";

const ShopCashRegister = () => {
  const { language } = useLanguage();

  return (
    <ShopLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {language === "bn" ? "দৈনিক ক্যাশ রেজিস্টার" : "Daily Cash Register"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {language === "bn" 
              ? "প্রতিদিন কত টাকা দিয়ে শপ খুলছেন এবং দিনশেষে কত টাকা নিয়ে যাচ্ছেন - সব ট্র্যাক করুন"
              : "Track how much cash you start with each day and how much you take home at closing"}
          </p>
        </div>

        <DailyCashRegister />
      </div>
    </ShopLayout>
  );
};

export default ShopCashRegister;