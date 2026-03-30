import { motion } from 'framer-motion';

export function Button({ 
  children, 
  variant = 'primary', // primary, accent, outline, ghost, glass, danger
  size = 'md', // sm, md, lg, icon
  className = '', 
  loading = false,
  ...props 
}) {
  const variants = {
    primary: 'bg-primary text-white shadow-glow hover:brightness-110 active:scale-[0.98]',
    accent: 'bg-accent text-white shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:brightness-110 active:scale-[0.98]',
    outline: 'border border-primary/50 text-main hover:bg-primary/10 hover:border-primary',
    ghost: 'bg-transparent text-secondary hover:text-white hover:bg-white/5',
    glass: 'glass-heavy text-main hover:bg-white/10 hover:border-white/20 active:scale-[0.95]',
    danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs rounded-radius-md font-weight-semi tracking-wide',
    md: 'px-6 py-3 text-sm rounded-radius-md font-weight-bold tracking-wide',
    lg: 'px-8 py-4 text-base rounded-radius-lg font-weight-black tracking-tight',
    icon: 'p-3 rounded-full'
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ y: -2 }}
      className={`relative overflow-hidden inline-flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading}
      {...props}
    >
      {/* Dynamic Shine Overlay */}
      <span className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[150%] hover:translate-x-[150%] transition-transform duration-1000 pointer-events-none" />
      
      {loading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : children}
    </motion.button>
  );
}

export function Card({ children, className = '', padded = true, glass = true, hover = true }) {
  return (
    <motion.div 
      whileHover={hover ? { y: -4, transition: { duration: 0.4 } } : {}}
      className={`
        ${glass ? 'glass' : 'bg-surface border border-glass'} 
        rounded-radius-lg 
        ${padded ? 'p-space-lg' : ''} 
        ${hover ? 'hover:shadow-glow cursor-default' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}

export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && <label className="text-[10px] font-weight-bold uppercase text-muted tracking-widest px-1">{label}</label>}
      <div className="relative group">
        <input 
          className={`
            w-full bg-black/40 border border-glass rounded-radius-md px-5 py-4 text-sm
            focus:outline-none focus:border-primary/50 transition-all duration-300
            placeholder:text-muted/40 text-main font-weight-semi
            group-hover:border-white/20
            ${error ? 'border-red-500/50 focus:border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        <div className="absolute inset-0 rounded-radius-md pointer-events-none border border-transparent group-focus-within:border-primary/20 group-focus-within:shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all duration-500" />
      </div>
      {error && <motion.span initial={{opacity:0, y:-5}} animate={{opacity:1, y:0}} className="text-[10px] text-red-400 font-weight-semi mt-1 ml-1">{error}</motion.span>}
    </div>
  );
}

export function Badge({ children, variant = 'primary' }) {
  const colors = {
    primary: 'bg-primary/20 text-[#8b8df2] border-primary/30',
    accent: 'bg-accent/20 text-[#66f4ff] border-accent/30',
    success: 'bg-green-500/10 text-green-400 border-green-500/20'
  };
  return (
    <span className={`px-2.5 py-1 text-[10px] uppercase tracking-widest font-weight-bold rounded-radius-sm border shadow-sm ${colors[variant]}`}>
      {children}
    </span>
  );
}
