'use client';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Test Page - ADAF Dashboard
        </h1>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-blue-900 mb-4">
            Dashboard Status Check
          </h2>
          <div className="space-y-2">
            <p className="text-blue-800">✅ Next.js Server Running</p>
            <p className="text-blue-800">✅ Tailwind CSS Working</p>
            <p className="text-blue-800">✅ React Components Loading</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-green-900 mb-2">Frontend Test</h3>
            <p className="text-green-800">
              Si puedes ver esta página, el frontend está funcionando correctamente.
            </p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-yellow-900 mb-2">API Test</h3>
            <button 
              onClick={() => fetch('/api/read/alerts').then(r => r.json()).then(console.log)}
              className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
            >
              Test API Call
            </button>
          </div>
        </div>

        <div className="mt-8">
          <a 
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            ← Volver al Dashboard Principal
          </a>
        </div>
      </div>
    </div>
  );
}