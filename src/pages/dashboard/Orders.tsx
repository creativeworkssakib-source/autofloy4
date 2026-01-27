import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AIOrdersSection from "@/components/dashboard/AIOrdersSection";

const Orders = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <AIOrdersSection />
      </div>
    </DashboardLayout>
  );
};

export default Orders;
