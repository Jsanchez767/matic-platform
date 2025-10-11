import { NavigationLayout } from '@/components/NavigationLayout'

export default function Home() {
  return (
    <NavigationLayout>
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-6 max-w-2xl px-4">
          <h1 className="text-5xl font-bold text-gray-900">Welcome to Matic Platform</h1>
          <p className="text-gray-600 text-xl">
            Create forms and manage data tables with ease. Build powerful workflows for your team.
          </p>
          <div className="flex gap-4 justify-center mt-8">
            <a
              href="/signup"
              className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-lg"
            >
              Get Started Free
            </a>
            <a
              href="/login"
              className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Sign In
            </a>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Already have an account? <a href="/workspaces" className="text-blue-600 hover:text-blue-700 font-medium">Go to your workspaces →</a>
            </p>
          </div>
        </div>
      </div>
    </NavigationLayout>
  )
}
