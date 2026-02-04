import { motion, useInView } from "framer-motion";
import { forwardRef, useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import { HelpCircle } from "lucide-react";

const FAQSection = forwardRef<HTMLElement, Record<string, never>>((_props, _ref) => {
  const { t } = useLanguage();
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const faqs = [
    { question: t("faq.q1"), answer: t("faq.a1") },
    { question: t("faq.q2"), answer: t("faq.a2") },
    { question: t("faq.q3"), answer: t("faq.a3") },
    { question: t("faq.q4"), answer: t("faq.a4") },
    { question: t("faq.q5"), answer: t("faq.a5") },
    { question: t("faq.q6"), answer: t("faq.a6") },
    { question: t("faq.q7"), answer: t("faq.a7") },
    { question: t("faq.q8"), answer: t("faq.a8") },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" as const }
    }
  };

  return (
    <section id="faq" ref={sectionRef} className="py-20 lg:py-28 relative overflow-hidden">
      {/* Premium Background */}
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, hsl(var(--muted) / 0.4) 20%, hsl(var(--muted) / 0.4) 80%, transparent 100%)'
        }}
      />
      
      {/* Animated Central Orb */}
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px]"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.15, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Premium Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <motion.span 
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-secondary/15 via-primary/10 to-secondary/15 text-secondary text-sm font-bold mb-6 border border-secondary/25 shadow-xl backdrop-blur-sm"
            whileHover={{ scale: 1.05, y: -2 }}
            style={{ boxShadow: '0 10px 40px -10px hsl(var(--secondary) / 0.3)' }}
          >
            <motion.div 
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-lg relative overflow-hidden"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-lg" />
              <HelpCircle className="w-4 h-4 text-white relative z-10" />
            </motion.div>
            {t("faq.badge")}
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
            {t("faq.title1")}{" "}
            <span className="text-gradient-premium">{t("faq.title2")}</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground">{t("faq.subtitle")}</p>
        </motion.div>

        {/* Premium Accordion */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div key={index} variants={itemVariants}>
                <AccordionItem
                  value={`item-${index}`}
                  className="bg-card/90 backdrop-blur-xl border border-border/40 rounded-2xl px-6 data-[state=open]:border-primary/40 data-[state=open]:shadow-xl transition-all duration-500 overflow-hidden group hover:border-primary/30 hover:shadow-lg"
                  style={{
                    boxShadow: '0 4px 20px -5px hsl(var(--foreground) / 0.05)'
                  }}
                >
                  <AccordionTrigger className="text-left font-semibold text-base hover:no-underline py-5 group-hover:text-primary transition-colors duration-300">
                    <span className="flex items-center gap-4">
                      <motion.span 
                        className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 via-secondary/15 to-primary/20 flex items-center justify-center text-primary text-sm font-bold border border-primary/25 shadow-lg relative overflow-hidden"
                        whileHover={{ scale: 1.15, rotate: 10 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-xl" />
                        <span className="relative z-10">{index + 1}</span>
                      </motion.span>
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base pb-5 pl-14 leading-relaxed">
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      {faq.answer}
                    </motion.div>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
});

FAQSection.displayName = "FAQSection";

export default FAQSection;