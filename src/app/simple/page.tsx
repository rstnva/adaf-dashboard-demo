export default function SimpleDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        <h1 className="text-4xl font-bold mb-8">ADAF Dashboard Pro - Simple Version</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Markets Overview</h2>
            <p className="text-gray-600">Dashboard está funcionando correctamente.</p>
          </div>
          
          {/* Card 2 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">ETF Flows</h2>
            <p className="text-gray-600">Monitoreo de flujos de ETF en tiempo real.</p>
          </div>
          
          {/* Card 3 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibent mb-4">Risk Monitoring</h2>
            <p className="text-gray-600">Sistema de gestión de riesgos activo.</p>
          </div>
        </div>
        
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Sistema Funcionando</h3>
          <p className="text-blue-800">
            El dashboard básico está operativo. Los componentes avanzados pueden tener dependencias de Redis.
          </p>
        </div>
      </div>
    </div>
  );
}