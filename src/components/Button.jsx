// Reusable Button component with Tailwind variants

const variants = {
  primary:
    'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-md hover:shadow-lg',
  secondary:
    'bg-white hover:bg-slate-50 active:bg-slate-100 text-blue-600 border border-blue-600 hover:border-blue-700',
  danger:
    'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-md hover:shadow-lg',
  ghost:
    'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-700',
  outline:
    'bg-transparent hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-slate-400',
  success:
    'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-md',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  fullWidth = false,
  icon: Icon,
  iconPosition = 'left',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold rounded-lg
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}
      `}
    >
      {Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
      {children}
      {Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
    </button>
  );
}
