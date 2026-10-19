import { motion, useReducedMotion } from 'framer-motion';
import { Upload, ChevronDown } from 'lucide-react';
import DataCoreScene from './DataCoreScene';

export interface HeroSectionProps {
  onUploadClick: () => void;
}

export default function HeroSection({ onUploadClick }: HeroSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  const scrollToFeatures = () => {
    const el = document.getElementById('features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.15,
        delayChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.7,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  return (
    <section className="relative min-h-screen w-full flex flex-col justify-between items-center overflow-hidden px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-8 sm:pb-12">
      {/* 3D Data Core Canvas as absolute background */}
      <div className="absolute inset-0 z-0">
        <DataCoreScene reducedMotion={shouldReduceMotion ?? false} />
      </div>

      {/* Atmospheric lighting gradient overlays for maximum contrast */}
      <div
        className="absolute inset-0 pointer-events-none z-1"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(0, 212, 255, 0.07) 0%, transparent 65%), linear-gradient(180deg, rgba(5,5,16,0.65) 0%, rgba(5,5,16,0.2) 40%, rgba(5,5,16,0.85) 85%, #050510 100%)',
        }}
      />

      {/* Foreground Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 flex-1 flex flex-col items-center justify-center text-center max-w-4xl mx-auto my-auto py-8 sm:py-12"
      >
        {/* Animated Badge */}
        <motion.div variants={itemVariants} className="mb-6 sm:mb-8">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase backdrop-blur-md transition-all duration-300"
            style={{
              background: 'rgba(0, 212, 255, 0.08)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              color: 'var(--accent-cyan)',
              boxShadow: '0 0 20px rgba(0, 212, 255, 0.2)',
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d4ff] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00d4ff]" />
            </span>
            <span>AI-POWERED DATA INTELLIGENCE</span>
          </div>
        </motion.div>

        {/* Large Bold Headline */}
        <motion.h1
          variants={itemVariants}
          className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-none text-white mb-6 select-none"
        >
          <span className="block">Data Doctor</span>
          <span
            className="block mt-1 sm:mt-2 bg-gradient-to-r from-[#00d4ff] via-[#60a5fa] to-[#4169E1] bg-clip-text text-transparent"
            style={{
              filter: 'drop-shadow(0 0 35px rgba(0, 212, 255, 0.35))',
            }}
          >
            AI
          </span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          variants={itemVariants}
          className="text-base sm:text-xl md:text-2xl max-w-2xl mx-auto font-normal leading-relaxed mb-8 sm:mb-10 text-balance"
          style={{ color: '#94a3b8' }}
        >
          Advanced dataset analysis, quality detection &amp; intelligent cleaning
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
        >
          {/* Primary Upload CTA */}
          <button
            type="button"
            onClick={onUploadClick}
            className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer group hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'var(--accent-cyan)',
              color: '#050510',
              boxShadow: '0 0 25px rgba(0, 212, 255, 0.45)',
            }}
          >
            <Upload className="w-5 h-5 transition-transform duration-300 group-hover:-translate-y-0.5" />
            <span>Upload Dataset</span>
          </button>

          {/* Secondary Explore Capabilities CTA */}
          <button
            type="button"
            onClick={scrollToFeatures}
            className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-xl font-medium text-sm sm:text-base text-white backdrop-blur-md transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer group hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <span>Explore Capabilities</span>
            <ChevronDown className="w-4 h-4 text-[#00d4ff] transition-transform duration-300 group-hover:translate-y-0.5" />
          </button>
        </motion.div>
      </motion.div>

      {/* Animated Scroll Indicator */}
      <motion.button
        type="button"
        onClick={scrollToFeatures}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="relative z-10 flex flex-col items-center gap-2 cursor-pointer group transition-colors pb-1 text-[#94a3b8] hover:text-[#00d4ff]"
        aria-label="Scroll to features"
      >
        <span
          className="text-xs uppercase tracking-widest font-mono transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          Scroll to explore
        </span>
        <motion.div
          animate={shouldReduceMotion ? undefined : { y: [0, 6, 0] }}
          transition={
            shouldReduceMotion
              ? undefined
              : { repeat: Infinity, duration: 1.8, ease: 'easeInOut' }
          }
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.button>
    </section>
  );
}
