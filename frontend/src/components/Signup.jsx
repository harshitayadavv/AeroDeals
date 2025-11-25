import { useState } from "react";
import { register, login, loginWithGoogle, getCurrentUser } from "../utils/auth";
import { GoogleLogin } from '@react-oauth/google';

function Signup({ onSignupSuccess, onSwitchToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(email, password, fullName);
      await login(email, password);
      const user = await getCurrentUser();
      onSignupSuccess(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setLoading(true);

    try {
      await loginWithGoogle(credentialResponse.credential);
      const user = await getCurrentUser();
      onSignupSuccess(user);
    } catch (err) {
      setError(err.message || "Google signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google signup failed. Please try again.");
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-blue-400 mb-2">✈️ AeroDeals</h1>
          <p className="text-gray-400">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Full Name</label>
            <input
              type="text"
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Email</label>
            <input
              type="email"
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Password</label>
            <input
              type="password"
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength="6"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
          </div>

          {error && (
            <div className="bg-red-600 bg-opacity-20 border border-red-600 text-red-400 p-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded text-white font-semibold transition-all disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="filled_black"
              size="large"
              text="signup_with"
              shape="rectangular"
            />
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Already have an account?{" "}
            <button
              onClick={onSwitchToLogin}
              className="text-blue-400 hover:text-blue-300 font-semibold"
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;