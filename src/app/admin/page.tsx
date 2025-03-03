"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Podcast {
  id: number;
  name: string;
  description?: string;
  url?: string;
}

interface Episode {
  id: number;
  podcast_id: number;
  title: string;
  description?: string;
  summary?: string;
  published_date?: string;
  url?: string;
}

export default function AdminPage() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [activeTab, setActiveTab] = useState<
    "podcasts" | "episodes" | "upload"
  >("podcasts");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Form states
  const [podcastForm, setPodcastForm] = useState<Omit<Podcast, "id">>({
    name: "",
    description: "",
    url: "",
  });

  const [episodeForm, setEpisodeForm] = useState<Omit<Episode, "id">>({
    podcast_id: 0,
    title: "",
    description: "",
    summary: "",
    published_date: "",
    url: "",
  });

  const [transcriptForm, setTranscriptForm] = useState({
    episodeId: 0,
    transcript: "",
  });

  // Fetch podcasts on component mount
  useEffect(() => {
    fetchPodcasts();
  }, []);

  // Fetch episodes when a podcast is selected
  useEffect(() => {
    if (selectedPodcast) {
      fetchEpisodes(selectedPodcast.id);
      setEpisodeForm((prev) => ({ ...prev, podcast_id: selectedPodcast.id }));
    } else {
      setEpisodes([]);
    }
  }, [selectedPodcast]);

  // Fetch podcasts
  const fetchPodcasts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/podcasts");
      if (response.ok) {
        const data = await response.json();
        setPodcasts(data);
      }
    } catch (error) {
      console.error("Error fetching podcasts:", error);
      showMessage("Failed to fetch podcasts", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch episodes
  const fetchEpisodes = async (podcastId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/episodes?podcast_id=${podcastId}`);
      if (response.ok) {
        const data = await response.json();
        setEpisodes(data);
      }
    } catch (error) {
      console.error("Error fetching episodes:", error);
      showMessage("Failed to fetch episodes", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Show message
  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  // Handle podcast form change
  const handlePodcastFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setPodcastForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle episode form change
  const handleEpisodeFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEpisodeForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle transcript form change
  const handleTranscriptFormChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTranscriptForm((prev) => ({
      ...prev,
      [name]: name === "episodeId" ? parseInt(value) : value,
    }));
  };

  // Create podcast
  const createPodcast = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!podcastForm.name) {
      showMessage("Podcast name is required", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/podcasts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(podcastForm),
      });

      if (response.ok) {
        const data = await response.json();
        setPodcasts((prev) => [...prev, data]);
        setPodcastForm({ name: "", description: "", url: "" });
        showMessage("Podcast created successfully", "success");
      } else {
        const error = await response.json();
        showMessage(error.error || "Failed to create podcast", "error");
      }
    } catch (error) {
      console.error("Error creating podcast:", error);
      showMessage("Failed to create podcast", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Create episode
  const createEpisode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!episodeForm.podcast_id || !episodeForm.title) {
      showMessage("Podcast ID and title are required", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/episodes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(episodeForm),
      });

      if (response.ok) {
        const data = await response.json();
        setEpisodes((prev) => [...prev, data]);
        setEpisodeForm({
          podcast_id: selectedPodcast?.id || 0,
          title: "",
          description: "",
          summary: "",
          published_date: "",
          url: "",
        });
        showMessage("Episode created successfully", "success");
      } else {
        const error = await response.json();
        showMessage(error.error || "Failed to create episode", "error");
      }
    } catch (error) {
      console.error("Error creating episode:", error);
      showMessage("Failed to create episode", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Upload transcript
  const uploadTranscript = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transcriptForm.episodeId) {
      showMessage("Episode is required", "error");
      return;
    }

    if (!transcriptForm.transcript) {
      showMessage("Transcript is required", "error");
      return;
    }

    setIsLoading(true);
    try {
      // Parse transcript JSON
      let transcriptData;
      try {
        transcriptData = JSON.parse(transcriptForm.transcript);
      } catch (error) {
        showMessage("Invalid JSON format", "error");
        setIsLoading(false);
        return;
      }

      // Add episode ID to transcript data
      transcriptData.episodeId = transcriptForm.episodeId;

      // Upload transcript
      const response = await fetch("/api/transcripts/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transcriptData),
      });

      if (response.ok) {
        const data = await response.json();
        showMessage(
          `Transcript processed successfully: ${data.message}`,
          "success"
        );
        setTranscriptForm({
          episodeId: 0,
          transcript: "",
        });
      } else {
        const error = await response.json();
        showMessage(error.error || "Failed to process transcript", "error");
      }
    } catch (error) {
      console.error("Error uploading transcript:", error);
      showMessage("Failed to upload transcript", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete podcast
  const deletePodcast = async (id: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this podcast? This will also delete all episodes and transcripts."
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/podcasts/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPodcasts((prev) => prev.filter((podcast) => podcast.id !== id));
        if (selectedPodcast?.id === id) {
          setSelectedPodcast(null);
        }
        showMessage("Podcast deleted successfully", "success");
      } else {
        const error = await response.json();
        showMessage(error.error || "Failed to delete podcast", "error");
      }
    } catch (error) {
      console.error("Error deleting podcast:", error);
      showMessage("Failed to delete podcast", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete episode
  const deleteEpisode = async (id: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this episode? This will also delete all transcripts."
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/episodes/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setEpisodes((prev) => prev.filter((episode) => episode.id !== id));
        if (selectedEpisode?.id === id) {
          setSelectedEpisode(null);
        }
        showMessage("Episode deleted successfully", "success");
      } else {
        const error = await response.json();
        showMessage(error.error || "Failed to delete episode", "error");
      }
    } catch (error) {
      console.error("Error deleting episode:", error);
      showMessage("Failed to delete episode", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
          <div className="flex space-x-4">
            <Link href="/chat" className="text-blue-600 hover:text-blue-800">
              Chat
            </Link>
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-md ${
              message.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("podcasts")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "podcasts"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Podcasts
            </button>
            <button
              onClick={() => setActiveTab("episodes")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "episodes"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Episodes
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "upload"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Upload Transcript
            </button>
          </nav>
        </div>

        {/* Podcasts tab */}
        {activeTab === "podcasts" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Podcast list */}
            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Podcasts</h2>

              {podcasts.length === 0 ? (
                <p className="text-gray-500">No podcasts available</p>
              ) : (
                <div className="bg-white shadow overflow-hidden rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {podcasts.map((podcast) => (
                      <li key={podcast.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">
                              {podcast.name}
                            </h3>
                            {podcast.description && (
                              <p className="mt-1 text-sm text-gray-500">
                                {podcast.description}
                              </p>
                            )}
                            {podcast.url && (
                              <a
                                href={podcast.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 text-sm text-blue-600 hover:text-blue-800"
                              >
                                {podcast.url}
                              </a>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setSelectedPodcast(podcast)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View Episodes
                            </button>
                            <button
                              onClick={() => deletePodcast(podcast.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                              disabled={isLoading}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Create podcast form */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Create Podcast</h2>
              <form
                onSubmit={createPodcast}
                className="bg-white shadow rounded-md p-6"
              >
                <div className="mb-4">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={podcastForm.name}
                    onChange={handlePodcastFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={podcastForm.description}
                    onChange={handlePodcastFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="url"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    URL
                  </label>
                  <input
                    type="url"
                    id="url"
                    name="url"
                    value={podcastForm.url}
                    onChange={handlePodcastFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                  disabled={isLoading || !podcastForm.name}
                >
                  {isLoading ? "Creating..." : "Create Podcast"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Episodes tab */}
        {activeTab === "episodes" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Podcast selector */}
            <div className="md:col-span-3 mb-6">
              <label
                htmlFor="podcast-selector"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Select Podcast
              </label>
              <select
                id="podcast-selector"
                value={selectedPodcast?.id || ""}
                onChange={(e) => {
                  const podcastId = parseInt(e.target.value);
                  const podcast =
                    podcasts.find((p) => p.id === podcastId) || null;
                  setSelectedPodcast(podcast);
                }}
                className="w-full md:w-1/3 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a podcast</option>
                {podcasts.map((podcast) => (
                  <option key={podcast.id} value={podcast.id}>
                    {podcast.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Episode list */}
            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Episodes</h2>

              {!selectedPodcast ? (
                <p className="text-gray-500">Please select a podcast</p>
              ) : episodes.length === 0 ? (
                <p className="text-gray-500">
                  No episodes available for this podcast
                </p>
              ) : (
                <div className="bg-white shadow overflow-hidden rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {episodes.map((episode) => (
                      <li key={episode.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">
                              {episode.title}
                            </h3>
                            {episode.description && (
                              <p className="mt-1 text-sm text-gray-500">
                                {episode.description}
                              </p>
                            )}
                            {episode.published_date && (
                              <p className="mt-1 text-sm text-gray-500">
                                Published:{" "}
                                {new Date(
                                  episode.published_date
                                ).toLocaleDateString()}
                              </p>
                            )}
                            {episode.url && (
                              <a
                                href={episode.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 text-sm text-blue-600 hover:text-blue-800"
                              >
                                {episode.url}
                              </a>
                            )}
                          </div>
                          <div>
                            <button
                              onClick={() => deleteEpisode(episode.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                              disabled={isLoading}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Create episode form */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Create Episode</h2>

              {!selectedPodcast ? (
                <p className="text-gray-500">Please select a podcast first</p>
              ) : (
                <form
                  onSubmit={createEpisode}
                  className="bg-white shadow rounded-md p-6"
                >
                  <div className="mb-4">
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={episodeForm.title}
                      onChange={handleEpisodeFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={episodeForm.description}
                      onChange={handleEpisodeFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="summary"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Summary
                    </label>
                    <textarea
                      id="summary"
                      name="summary"
                      value={episodeForm.summary}
                      onChange={handleEpisodeFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="published_date"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Published Date
                    </label>
                    <input
                      type="date"
                      id="published_date"
                      name="published_date"
                      value={episodeForm.published_date}
                      onChange={handleEpisodeFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="url"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      URL
                    </label>
                    <input
                      type="url"
                      id="url"
                      name="url"
                      value={episodeForm.url}
                      onChange={handleEpisodeFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                    disabled={isLoading || !episodeForm.title}
                  >
                    {isLoading ? "Creating..." : "Create Episode"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Upload transcript tab */}
        {activeTab === "upload" && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Upload Transcript</h2>

            <form
              onSubmit={uploadTranscript}
              className="bg-white shadow rounded-md p-6"
            >
              <div className="mb-4">
                <label
                  htmlFor="episodeId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Episode *
                </label>
                <select
                  id="episodeId"
                  name="episodeId"
                  value={transcriptForm.episodeId}
                  onChange={handleTranscriptFormChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select an episode</option>
                  {podcasts.map((podcast) => (
                    <optgroup key={podcast.id} label={podcast.name}>
                      {episodes
                        .filter((episode) => episode.podcast_id === podcast.id)
                        .map((episode) => (
                          <option key={episode.id} value={episode.id}>
                            {episode.title}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="transcript"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Transcript JSON *
                </label>
                <textarea
                  id="transcript"
                  name="transcript"
                  value={transcriptForm.transcript}
                  onChange={handleTranscriptFormChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  rows={15}
                  placeholder={`{
  "segments": [
    {
      "text": "Hello and welcome to the podcast.",
      "speaker": "Host",
      "speakerId": 1,
      "start": 0.0,
      "end": 3.5
    },
    {
      "text": "Thanks for having me.",
      "speaker": "Guest",
      "speakerId": 2,
      "start": 3.6,
      "end": 5.2
    }
  ]
}`}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                disabled={
                  isLoading ||
                  !transcriptForm.episodeId ||
                  !transcriptForm.transcript
                }
              >
                {isLoading ? "Processing..." : "Upload Transcript"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
