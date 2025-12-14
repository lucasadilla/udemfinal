import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function DebugPage() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [contentStatus, setContentStatus] = useState(null);
  const [articlesStatus, setArticlesStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function runDiagnostics() {
      const results = {
        health: null,
        content: null,
        articles: null,
      };

      // Test health endpoint
      try {
        const healthRes = await fetch('/api/health');
        const healthData = await healthRes.json();
        results.health = {
          status: healthRes.status,
          ok: healthRes.ok,
          data: healthData,
        };
      } catch (err) {
        results.health = {
          status: 'error',
          error: err.message,
        };
      }

      // Test content endpoint
      try {
        const contentRes = await fetch('/api/content');
        const contentData = await contentRes.json();
        results.content = {
          status: contentRes.status,
          ok: contentRes.ok,
          data: contentData,
          isEmpty: Object.keys(contentData || {}).length === 0,
        };
      } catch (err) {
        results.content = {
          status: 'error',
          error: err.message,
        };
      }

      // Test articles endpoint
      try {
        const articlesRes = await fetch('/api/articles');
        const articlesData = await articlesRes.json();
        results.articles = {
          status: articlesRes.status,
          ok: articlesRes.ok,
          data: articlesData,
          count: Array.isArray(articlesData) ? articlesData.length : 0,
          dbName: articlesRes.headers.get('X-Database-Name'),
          documentCount: articlesRes.headers.get('X-Document-Count'),
        };
      } catch (err) {
        results.articles = {
          status: 'error',
          error: err.message,
        };
      }

      setHealthStatus(results.health);
      setContentStatus(results.content);
      setArticlesStatus(results.articles);
      setLoading(false);
    }

    runDiagnostics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Running diagnostics...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Site Diagnostics</title>
      </Head>
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Site Diagnostics</h1>
          
          {/* Health Check */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Health Check{' '}
              <span className={`text-sm px-2 py-1 rounded ${
                healthStatus?.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {healthStatus?.ok ? 'OK' : 'FAILED'}
              </span>
            </h2>
            {healthStatus?.error ? (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-red-800 font-semibold">Error: {healthStatus.error}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p><strong>Status:</strong> {healthStatus?.data?.status || 'unknown'}</p>
                <p><strong>Database Connected:</strong> {healthStatus?.data?.database?.connected ? 'Yes' : 'No'}</p>
                {healthStatus?.data?.database?.databaseName && (
                  <p><strong>Database Name:</strong> <code className="bg-gray-100 px-1 rounded">{healthStatus.data.database.databaseName}</code></p>
                )}
                <p><strong>MongoDB URI Configured:</strong> {healthStatus?.data?.mongodbUri?.configured ? 'Yes' : 'No'}</p>
                <p><strong>MongoDB DB Name Configured:</strong> {healthStatus?.data?.mongodbDbName?.configured ? 'Yes' : 'No'}</p>
                <p><strong>Article Count in DB:</strong> {healthStatus?.data?.database?.articleCount ?? 'N/A'}</p>
                {healthStatus?.data?.database?.sampleArticleFields && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">Sample Article Fields</summary>
                    <p className="text-sm mt-1 text-gray-600">{healthStatus.data.database.sampleArticleFields.join(', ')}</p>
                  </details>
                )}
                {healthStatus?.data?.database?.error && (
                  <div className="bg-red-50 border border-red-200 rounded p-4 mt-2">
                    <p className="text-red-800"><strong>Database Error:</strong> {healthStatus.data.database.error.message}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content API */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Content API{' '}
              <span className={`text-sm px-2 py-1 rounded ${
                contentStatus?.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {contentStatus?.ok ? 'OK' : 'FAILED'}
              </span>
            </h2>
            {contentStatus?.error ? (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-red-800 font-semibold">Error: {contentStatus.error}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p><strong>Status Code:</strong> {contentStatus?.status}</p>
                <p><strong>Content Empty:</strong> {contentStatus?.isEmpty ? 'Yes (Warning: This might be why content isn\'t showing)' : 'No'}</p>
                {contentStatus?.data?.error && (
                  <div className="bg-red-50 border border-red-200 rounded p-4 mt-2">
                    <p className="text-red-800"><strong>Error:</strong> {contentStatus.data.error}</p>
                    <p className="text-red-600 text-sm mt-1">{contentStatus.data.message}</p>
                  </div>
                )}
                {!contentStatus?.isEmpty && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">View Content Data</summary>
                    <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto text-xs">
                      {JSON.stringify(contentStatus?.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>

          {/* Articles API */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Articles API{' '}
              <span className={`text-sm px-2 py-1 rounded ${
                articlesStatus?.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {articlesStatus?.ok ? 'OK' : 'FAILED'}
              </span>
            </h2>
            {articlesStatus?.error ? (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-red-800 font-semibold">Error: {articlesStatus.error}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p><strong>Status Code:</strong> {articlesStatus?.status}</p>
                <p><strong>Articles Returned:</strong> {articlesStatus?.count || 0}</p>
                {articlesStatus?.dbName && (
                  <p><strong>Database Name:</strong> <code className="bg-gray-100 px-1 rounded">{articlesStatus.dbName}</code></p>
                )}
                {articlesStatus?.documentCount !== null && (
                  <p><strong>Documents in Collection:</strong> {articlesStatus.documentCount || 0}</p>
                )}
                {articlesStatus?.documentCount > 0 && articlesStatus?.count === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mt-2">
                    <p className="text-yellow-800 font-semibold">Warning: Documents exist but none are being returned!</p>
                    <p className="text-yellow-700 text-sm mt-1">This usually means the document structure doesn't match what the code expects, or they're in a different database.</p>
                  </div>
                )}
                {articlesStatus?.data?.error && (
                  <div className="bg-red-50 border border-red-200 rounded p-4 mt-2">
                    <p className="text-red-800"><strong>Error:</strong> {articlesStatus.data.error}</p>
                    <p className="text-red-600 text-sm mt-1">{articlesStatus.data.message}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-900">Troubleshooting Steps</h2>
            <ul className="list-disc list-inside space-y-2 text-blue-800">
              <li>If Health Check shows database not connected, verify <code className="bg-blue-100 px-1 rounded">MONGODB_URI</code> is set in your deployment platform</li>
              <li>If Content API returns empty, the content document might not exist in your database</li>
              <li>If Articles API returns 0 articles, check if articles exist in your MongoDB collection</li>
              <li>Check your deployment platform's environment variables section</li>
              <li>Check server logs in your deployment platform for detailed error messages</li>
              <li>Verify your MongoDB Atlas IP whitelist allows connections from your hosting provider</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

