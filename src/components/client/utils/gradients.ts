const borderColors = [
  'border-blue-400/50 dark:border-blue-500/30',
  'border-purple-400/50 dark:border-purple-500/30',
  'border-pink-400/50 dark:border-pink-500/30',
  'border-indigo-400/50 dark:border-indigo-500/30',
  'border-cyan-400/50 dark:border-cyan-500/30',
  'border-emerald-400/50 dark:border-emerald-500/30',
];

export const getSubtleGradient = () => {
  return 'bg-white dark:bg-[#1a1f2c]/80 backdrop-blur-md';
};

export const getBorderColor = (index: number) => {
  return borderColors[index % borderColors.length];
};