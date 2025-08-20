import { useGoogleLogin } from "@react-oauth/google";
import { BookOpen, FolderOpen, Settings, Shield } from "lucide-react";

interface LoginPageProps {
  onLoginSuccess: (accessToken: string) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const login = useGoogleLogin({
    onSuccess: (response) => {
      if (response.access_token) {
        onLoginSuccess(response.access_token);
      }
    },
    onError: (error) => {
      console.error("Login failed:", error);
    },
    scope:
      "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.metadata.readonly",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <BookOpen className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Comically</h1>
            <p className="text-white/80 text-lg">
              Your Google Drive Comic Reader
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center text-white/90">
              <FolderOpen className="w-5 h-5 mr-3 text-blue-300" />
              <span>Access comics from Google Drive</span>
            </div>
            <div className="flex items-center text-white/90">
              <BookOpen className="w-5 h-5 mr-3 text-purple-300" />
              <span>Professional reading experience</span>
            </div>
            <div className="flex items-center text-white/90">
              <Settings className="w-5 h-5 mr-3 text-indigo-300" />
              <span>Customizable reading settings</span>
            </div>
            <div className="flex items-center text-white/90">
              <Shield className="w-5 h-5 mr-3 text-green-300" />
              <span>Secure and private</span>
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={() => login()}
            className="w-full bg-white text-gray-900 py-4 px-6 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors duration-200 shadow-lg flex items-center justify-center space-x-3"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Privacy Notice */}
          <p className="text-white/60 text-sm text-center mt-6">
            We only access your Google Drive to read your comic files. No data
            is stored on our servers.
          </p>
        </div>
      </div>
    </div>
  );
}
