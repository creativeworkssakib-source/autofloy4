import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import FAQSection from "@/components/landing/FAQSection";
import CTASection from "@/components/landing/CTASection";

// Smooth page entrance animation variants
const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
      staggerChildren: 0.15,
    },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: "easeOut" as const,
    },
  },
};

const Index = () => {
  return (
    <motion.div
      className="min-h-screen bg-background"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      <motion.div variants={sectionVariants}>
        <Header />
      </motion.div>
      <main>
        <motion.div variants={sectionVariants}>
          <HeroSection />
        </motion.div>
        <motion.div variants={sectionVariants}>
          <FeaturesSection />
        </motion.div>
        <motion.div variants={sectionVariants}>
          <BenefitsSection />
        </motion.div>
        <motion.div variants={sectionVariants}>
          <FAQSection />
        </motion.div>
        <motion.div variants={sectionVariants}>
          <CTASection />
        </motion.div>
      </main>
      <motion.div variants={sectionVariants}>
        <Footer />
      </motion.div>
    </motion.div>
  );
};

export default Index;
