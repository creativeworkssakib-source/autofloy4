import { useProductType } from "@/contexts/ProductTypeContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AIOrdersSection from "@/components/dashboard/AIOrdersSection";
import { DigitalSalesSection } from "@/components/dashboard/DigitalSalesSection";

const Orders = () => {
  const { isDigitalMode } = useProductType();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {isDigitalMode ? <DigitalSalesSection /> : <AIOrdersSection />}
      </div>
    </DashboardLayout>
  );
};

export default Orders;
