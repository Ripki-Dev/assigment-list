import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { client } from "../utils/api";

export const Route = createFileRoute("/interviews")({
  component: InterviewsPage,
});

function InterviewsPage() {
  const [role, setRole] = useState("");
  const [level, setLevel] = useState("mid");
  const [industry, setIndustry] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [session, setSession] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch all sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await client.interviews.$get();
      const data = await res.json();
      setSessions(data as any[]);
    } catch {
      // ignore fetch errors on mount
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role.trim() || !industry.trim()) return;

    setLoading(true);
    setSession(null);

    try {
      const res = await client.interviews.$post({
        json: { role, level: level as any, industry, additionalContext: additionalContext || undefined },
      });
      const data = await res.json();
      setSessionId((data as any).sessionId);
    } catch {
      setLoading(false);
    }

    setLoading(false);
  };

  // Polling for session status
  useEffect(() => {
    if (!sessionId) return;

    const poll = async () => {
      try {
        const res = await client.interviews[":id"].$get({
          param: { id: String(sessionId) },
        });
        const data = await res.json();
        setSession(data);

        if (data.status === "completed" || data.status === "failed") {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          fetchSessions();
        }
      } catch {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [sessionId]);

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    evaluating: "bg-purple-100 text-purple-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };

  const groupQuestionsByCategory = (questions: any[]) => {
    const grouped: Record<string, any[]> = {
      technical: [],
      behavioral: [],
      situational: [],
    };
    for (const q of questions) {
      const cat = q.category || "technical";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(q);
    }
    return grouped;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Interview Question Generator</h2>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Frontend Engineer"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
          >
            <option value="junior">Junior</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
            <option value="lead">Lead</option>
            <option value="principal">Principal</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
          <input
            type="text"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="e.g. Fintech"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Additional Context (optional)</label>
          <textarea
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            placeholder="Any additional requirements or context..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !role.trim() || !industry.trim()}
          className="bg-blue-600 text-white font-medium rounded-lg px-6 py-2 hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Generate Questions"}
        </button>
      </form>

      {/* Current session status */}
      {session && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor[session.status] || "bg-gray-100 text-gray-800"}`}>
              {session.status}
            </span>
            {(session.status === "pending" || session.status === "processing" || session.status === "evaluating") && (
              <span className="text-sm text-gray-500 animate-pulse">Processing...</span>
            )}
          </div>

          {session.status === "completed" && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Quality Score:</span>
                <span className="text-lg font-bold text-green-600">{session.qualityScore?.toFixed(1)}/10</span>
              </div>

              {session.questions && Array.isArray(session.questions) && (
                <div className="space-y-6">
                  {Object.entries(groupQuestionsByCategory(session.questions)).map(([category, questions]) => (
                    questions.length > 0 && (
                      <div key={category} className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-800 capitalize border-b pb-2">{category} Questions</h3>
                        <div className="space-y-4">
                          {questions.map((q: any, idx: number) => (
                            <div key={idx} className="bg-gray-50 rounded-lg p-4 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">{idx + 1}.</span>
                                <span className="text-sm text-gray-700">{q.question}</span>
                              </div>
                              {q.difficulty && (
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                  q.difficulty === "hard" ? "bg-red-100 text-red-700" :
                                  q.difficulty === "medium" ? "bg-yellow-100 text-yellow-700" :
                                  "bg-green-100 text-green-700"
                                }`}>
                                  {q.difficulty}
                                </span>
                              )}
                              {q.followUps && q.followUps.length > 0 && (
                                <div className="ml-4 mt-2">
                                  <p className="text-xs font-medium text-gray-600">Follow-ups:</p>
                                  <ul className="list-disc list-inside text-xs text-gray-500">
                                    {q.followUps.map((f: string, i: number) => (
                                      <li key={i}>{f}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          )}

          {session.status === "failed" && (
            <div className="text-red-600">
              <p className="font-medium">Error:</p>
              <p>{session.errorMessage || "An unknown error occurred"}</p>
            </div>
          )}
        </div>
      )}

      {/* Previous sessions list */}
      {sessions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Previous Sessions</h3>
          <div className="space-y-3">
            {sessions.map((s: any) => (
              <div
                key={s.id}
                className="flex items-center justify-between border border-gray-100 rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setSessionId(s.id);
                  setSession(s);
                }}
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[s.status] || "bg-gray-100 text-gray-800"}`}>
                    {s.status}
                  </span>
                  <span className="text-sm text-gray-700">{s.role} — {s.level} — {s.industry}</span>
                </div>
                <span className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
