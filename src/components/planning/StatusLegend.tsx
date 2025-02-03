interface StatusLegendProps {
  getStatusColor: (status: 'hacer' | 'no_hacer' | 'consultar') => string;
}

export const StatusLegend = ({ getStatusColor }: StatusLegendProps) => {
  return (
    <div className="flex gap-4 mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
      <div className="flex items-center gap-2">
        <div className={`w-4 h-4 rounded-full ${getStatusColor('hacer')}`} />
        <span>Hacer</span>
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-4 h-4 rounded-full ${getStatusColor('no_hacer')}`} />
        <span>No hacer</span>
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-4 h-4 rounded-full ${getStatusColor('consultar')}`} />
        <span>Consultar</span>
      </div>
    </div>
  );
};