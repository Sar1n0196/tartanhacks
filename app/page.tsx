import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="container mx-auto px-4 py-16 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Onboarding Intelligence Agent
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Help engineers make user-centric decisions by building comprehensive context packs
            that connect technical work to business value
          </p>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Founder Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">For Founders</h2>
              <p className="text-gray-600 mb-6">
                Create a comprehensive context pack by combining automated web research with a structured interview.
                Help your engineers understand your vision, customers, and business priorities.
              </p>
            </div>
            <Link
              href="/builder"
              className="block w-full bg-blue-600 text-white text-center py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Build Context Pack
            </Link>
          </div>

          {/* Engineer Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="mb-4">
              <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">For Engineers</h2>
              <p className="text-gray-600 mb-6">
                Ask questions about the company through an intelligent chat interface.
                Understand customer needs, business impact, and engineering priorities without interrupting the team.
              </p>
            </div>
            <Link
              href="/onboard"
              className="block w-full bg-indigo-600 text-white text-center py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Start Onboarding Chat
            </Link>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                1
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Automated Scan</h3>
              <p className="text-sm text-gray-600">
                The system scrapes public web pages to extract company vision, mission, and business model
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                2
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Adaptive Interview</h3>
              <p className="text-sm text-gray-600">
                Founders answer 5-12 targeted questions to fill knowledge gaps and provide insider context
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                3
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Engineer Chat</h3>
              <p className="text-sm text-gray-600">
                New hires query the context pack to understand business value and make informed decisions
              </p>
            </div>
          </div>
        </div>

        {/* Demo Mode Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-amber-900 mb-2">Demo Mode Available</h3>
              <p className="text-amber-800 mb-2">
                Try the system without providing real company information or waiting for web scraping.
                Demo mode uses pre-populated data to showcase functionality instantly.
              </p>
              <p className="text-sm text-amber-700">
                Toggle demo mode in the builder to explore with example companies, or use live mode with your OpenAI API key for real data extraction.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-600 text-sm">
          <p>Built with Next.js, TypeScript, and OpenAI</p>
        </div>
      </main>
    </div>
  );
}
