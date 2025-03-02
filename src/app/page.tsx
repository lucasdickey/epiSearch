import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="max-w-5xl w-full text-center">
        <h1 className="text-4xl font-bold mb-6 text-gray-800">
          Podcast Episode Answer Bot
        </h1>
        <p className="text-xl mb-12 text-gray-600">
          Ask questions about your favorite podcasts and get answers with
          citations and audio playback.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              Chat Interface
            </h2>
            <p className="text-gray-600 mb-6">
              Ask questions about podcast episodes and get answers with
              citations and links to specific moments.
            </p>
            <Link
              href="/chat"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Start Chatting
            </Link>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              Admin Panel
            </h2>
            <p className="text-gray-600 mb-6">
              Manage podcasts, episodes, and upload transcripts for indexing.
            </p>
            <Link
              href="/admin"
              className="inline-block bg-gray-600 text-white px-6 py-3 rounded-md font-medium hover:bg-gray-700 transition-colors"
            >
              Go to Admin
            </Link>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            How It Works
          </h2>
          <div className="text-left">
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>
                Upload podcast transcripts with speaker information and
                timestamps
              </li>
              <li>
                Our system processes and indexes the content for efficient
                retrieval
              </li>
              <li>Ask questions in natural language about podcast content</li>
              <li>
                Get comprehensive answers with citations to specific moments
              </li>
              <li>
                Listen to the exact audio segments referenced in the answers
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
