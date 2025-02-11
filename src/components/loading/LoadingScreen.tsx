
export const LoadingScreen = () => {
  return (
    <div className="loading-screen fixed inset-0 flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="content bg-white/90 dark:bg-gray-800/90 p-6 rounded-lg shadow-lg backdrop-blur-sm w-[90%] max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Gestor de clientes</h1>
        <img 
          src="https://i.imgur.com/YvEDrAv.png" 
          alt="Gleztin Marketing Digital" 
          className="w-24 h-24 mx-auto object-contain animate-pulse"
        />
        <div className="progress-bar mt-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-2 bg-blue-500 dark:bg-blue-400 animate-progress" />
        </div>
        <div className="copyright mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
          Cargando...
        </div>
      </div>
    </div>
  );
};
