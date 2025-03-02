"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Podcast {
  id: number;
  name: string;
}

interface Citation {
  id: string;
  content: string;
  episode_title: string;
  podcast_name: string;
  speaker_name: string;
  start_time: number;
  end_time: number;
  audio_url: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}

export default function ChatPage() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [selectedPodcasts, setSelectedPodcasts] = useState<number[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch podcasts on component mount
  useEffect(() => {
    const fetchPodcasts = async () => {
      try {
        const response = await fetch("/api/podcasts");
        if (response.ok) {
          const data = await response.json();
          setPodcasts(data);
        }
      } catch (error) {
        console.error("Error fetching podcasts:", error);
      }
    };

    fetchPodcasts();
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle podcast selection
  const handlePodcastSelect = (id: number) => {
    setSelectedPodcasts((prev) => {
      if (prev.includes(id)) {
        return prev.filter((podcastId) => podcastId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);

    // Clear input
    setInput("");

    // Set loading state
    setIsLoading(true);

    try {
      // Get conversation history (last 10 messages)
      const conversationHistory = messages
        .slice(-10)
        .map((msg) => ({ role: msg.role, content: msg.content }));

      // Send query to API
      const response = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: userMessage.content,
          podcastIds: selectedPodcasts,
          conversationHistory,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Add assistant message with citations
        const assistantMessage: Message = {
          role: "assistant",
          content: data.answer,
          citations: data.citations,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Handle error
        const errorData = await response.json();

        const assistantMessage: Message = {
          role: "assistant",
          content: `Error: ${errorData.error || "Failed to get response"}`,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Error querying transcripts:", error);

      const assistantMessage: Message = {
        role: "assistant",
        content:
          "Sorry, there was an error processing your request. Please try again.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Format message content with citations
  const formatMessageContent = (content: string) => {
    // Replace citation numbers with spans
    return content.replace(/\[(\d+)\]/g, (match, number) => {
      return `<span class="inline-flex items-center justify-center bg-blue-100 text-blue-800 text-xs font-medium rounded-full px-2 py-0.5">${match}</span>`;
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Podcast Episode Answer Bot
          </h1>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            Home
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-md p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Select Podcasts</h2>

          {podcasts.length === 0 ? (
            <p className="text-gray-500">No podcasts available</p>
          ) : (
            <div className="space-y-2">
              {podcasts.map((podcast) => (
                <div key={podcast.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`podcast-${podcast.id}`}
                    checked={selectedPodcasts.includes(podcast.id)}
                    onChange={() => handlePodcastSelect(podcast.id)}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label
                    htmlFor={`podcast-${podcast.id}`}
                    className="ml-2 text-gray-700"
                  >
                    {podcast.name}
                  </label>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Options</h2>
            <Link
              href="/admin"
              className="block w-full text-center bg-gray-600 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-700 transition-colors"
            >
              Admin Panel
            </Link>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <p className="text-xl mb-2">
                    Ask a question about the selected podcasts
                  </p>
                  <p className="text-sm">
                    Select podcasts from the sidebar to get started
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-3xl rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-white shadow-md"
                    }`}
                  >
                    <div
                      className="prose"
                      dangerouslySetInnerHTML={{
                        __html: formatMessageContent(message.content),
                      }}
                    />

                    {message.citations && message.citations.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h3 className="text-sm font-semibold mb-2">
                          Citations
                        </h3>
                        <div className="space-y-2">
                          {message.citations.map((citation, citIndex) => (
                            <div
                              key={citation.id}
                              className="text-sm bg-gray-50 p-2 rounded"
                            >
                              <p className="font-semibold">
                                [{citIndex + 1}] {citation.podcast_name} -{" "}
                                {citation.episode_title}
                              </p>
                              <p className="text-gray-600 mb-1">
                                {citation.speaker_name} (
                                {formatTime(citation.start_time)} -{" "}
                                {formatTime(citation.end_time)})
                              </p>
                              <p className="text-gray-800 mb-2">
                                {citation.content}
                              </p>
                              <a
                                href={citation.audio_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                Listen to this segment
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about the podcasts..."
                className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading || selectedPodcasts.length === 0}
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                disabled={
                  isLoading || !input.trim() || selectedPodcasts.length === 0
                }
              >
                {isLoading ? "Thinking..." : "Send"}
              </button>
            </form>
            {selectedPodcasts.length === 0 && (
              <p className="mt-2 text-sm text-red-500">
                Please select at least one podcast to ask questions
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to format time
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
