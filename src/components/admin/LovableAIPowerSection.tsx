import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Power, Sparkles, Loader2, Bot, Zap, CheckCircle, XCircle, Shield, Settings2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

type AIProvider = 'lovable' | 'openai' | 'google' | 'unknown';

interface LovableAIPowerSectionProps {
  isEnabled: boolean;
  apiKey: string;
  onToggle: (enabled: boolean) => Promise<void>;
  isLoading: boolean;
}

// Detect AI provider from API key format
function detectProvider(apiKey: string): AIProvider {
  if (!apiKey || apiKey.trim().length < 10) return 'lovable';
  const key = apiKey.trim();
  if (key.startsWith('AIza')) return 'google';
  if (key.startsWith('sk-')) return 'openai';
  return 'unknown';
}

const providerInfo: Record<AIProvider, { name: string; color: string; bgColor: string }> = {
  lovable: { name: 'Lovable AI', color: 'text-primary', bgColor: 'bg-primary/10' },
  openai: { name: 'OpenAI', color: 'text-green-600', bgColor: 'bg-green-500/10' },
  google: { name: 'Google AI (Gemini)', color: 'text-blue-600', bgColor: 'bg-blue-500/10' },
  unknown: { name: 'Custom AI', color: 'text-orange-600', bgColor: 'bg-orange-500/10' },
};

const LovableAIPowerSection = ({ 
  isEnabled, 
  apiKey, 
  onToggle, 
  isLoading 
}: LovableAIPowerSectionProps) => {
  const [isToggling, setIsToggling] = useState(false);
  const provider = detectProvider(apiKey);
  const hasCustomKey = apiKey && apiKey.trim().length > 10;

  const handleToggle = async (checked: boolean) => {
    setIsToggling(true);
    try {
      await onToggle(checked);
    } finally {
      setIsToggling(false);
    }
  };

  const features = [
    { icon: Bot, label: 'AI Comment Replies', description: 'Auto-reply to Facebook comments' },
    { icon: Zap, label: 'Messenger Automation', description: 'Handle inbox messages with AI' },
    { icon: Shield, label: 'Order Processing', description: 'Take orders via AI conversations' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-6"
    >
      {/* Premium Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-2xl blur-xl opacity-50" />
      
      <Card className="relative border-2 border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
              backgroundSize: '24px 24px'
            }}
          />
        </div>

        {/* Status Indicator Bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 transition-all duration-500 ${
          isEnabled ? 'bg-gradient-to-r from-green-500 via-emerald-400 to-green-500' : 'bg-muted'
        }`}>
          {isEnabled && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </div>

        <CardHeader className="pb-4 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Animated Logo */}
              <motion.div 
                className={`relative p-4 rounded-2xl transition-all duration-300 ${
                  isEnabled 
                    ? 'bg-gradient-to-br from-primary/20 to-secondary/20 shadow-lg shadow-primary/20' 
                    : 'bg-muted/50'
                }`}
                animate={isEnabled ? { scale: [1, 1.02, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className={`w-8 h-8 transition-colors ${
                  isEnabled ? 'text-primary' : 'text-muted-foreground'
                }`} />
                {isEnabled && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-primary/50"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.div>

              <div>
                <CardTitle className="text-xl flex items-center gap-3">
                  AI Automation Power
                  <AnimatePresence mode="wait">
                    {isEnabled ? (
                      <motion.div
                        key="active"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                      >
                        <Badge className="bg-green-500/20 text-green-600 border-green-500/30 gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </Badge>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="inactive"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                      >
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="w-3 h-3" />
                          Inactive
                        </Badge>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardTitle>
                <CardDescription className="mt-1">
                  {isEnabled 
                    ? 'AI automation is running • All features enabled'
                    : 'Toggle to enable AI-powered automation across all platforms'
                  }
                </CardDescription>
              </div>
            </div>

            {/* Main Power Toggle */}
            <div className="flex items-center gap-4">
              {(isLoading || isToggling) && (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              )}
              <div className="flex items-center gap-3 p-2 rounded-xl bg-muted/30">
                <Label htmlFor="ai-power-toggle" className="text-sm font-medium cursor-pointer">
                  {isEnabled ? 'ON' : 'OFF'}
                </Label>
                <Switch
                  id="ai-power-toggle"
                  checked={isEnabled}
                  onCheckedChange={handleToggle}
                  disabled={isLoading || isToggling}
                  className={`scale-125 ${isEnabled ? 'data-[state=checked]:bg-green-500' : ''}`}
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl border transition-all duration-300 ${
                  isEnabled 
                    ? 'bg-green-500/5 border-green-500/20' 
                    : 'bg-muted/30 border-border/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    isEnabled ? 'bg-green-500/10' : 'bg-muted'
                  }`}>
                    <feature.icon className={`w-4 h-4 ${
                      isEnabled ? 'text-green-600' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${
                      isEnabled ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {feature.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Provider & Status Message */}
          <motion.div
            className={`p-4 rounded-xl border ${
              isEnabled 
                ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20' 
                : 'bg-muted/30 border-border/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  isEnabled ? 'bg-green-500/20' : 'bg-muted'
                }`}>
                  <Power className={`w-5 h-5 ${
                    isEnabled ? 'text-green-600' : 'text-muted-foreground'
                  }`} />
                </div>
                <div>
                  <p className={`text-sm font-medium ${
                    isEnabled ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'
                  }`}>
                    {isEnabled 
                      ? hasCustomKey 
                        ? `✓ Using ${providerInfo[provider].name}`
                        : '✓ Using Lovable AI Gateway (free tier included)'
                      : 'AI automation is currently disabled'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isEnabled 
                      ? 'AI will respond to comments, messages, and process orders automatically'
                      : 'Enable to start AI-powered automation for your Facebook pages'
                    }
                  </p>
                </div>
              </div>
              
              {isEnabled && hasCustomKey && (
                <Badge className={`${providerInfo[provider].bgColor} ${providerInfo[provider].color} border-0`}>
                  <Settings2 className="w-3 h-3 mr-1" />
                  {providerInfo[provider].name}
                </Badge>
              )}
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LovableAIPowerSection;
