import { motion, useReducedMotion } from 'framer-motion';
import { Upload, Search, Wand2, CheckCircle2 } from 'lucide-react';

interface TimelineStep {
  step: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  icon: typeof Upload;
  highlights: string[];
}

const steps: TimelineStep[] = [
  {
    step: '01',
    badge: 'INGESTION',
    title: 'Drop your CSV dataset',
    subtitle: 'Instant parsing & schema introspection',
    description:
      'Drag and drop any CSV or tabular file. DataDoctor automatically inspects column delimiters, infers initial types, and creates an instant live data preview in memory.',
    icon: Upload,
    highlights: ['Instant delimiter & encoding detection', 'Live schema preview', 'Zero data persistence'],
  },
  {
    step: '02',
    badge: 'DIAGNOSIS',
    title: 'Automated quality profiling',
    subtitle: 'Deep statistical anomaly detection',
    description:
      'Autonomous diagnostic engines calculate missing value density, compute variance boundaries, detect duplicate records, and grade dataset health across multiple quality dimensions.',
    icon: Search,
    highlights: ['Missing cell & null distribution', 'Duplicate row isolation', 'Feature statistical summaries'],
  },
  {
    step: '03',
    badge: 'TRANSFORMATION',
    title: 'Intelligent cleaning & export',
    subtitle: 'Curated recipes & auditable outputs',
    description:
      'Execute precision automated cleaning recipes—impute missing values with statistical heuristics, normalize anomalous entries, and download pristine datasets ready for ML pipelines.',
    icon: Wand2,
    highlights: ['Statistical mean/median imputation', 'Deterministic deduplication', 'Clean CSV export & audit log'],
  },
];

export default function HowItWorksSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-3xl mx-auto mb-20 sm:mb-28"
      >
        <span
          className="inline-block text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-4 backdrop-blur-md"
          style={{
            background: 'rgba(0, 212, 255, 0.08)',
            border: '1px solid rgba(0, 212, 255, 0.25)',
            color: 'var(--accent-cyan)',
          }}
        >
          Workflow
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
          How It Works
        </h2>
        <p className="text-base sm:text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Transform raw, inconsistent data into production-grade analytics assets in three seamless steps.
        </p>
      </motion.div>

      {/* Timeline Container */}
      <div className="relative max-w-5xl mx-auto">
        {/* Continuous Connecting Vertical Line: Cyan to Blue */}
        <div
          className="absolute left-6 md:left-1/2 top-8 bottom-8 w-0.5 -translate-x-1/2 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, #00d4ff 0%, #4169E1 60%, rgba(65, 105, 225, 0.1) 100%)',
            boxShadow: '0 0 12px rgba(0, 212, 255, 0.35)',
          }}
        />

        <div className="space-y-12 sm:space-y-16">
          {steps.map((item, index) => {
            const Icon = item.icon;
            const isEven = index % 2 === 1;

            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{
                  duration: shouldReduceMotion ? 0.01 : 0.6,
                  delay: shouldReduceMotion ? 0 : index * 0.12,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative flex items-center md:justify-between"
              >
                {/* Timeline Center Node Badge */}
                <div
                  className="absolute left-6 md:left-1/2 -translate-x-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center font-mono font-bold text-xs"
                  style={{
                    background: '#0a0a1a',
                    border: '2px solid var(--accent-cyan)',
                    color: 'var(--accent-cyan)',
                    boxShadow: '0 0 20px rgba(0, 212, 255, 0.4)',
                  }}
                >
                  {item.step}
                </div>

                {/* Content Panel: Left or Right on desktop, right-offset on mobile */}
                <div
                  className={`w-full ml-16 md:ml-0 md:w-[calc(50%-44px)] ${
                    isEven ? 'md:ml-auto' : 'md:mr-auto'
                  }`}
                >
                  <div
                    className="group relative rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1"
                    style={{
                      background: 'rgba(15, 17, 37, 0.65)',
                      border: '1px solid var(--border-subtle)',
                      backdropFilter: 'blur(16px)',
                    }}
                  >
                    {/* Hover Glow Edge */}
                    <div
                      className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        border: '1px solid rgba(0, 212, 255, 0.35)',
                        boxShadow: '0 10px 30px -5px rgba(0, 212, 255, 0.15)',
                      }}
                    />

                    {/* Step Badge & Icon */}
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                          background: 'rgba(0, 212, 255, 0.1)',
                          border: '1px solid rgba(0, 212, 255, 0.25)',
                          color: 'var(--accent-cyan)',
                        }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className="text-[11px] font-mono tracking-wider px-2.5 py-1 rounded-md"
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {item.badge}
                      </span>
                    </div>

                    {/* Title & Subtitle */}
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 group-hover:text-[#00d4ff] transition-colors">
                      {item.title}
                    </h3>
                    <p
                      className="text-xs font-mono mb-4"
                      style={{ color: 'var(--accent-cyan)' }}
                    >
                      {item.subtitle}
                    </p>

                    {/* Description */}
                    <p
                      className="text-sm leading-relaxed mb-6"
                      style={{ color: '#94a3b8' }}
                    >
                      {item.description}
                    </p>

                    {/* Highlights */}
                    <div className="space-y-2 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                      {item.highlights.map((h, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs" style={{ color: '#cbd5e1' }}>
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#00d4ff] shrink-0" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
