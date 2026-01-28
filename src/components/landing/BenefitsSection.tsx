import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import { useEffect, useRef, useState, memo, useCallback, forwardRef } from "react";
import { TrendingUp, Users, Clock, Wallet, Star, BadgeCheck, ThumbsUp, Plus, LogIn, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { createReview, likeReview } from "@/services/authService";
import { Link } from "react-router-dom";
import { defaultReviews, type Review } from "@/data/defaultReviews";

interface CounterProps {
  from: number;
  to: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
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
  { icon: TrendingUp, value: 100, suffix: "+", label: "Hours Saved/Month", description: "AI auto-reply + POS + inventory + reports - all automated, no manual work needed", gradient: "from-primary to-primary-glow" },
  { icon: Clock, value: 10, suffix: "x", label: "Faster Operations", description: "Instant AI responses, barcode scanning, one-click invoices - 10x faster than manual", gradient: "from-secondary to-primary" },
  { icon: Users, value: 24, suffix: "/7", label: "Non-Stop Business", description: "AI Sales Agent works 24/7 + Offline POS works without internet - never lose a sale", gradient: "from-accent to-secondary" },
  { icon: Wallet, value: 150000, prefix: "৳", suffix: "+", label: "Monthly Savings", description: "Replace 2 staff salaries: 1 for messages + 1 for shop accounting - AI does both", gradient: "from-success to-primary" },
];

const isPaidPlan = (plan?: string) => {
  return plan && ['starter', 'business', 'enterprise', 'lifetime'].includes(plan.toLowerCase());
};

const BenefitCard = memo(({ benefit, index }: { benefit: typeof benefits[0]; index: number }) => {
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.9 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="relative bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 text-center overflow-hidden group"
    >
      {/* Hover Effect */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      />
      
      {/* Shimmer */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden">
        <div className="absolute inset-0 animate-shimmer" />
      </div>
      
      {/* Icon */}
      <motion.div 
        className={`w-14 h-14 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mx-auto mb-4 relative z-10`}
        whileHover={{ rotate: 10, scale: 1.1 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <benefit.icon className="w-7 h-7 text-primary-foreground" />
      </motion.div>
      
      {/* Counter */}
      <motion.div 
        className="text-3xl lg:text-4xl font-bold mb-2 relative z-10"
        initial={{ scale: 0.5 }}
        animate={isInView ? { scale: 1 } : { scale: 0.5 }}
        transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
      >
        <Counter from={0} to={benefit.value} prefix={benefit.prefix} suffix={benefit.suffix} duration={2} />
      </motion.div>
      
      <h3 className="text-lg font-semibold mb-1 relative z-10">{benefit.label}</h3>
      <p className="text-sm text-muted-foreground relative z-10">{benefit.description}</p>
      
      {/* Border Glow */}
      <motion.div 
        className="absolute inset-0 rounded-2xl border-2 border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      />
    </motion.div>
  );
});

BenefitCard.displayName = "BenefitCard";

const BenefitsSection = forwardRef<HTMLElement, Record<string, never>>((_props, _ref) => {
  const { settings } = useSiteSettings();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>(defaultReviews);
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set());
  const [newReview, setNewReview] = useState({ text: "", rating: 5 });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const reviewsContainerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  
  const reviewsPerPage = 5;
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

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
    if (!user) {
      toast({ title: "Login Required", description: "Please login to like reviews", variant: "destructive" });
      return;
    }

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
          ? { ...review, likes: isCurrentlyLiked ? Math.max(0, review.likes - 1) : review.likes + 1, isLiked: !isCurrentlyLiked }
          : review
      )
    );

    if (!reviewId.startsWith('default-')) {
      try {
        const result = await likeReview(reviewId, isCurrentlyLiked);
        if (!result.success) {
          setLikedReviews(likedReviews);
        }
      } catch (error) {
        console.error('Error updating like:', error);
        setLikedReviews(likedReviews);
      }
    }
  };

  const handleAddReview = async () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login to add a review", variant: "destructive" });
      return;
    }

    if (!newReview.text.trim()) {
      toast({ title: "Error", description: "Please write your review", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const isVerified = isPaidPlan(user.subscriptionPlan);
      const result = await createReview(newReview.rating, newReview.text.trim());
      
      if (!result.review) throw new Error('Failed to create review');

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
      toast({ title: "Thank you!", description: isVerified ? "Your verified review has been added." : "Your review has been added." });
    } catch (error) {
      console.error('Error adding review:', error);
      toast({ title: "Error", description: "Failed to add review. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section ref={sectionRef} className="py-10 lg:py-14 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      <motion.div 
        className="absolute top-1/4 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
        animate={{ x: [0, 100, 0], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-1/4 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"
        animate={{ x: [0, -100, 0], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-10"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
        >
          <motion.span 
            className="inline-block px-4 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium mb-4"
            whileHover={{ scale: 1.05 }}
          >
            ✅ Real Results from Real Businesses
          </motion.span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Why Thousands of Businesses{" "}
            <span className="gradient-text">Choose {settings.company_name}</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            21+ features in one platform: AI Sales Agent handles Facebook messages, takes orders & negotiates prices 
            while Complete POS manages your shop inventory, sales, expenses & reports - even offline. 
            Save 100+ hours monthly and ৳1,50,000+ in staff costs.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <BenefitCard key={benefit.label} benefit={benefit} index={index} />
          ))}
        </div>

        {/* Reviews Section */}
        <motion.div 
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Star className="w-5 h-5 text-amber-500 fill-current" />
              </motion.div>
              Customer Reviews ({reviews.length}+)
            </h3>
            {user ? (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 group">
                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                    Add Review
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Write a Review</DialogTitle>
                    <DialogDescription>Share your experience with {settings.company_name}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <motion.button 
                            key={star} 
                            type="button" 
                            onClick={() => setNewReview({ ...newReview, rating: star })} 
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                          >
                            <Star className={`w-6 h-6 ${star <= newReview.rating ? "text-amber-500 fill-current" : "text-muted-foreground"}`} />
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Your Review</label>
                      <Textarea placeholder="Share your experience..." value={newReview.text} onChange={(e) => setNewReview({ ...newReview, text: e.target.value })} rows={4} maxLength={500} />
                    </div>
                    <Button onClick={handleAddReview} className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Submitting..." : "Submit Review"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm" className="gap-2 group">
                  <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  Login to Review
                </Button>
              </Link>
            )}
          </div>
          
          {/* Reviews Carousel */}
          <div className="relative" ref={reviewsContainerRef}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Showing {currentPage * reviewsPerPage + 1}-{Math.min((currentPage + 1) * reviewsPerPage, reviews.length)} of {reviews.length}
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))} 
                  disabled={currentPage === 0} 
                  className="h-8 w-8 hover:scale-105 transition-transform" 
                  aria-label="Previous reviews page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground min-w-[60px] text-center">{currentPage + 1} / {totalPages}</span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))} 
                  disabled={currentPage >= totalPages - 1} 
                  className="h-8 w-8 hover:scale-105 transition-transform" 
                  aria-label="Next reviews page"
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
              {reviews.slice(currentPage * reviewsPerPage, (currentPage + 1) * reviewsPerPage).map((review, index) => (
                <motion.div 
                  key={review.id} 
                  className="bg-card/80 border border-border/50 rounded-xl p-5 hover:border-primary/20 transition-all duration-300 hover:shadow-lg group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                >
                  <div className="flex gap-0.5 text-amber-500 mb-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className={`w-4 h-4 ${i <= review.rating ? "fill-current" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium">{review.name}</span>
                    {review.isVerified && (
                      <motion.span 
                        className="inline-flex items-center gap-1 text-xs text-success"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring" }}
                      >
                        <BadgeCheck className="w-3.5 h-3.5" />
                        Verified User
                      </motion.span>
                    )}
                  </div>
                  <p className="text-sm mb-3">{review.text}</p>
                  <motion.button 
                    onClick={() => handleLike(review.id)} 
                    className={`flex items-center gap-1.5 transition-colors ${review.isLiked ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ThumbsUp className={`w-4 h-4 ${review.isLiked ? "fill-current" : ""}`} />
                    <span className="text-xs font-medium">{review.likes}</span>
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
});

BenefitsSection.displayName = "BenefitsSection";

export default BenefitsSection;