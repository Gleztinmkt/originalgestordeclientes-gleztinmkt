export const getSubtleGradient = () => {
  const gradients = [
    'linear-gradient(to right, #accbee 0%, #e7f0fd 100%)',
    'linear-gradient(to top, #e6e9f0 0%, #eef1f5 100%)',
    'linear-gradient(109.6deg, rgba(223,234,247,1) 11.2%, rgba(244,248,252,1) 91.1%)',
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
};