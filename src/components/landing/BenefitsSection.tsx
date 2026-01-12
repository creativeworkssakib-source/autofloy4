import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef, useState, memo, useCallback } from "react";
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
  { icon: TrendingUp, value: 10, suffix: "x", label: "Faster Responses", description: "AI replies to customers instantly", gradient: "from-primary to-primary-glow" },
  { icon: Clock, value: 85, suffix: "%", label: "Time Saved", description: "Automate messages & shop tasks", gradient: "from-secondary to-primary" },
  { icon: Users, value: 24, suffix: "/7", label: "Always Available", description: "Online & offline business support", gradient: "from-accent to-secondary" },
  { icon: Wallet, value: 80000, prefix: "৳", suffix: "+", label: "Monthly Savings", description: "Staff, inventory & management costs saved", gradient: "from-success to-primary" },
];

const isPaidPlan = (plan?: string) => {
  return plan && ['starter', 'business', 'enterprise', 'lifetime'].includes(plan.toLowerCase());
};

const BenefitsSection = memo(() => {
  const { settings } = useSiteSettings();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>(defaultReviews);
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set());
  const [newReview, setNewReview] = useState({ text: "", rating: 5 });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const reviewsContainerRef = useRef<HTMLDivElement>(null);
  
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
    <section className="py-10 lg:py-14 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
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
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-12">
          {benefits.map((benefit) => (
            <div
              key={benefit.label}
              className="relative bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-colors text-center"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mx-auto mb-4`}>
                <benefit.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="text-3xl lg:text-4xl font-bold mb-2">
                <Counter from={0} to={benefit.value} prefix={benefit.prefix} suffix={benefit.suffix} duration={2} />
              </div>
              <h4 className="text-lg font-semibold mb-1">{benefit.label}</h4>
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* Reviews Section */}
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-current" />
              Customer Reviews ({reviews.length}+)
            </h3>
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
                    <DialogDescription>Share your experience with {settings.company_name}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star} 
                            type="button" 
                            onClick={() => setNewReview({ ...newReview, rating: star })} 
                            className="hover:scale-110 transition-transform"
                            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                          >
                            <Star className={`w-6 h-6 ${star <= newReview.rating ? "text-amber-500 fill-current" : "text-muted-foreground"}`} />
                          </button>
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
                <Button variant="outline" size="sm" className="gap-2">
                  <LogIn className="w-4 h-4" />
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
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))} disabled={currentPage === 0} className="h-8 w-8" aria-label="Previous reviews page">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground min-w-[60px] text-center">{currentPage + 1} / {totalPages}</span>
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))} disabled={currentPage >= totalPages - 1} className="h-8 w-8" aria-label="Next reviews page">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Reviews Grid */}
            <motion.div key={currentPage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-4">
              {reviews.slice(currentPage * reviewsPerPage, (currentPage + 1) * reviewsPerPage).map((review) => (
                <div key={review.id} className="bg-card/80 border border-border/50 rounded-xl p-5 hover:border-primary/20 transition-colors">
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
                  <button onClick={() => handleLike(review.id)} className={`flex items-center gap-1.5 transition-colors ${review.isLiked ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                    <ThumbsUp className={`w-4 h-4 ${review.isLiked ? "fill-current" : ""}`} />
                    <span className="text-xs font-medium">{review.likes}</span>
                  </button>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
});

BenefitsSection.displayName = "BenefitsSection";

export default BenefitsSection;