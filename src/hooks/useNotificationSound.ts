import { useCallback, useRef, useEffect, useState } from "react";
import { fetchUserSettings } from "@/services/apiService";

// High-quality notification sound as base64-encoded WAV
const NOTIFICATION_SOUND_URL = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleAYMXKjhz7mHNB0YctHw3b9/LQ0IeM/24cuPPRQEj9H07cySRhoEhdrz6MaJQRUMjuL/5r+ISh8CgtXu57WFTyYEX9fr3qeFVjYNYeP65b6RYzkBSNXi1baYaEQEYeDw4ruVZUEGPczk276ZaT8ITd3t4r+daEcBWeDz48GlcE8IWuLw4r2ke04OYeP04r2gd1YBYNX33r2ZcE8NWd/258eleVUIStbw5cqffFoFWN7z5cOkhF8DWeDz48CifFwKR9nm4cKphlwNatf26cyogV8LSNX05sytjWQDYdzz5MOmhlkEWODy48Oqh14DVOR74sOrhVwOUuLy4r6lhlUOW9zs3r+qiV0NY+D36sGmiVYSXtzv5L6ogVcMYN/05cOriVoLZN/z5MKtil8Datfx5Mqrg2MBYdzz4seti14FWt/04sGujGQIbNrx5cOpiV4PYeHw4sOtiWQHb97z48CpjGEHYtzz5sOthGIIY+H16MOrhGcGYNrz5MSqg2gGXt7x6cGniGgDX9z06MGshGsMZd3w5cCriGYGbN7z6MGlhmYIYd3w6cCpi2MPYN326L+pi2kIWd/16MGqjGkFZd/16MKthGgJauHy48GthGcJY+P16cKvi2kGZeHy5sOrjWkGZOD16cKthGsGWt315cCtj2oGW972472qjGoGV+D147uujmgHX+D35bupiGMGYeH048OuhGcHWeD35r6qjGgLXuH26L6phmsJaODy6cOujWsHYOP16cCojWoGZuHy6cKtjGoHa+Hz5cCvj2kLY+P06b+sjWoFY+P05cCqjGsHWd/16L6tjWsKaN/z5b6sjmoLZd7z6L6ujWoIY9/06cGsjWkJaeH16b6sjmkJX+H16r+tjmoHZuDz5r+tjmgIaOL16b6ujWkIZuD16r+vjmkLaOH16cCxjmoJaeP06cCvjmkHZ+Lz58Cuj2gHaeLz6cCvjmgJaOLz58Guj2kIaePz6cCuj2gJaeL06b+ujmkGaOHz6L+uj2kIaePz6cCuj2gKaOH04cCvjmkJaOLz58Cvj2gJaOLz6cCvjmgHaOL16L+ujmkJaeLz58Cvj2gJaeHz58Cvj2gIaePz6cCvjmkIaOLz6b+vjmkIaePz6cCuj2gIaOL06cCvjmkHaOLz6L+vjmkIaePz6cCvjmgHaOLz58Cvj2gJaOLz6b+ujmkJaOLz6cCvjmgJaOLz58CvjmgIaePz58Cvjmg=";

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const settingsLoadedRef = useRef(false);
  const userInteractedRef = useRef(false);

  // Track user interaction for audio autoplay policy
  useEffect(() => {
    const handleInteraction = () => {
      userInteractedRef.current = true;
      // Pre-load audio after first interaction
      if (audioRef.current) {
        audioRef.current.load();
      }
    };

    // Listen to various user interaction events
    document.addEventListener("click", handleInteraction, { once: true });
    document.addEventListener("keydown", handleInteraction, { once: true });
    document.addEventListener("touchstart", handleInteraction, { once: true });

    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
    };
  }, []);

  // Load user preference from database
  useEffect(() => {
    const loadSoundPreference = async () => {
      const token = localStorage.getItem("autofloy_token");
      if (!token || settingsLoadedRef.current) return;
      
      try {
        const settings = await fetchUserSettings();
        if (settings) {
          setSoundEnabled(settings.sound_alerts);
          settingsLoadedRef.current = true;
          console.log("[Sound] Settings loaded, sound_alerts:", settings.sound_alerts);
        }
      } catch (error) {
        console.error("Failed to load sound settings:", error);
      }
    };
    
    loadSoundPreference();
  }, []);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    audioRef.current.volume = 0.6;
    audioRef.current.preload = "auto";
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playSound = useCallback(() => {
    if (!soundEnabled) {
      console.debug("[Sound] Sound is disabled, not playing");
      return;
    }
    
    if (!audioRef.current) {
      console.debug("[Sound] No audio element available");
      return;
    }

    // Reset and play
    audioRef.current.currentTime = 0;
    audioRef.current.play()
      .then(() => {
        console.log("[Sound] Notification sound played successfully");
      })
      .catch((error) => {
        // This usually happens when user hasn't interacted with the page yet
        console.debug("[Sound] Could not play notification sound:", error.message);
      });
  }, [soundEnabled]);

  const updateSoundEnabled = useCallback((enabled: boolean) => {
    console.log("[Sound] Updating sound enabled to:", enabled);
    setSoundEnabled(enabled);
    
    // Play a test sound when enabling
    if (enabled && audioRef.current && userInteractedRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Ignore errors on test play
      });
    }
  }, []);

  return {
    playSound,
    soundEnabled,
    updateSoundEnabled,
  };
}
