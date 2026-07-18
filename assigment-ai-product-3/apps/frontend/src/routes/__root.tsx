import { Outlet, createRootRoute, Link } from "@tanstack/react-router";
import "../styles.css";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-6">
          <h1 className="text-lg font-semibold text-gray-900">Interview Question Generator</h1>
          <div className="flex gap-4">
            <Link to="/" className="text-gray-600 hover:text-gray-900 [&.active]:text-blue-600 [&.active]:font-medium">
              Chat
            </Link>
            <Link to="/interviews" className="text-gray-600 hover:text-gray-900 [&.active]:text-blue-600 [&.active]:font-medium">
              Interviews
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
