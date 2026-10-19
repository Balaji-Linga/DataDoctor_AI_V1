import { motion, useReducedMotion } from 'framer-motion';
import { Upload, ArrowRight, Sparkles } from 'lucide-react';

export interface CTASectionProps {
  onUploadClick: () => void;
}

export default function CTASection({ onUploadClick }: CTASectionProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Background glow accent */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] pointer-events-none -z-10 blur-3xl opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(0, 212, 255, 0.5) 0%, rgba(65, 105, 225, 0.2) 50%, transparent 75%)',
        }}
      />

      {/* Glass Panel */}
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl p-8 sm:p-14 text-center backdrop-blur-2xl transition-all duration-300"
        style={{
          background: 'rgba(15, 17, 37, 0.75)',
          border: '1px solid rgba(0, 212, 255, 0.25)',
          boxShadow: '0 0 50px rgba(0, 212, 255, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Subtle decorative grid lines or radial highlight */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at center top, rgba(0, 212, 255, 0.15), transparent 70%)',
          }}
        />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-6 backdrop-blur-md"
          style={{
            background: 'rgba(0, 212, 255, 0.08)',
            border: '1px solid rgba(0, 212, 255, 0.25)',
            color: 'var(--accent-cyan)',
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Elevate Your Data Quality</span>
        </div>

        {/* Heading */}
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-5">
          Ready to diagnose your data?
        </h2>

        {/* Subtext */}
        <p
          className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10"
          style={{ color: '#94a3b8' }}
        >
          Experience autonomous quality profiling, intelligent anomaly remediation, and comprehensive statistical analysis for mission-critical datasets.
        </p>

        {/* Get Started Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={onUploadClick}
            className="w-full sm:w-auto px-9 py-4 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer group hover:scale-[1.03] active:scale-[0.98]"
            style={{
              background: 'var(--accent-cyan)',
              color: '#050510',
              boxShadow: '0 0 30px rgba(0, 212, 255, 0.45)',
            }}
          >
            <Upload className="w-5 h-5 transition-transform duration-300 group-hover:-translate-y-0.5" />
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>

        {/* Feature Highlights Pills */}
        <div
          className="mt-10 pt-6 border-t flex flex-wrap items-center justify-center gap-6 text-xs font-mono"
          style={{
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
        >
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]" />
            Instant In-Browser Diagnostics
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4169E1]" />
            Zero Configuration Required
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c9a961]" />
            Export Cleaned CSVs
          </span>
        </div>
      </motion.div>
    </section>
  );
}
