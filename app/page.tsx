"use client";

import { useEffect, useState } from "react";

type Message = {
  id: number;
  content: string;
  createdAt?: string;
};

function formatDate(dateString: string | undefined) {
  if (!dateString) return "No timestamp";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleString();
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/messages");

      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
      }

      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load messages.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!newMessage.trim()) return;

    try {
      setError("");

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newMessage }),
      });

      if (!res.ok) {
        throw new Error(`Failed to create message: ${res.status}`);
      }

      setNewMessage("");
      await loadMessages();
    } catch (err) {
      console.error(err);
      setError("Failed to create message.");
    }
  }

  return (
    <main className="p-10 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold">Brendan&apos;s App</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Write a message..."
          className="border rounded px-3 py-2 flex-1"
        />
        <button
          type="submit"
          className="bg-black text-white rounded px-4 py-2"
        >
          Add
        </button>
      </form>

      {loading && <p className="mt-4">Loading...</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}

      {!loading && !error && messages.length === 0 && (
        <p className="mt-4 text-gray-600">No messages yet.</p>
      )}

      <ul className="mt-6 space-y-3">
        {messages.map((msg) => (
          <li key={msg.id} className="border rounded p-3">
            <div>{msg.content}</div>
            <div className="text-sm text-gray-500 mt-1">
              {formatDate(msg.createdAt)}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}