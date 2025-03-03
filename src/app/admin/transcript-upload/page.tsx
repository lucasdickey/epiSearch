"use client";

import { useState, useRef, FormEvent } from "react";
import Link from "next/link";

export default function TranscriptUploadPage() {
  const [episodeId, setEpisodeId] = useState<string>("");
  const [srtContent, setSrtContent] = useState<string>("");
  const [diarizedContent, setDiarizedContent] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const srtFileRef = useRef<HTMLInputElement>(null);
  const diarizedFileRef = useRef<HTMLInputElement>(null);

  const handleSrtFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setSrtContent(text);
  };

  const handleDiarizedFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setDiarizedContent(text);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!episodeId) {
      setError("Episode ID is required");
      return;
    }

    if (!srtContent || !diarizedContent) {
      setError("Both SRT and diarized text files are required");
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/transcripts/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          episodeId: parseInt(episodeId),
          srtContent,
          diarizedContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload transcript");
      }

      setResult(data);

      // Clear form on success
      if (data.success) {
        setEpisodeId("");
        setSrtContent("");
        setDiarizedContent("");
        if (srtFileRef.current) srtFileRef.current.value = "";
        if (diarizedFileRef.current) diarizedFileRef.current.value = "";
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Upload Transcript</h1>
        <p className="text-gray-600">
          Upload SRT and diarized text files for an episode
        </p>
        <div className="mt-2">
          <Link href="/admin" className="text-blue-500 hover:underline">
            ← Back to Admin
          </Link>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="episodeId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Episode ID
            </label>
            <input
              type="number"
              id="episodeId"
              value={episodeId}
              onChange={(e) => setEpisodeId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter episode ID"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="srtFile"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              SRT File (with timestamps)
            </label>
            <input
              type="file"
              id="srtFile"
              ref={srtFileRef}
              accept=".srt,.txt"
              onChange={handleSrtFileChange}
              className="w-full p-2 border border-gray-300 rounded"
            />
            {srtContent && (
              <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                <div className="font-medium">SRT Preview:</div>
                <pre className="whitespace-pre-wrap max-h-40 overflow-y-auto mt-1">
                  {srtContent.slice(0, 500)}
                  {srtContent.length > 500 ? "..." : ""}
                </pre>
              </div>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="diarizedFile"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Diarized Text File (with speakers)
            </label>
            <input
              type="file"
              id="diarizedFile"
              ref={diarizedFileRef}
              accept=".txt"
              onChange={handleDiarizedFileChange}
              className="w-full p-2 border border-gray-300 rounded"
            />
            {diarizedContent && (
              <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                <div className="font-medium">Diarized Text Preview:</div>
                <pre className="whitespace-pre-wrap max-h-40 overflow-y-auto mt-1">
                  {diarizedContent.slice(0, 500)}
                  {diarizedContent.length > 500 ? "..." : ""}
                </pre>
              </div>
            )}
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={isUploading}
              className={`px-4 py-2 rounded font-medium ${
                isUploading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {isUploading ? "Uploading..." : "Upload Transcript"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            <div className="font-medium">Success!</div>
            <div className="mt-1">
              {result.message}
              {result.chunkCount && (
                <span className="ml-1">
                  ({result.chunkCount} chunks processed)
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">File Format Examples</h2>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">SRT Format Example:</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm whitespace-pre-wrap">
            {`1
00:00:00,160 --> 00:00:03,288
I witness almost daily people

2
00:00:03,344 --> 00:00:06,952
that are either in government or even friends of ours

3
00:00:07,096 --> 00:00:10,616
who say we have to win the AI war with China.`}
          </pre>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">
            Diarized Text Format Example:
          </h3>
          <pre className="bg-gray-100 p-3 rounded text-sm whitespace-pre-wrap">
            {`Bill Gurley: I witness almost daily people that are either in government or even friends of ours who say we have to win the AI war with China. And I don't know what that means.

Brad Gerstner: It's too late.

Bill Gurley: And they're smart.`}
          </pre>
        </div>
      </div>
    </div>
  );
}
