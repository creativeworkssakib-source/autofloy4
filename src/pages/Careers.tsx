import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { Briefcase, MapPin, Clock, ArrowRight, Users, Zap, Heart, Coffee } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Careers = () => {
  const { settings } = useSiteSettings();

  const openPositions = [
    {
      id: 1,
      title: "Full Stack Developer",
      department: "Engineering",
      location: "Dhaka / Remote",
      type: "Full-time",
      description: "Build and maintain our React + Supabase platform. Experience with TypeScript and edge functions preferred."
    },
    {
      id: 2,
      title: "AI/ML Engineer",
      department: "AI Team",
      location: "Remote",
      type: "Full-time",
      description: "Improve our Bengali NLP models and image recognition systems. Experience with LLMs and computer vision required."
    },
    {
      id: 3,
      title: "Customer Success Manager (Bengali Speaking)",
      department: "Customer Success",
      location: "Dhaka",
      type: "Full-time",
      description: "Help our Bangladeshi customers succeed. Train them on using AutoFloy and gather feedback for product improvement."
    },
    {
      id: 4,
      title: "Product Designer",
      department: "Design",
      location: "Remote",
      type: "Full-time",
      description: "Design intuitive interfaces for our POS and automation tools. Experience with Figma and mobile-first design required."
    },
    {
      id: 5,
      title: "Sales Executive (Bangladesh)",
      department: "Sales",
      location: "Dhaka",
      type: "Full-time",
      description: "Reach out to potential customers, conduct demos, and help businesses adopt AutoFloy. Bengali fluency required."
    }
  ];

  const benefits = [
    { icon: Zap, text: "Competitive Salary" },
    { icon: MapPin, text: "Remote-First Culture" },
    { icon: Clock, text: "Flexible Hours" },
    { icon: Heart, text: "Health Benefits" },
    { icon: Coffee, text: "Learning Budget" },
    { icon: Users, text: "Team Events" },
  ];

  const whyJoinUs = [
    {
      title: "Build for Bangladesh",
      description: "Create tools specifically designed for Bangladeshi businesses. Your work directly impacts local entrepreneurs."
    },
    {
      title: "Cutting-Edge Tech",
      description: "Work with AI, NLP, and modern web technologies. We're always exploring new ways to solve problems."
    },
    {
      title: "Fast-Growing Startup",
      description: "Join early and grow with us. We're expanding quickly and offer real career advancement opportunities."
    },
    {
      title: "Great Team",
      description: "Work with passionate people who care about building great products and helping businesses succeed."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                Careers
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Join the <span className="gradient-text">AutoFloy Team</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Help us build the future of business automation for Bangladesh. We're looking for passionate people who want to make a real impact.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-12 px-4 border-b border-border">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.text}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="p-4 bg-muted/30 rounded-xl text-center"
                >
                  <benefit.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <span className="text-sm font-medium">{benefit.text}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Join Us */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold mb-4">Why Join {settings.company_name}?</h2>
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {whyJoinUs.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Open Positions */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold mb-4">Open Positions</h2>
              <p className="text-muted-foreground">Join our growing team</p>
            </motion.div>
            <div className="space-y-4">
              {openPositions.map((position, index) => (
                <motion.div
                  key={position.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="p-6 bg-card border border-border rounded-2xl hover:shadow-lg hover:border-primary/30 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{position.title}</h3>
                      <p className="text-muted-foreground text-sm mb-3">{position.description}</p>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                          <Briefcase className="w-4 h-4" />
                          {position.department}
                        </span>
                        <span className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                          <MapPin className="w-4 h-4" />
                          {position.location}
                        </span>
                        <span className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                          <Clock className="w-4 h-4" />
                          {position.type}
                        </span>
                      </div>
                    </div>
                    <Link 
                      to="/contact" 
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
                    >
                      Apply Now <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Don't see a fit */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold mb-4">Don't See a Perfect Fit?</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                We're always looking for talented people. Send us your resume and we'll keep you in mind for future opportunities. 
                We especially value candidates with experience in the Bangladeshi market.
              </p>
              <Link 
                to="/contact" 
                className="inline-flex items-center justify-center px-8 py-3 border border-primary text-primary rounded-lg font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Get in Touch
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Careers;
