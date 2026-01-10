import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DemoVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Extract YouTube video ID from various URL formats
const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  
  // Handle youtu.be short links
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) {
    return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1`;
  }
  
  // Handle youtube.com/watch?v= links
  const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}?autoplay=1`;
  }
  
  // Handle youtube.com/embed/ links
  const embedMatch = url.match(/youtube\.com\/embed\/([^?&]+)/);
  if (embedMatch) {
    return `https://www.youtube.com/embed/${embedMatch[1]}?autoplay=1`;
  }
  
  return null;
};

const DemoVideoModal = ({ open, onOpenChange }: DemoVideoModalProps) => {
  const { settings } = useSiteSettings();
  
  const videoType = settings.demo_video_type || 'youtube';
  const youtubeUrl = settings.demo_video_youtube_url;
  const uploadedUrl = settings.demo_video_upload_url;
  
  const embedUrl = videoType === 'youtube' && youtubeUrl 
    ? getYouTubeEmbedUrl(youtubeUrl) 
    : null;
  
  const videoSrc = videoType === 'upload' ? uploadedUrl : embedUrl;
  
  if (!videoSrc) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] p-0 bg-black/95 border-border/50 overflow-hidden">
        <DialogTitle className="sr-only">Demo Video</DialogTitle>
        
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-50 text-white hover:bg-white/20"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-5 w-5" />
        </Button>
        
        <div className="relative w-full aspect-video">
          {videoType === 'youtube' && embedUrl ? (
            <iframe
              src={embedUrl}
              title="Demo Video"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : videoType === 'upload' && uploadedUrl ? (
            <video
              src={uploadedUrl}
              className="w-full h-full"
              controls
              autoPlay
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DemoVideoModal;
