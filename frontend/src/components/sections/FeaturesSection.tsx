import { motion, useReducedMotion } from 'framer-motion';
import { Shield, Sparkles, BarChart3, Microscope } from 'lucide-react';

interface FeatureCard {
  id: string;
  step: string;
  title: string;
  description: string;
  icon: typeof Shield;
  color: string;
}

const features: FeatureCard[] = [
  {
    id: 'quality',
    step: '01 / INTEGRITY',
    title: 'Quality Detection',
    description:
      'Real-time anomaly heuristics detect null densities, structural corruptions, schema mismatches, and duplicated records with pinpoint accuracy.',
    icon: Shield,
    color: '#00d4ff',
  },
  {
    id: 'cleaning',
    step: '02 / HEURISTICS',
    title: 'Smart Cleaning',
    description:
      'Context-aware automated imputations, statistical outlier treatment, whitespace normalization, and type casting without signal distortion.',
    icon: Sparkles,
    color: '#38bdf8',
  },
  {
    id: 'stats',
    step: '03 / METRICS',
    title: 'Statistical Analysis',
    description:
      'Comprehensive distribution modeling, parametric skewness, variance bounds, quantiles, and cross-feature correlation profiling.',
    icon: BarChart3,
    color: '#4169E1',
  },
  {
    id: 'profiling',
    step: '04 / DIAGNOSTICS',
    title: 'Deep Profiling',
    description:
      'Granular column-level diagnostics, unique cardinality tracking, categorical entropy, and automated health scores for every feature.',
    icon: Microscope,
    color: '#c9a961',
  },
];

export default function FeaturesSection() {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.12,
        delayChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 35 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.6,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  return (
    <section
      id="features"
      className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
    >
      {/* Subtle radial glow in background */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] pointer-events-none -z-10 blur-3xl opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(0, 212, 255, 0.4) 0%, transparent 70%)',
        }}
      />

      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
        className="text-center max-w-3xl mx-auto mb-16 sm:mb-20"
      >
        <span
          className="inline-block text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-4 backdrop-blur-md"
          style={{
            background: 'rgba(0, 212, 255, 0.08)',
            border: '1px solid rgba(0, 212, 255, 0.25)',
            color: 'var(--accent-cyan)',
          }}
        >
          Diagnostic Capabilities
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
          Intelligent Data Processing
        </h2>
        <p className="text-base sm:text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Autonomous intelligence designed to analyze, score, and remediate complex dataset vulnerabilities in seconds.
        </p>
      </motion.div>

      {/* Features Grid: 1 col mobile, 2 col tablet, 4 col desktop */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {features.map((feature) => {
          const IconComponent = feature.icon;
          return (
            <motion.div
              key={feature.id}
              variants={cardVariants}
              whileHover={shouldReduceMotion ? undefined : { y: -6 }}
              className="group relative rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300"
              style={{
                background: 'rgba(15, 17, 37, 0.6)',
                border: '1px solid var(--border-subtle)',
                backdropFilter: 'blur(16px)',
              }}
            >
              {/* Hover Glow Accent border */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  border: '1px solid rgba(0, 212, 255, 0.35)',
                  boxShadow: '0 12px 35px -8px rgba(0, 212, 255, 0.15)',
                }}
              />

              <div>
                {/* Header row: Icon & Step label */}
                <div className="flex items-center justify-between mb-6">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                    style={{
                      background: 'rgba(0, 212, 255, 0.08)',
                      border: '1px solid rgba(0, 212, 255, 0.25)',
                      color: feature.color,
                      boxShadow: '0 0 15px rgba(0, 212, 255, 0.15)',
                    }}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <span
                    className="text-[11px] font-mono tracking-wider"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {feature.step}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#00d4ff] transition-colors duration-200">
                  {feature.title}
                </h3>

                {/* Description */}
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: '#94a3b8' }}
                >
                  {feature.description}
                </p>
              </div>

              {/* Bottom Subtle Indicator */}
              <div
                className="mt-6 pt-4 border-t flex items-center justify-between text-xs font-mono"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                <span className="flex items-center gap-1.5" style={{ color: 'var(--accent-cyan)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]" />
                  Active
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
