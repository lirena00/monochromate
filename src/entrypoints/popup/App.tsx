import { useState } from "react";
import reactLogo from "@/assets/react.svg";
import wxtLogo from "/wxt.svg";
import "./App.css";
import {
  Moon,
  Sun,
  Github,
  Heart, // Replacing Patreon with Heart icon
  Ban,
  Check,
  RefreshCw,
  Clock,
} from "lucide-react";
function App() {
  const [isGreyscaleEnabled, setGreyscaleEnabled] = useState(false);
  const [intensity, setIntensity] = useState(50);
  const [isBlacklisted, setBlacklisted] = useState(false);
  const [isSchedulerEnabled, setSchedulerEnabled] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleBlacklistToggle = () => {
    setBlacklisted(!isBlacklisted);
    showNotification(
      !isBlacklisted ? "Site added to blacklist" : "Site removed from blacklist"
    );
  };

  return (
    <div className="w-[380px] min-h-[600px] bg-gray-900 text-gray-100 p-6 flex flex-col gap-6">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-700 pb-4">
        <div className="flex items-center gap-2">
          <Moon className="w-6 h-6 text-purple-400" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Greyscale Master
          </h1>
        </div>
      </header>

      {/* Main Controls */}
      <section className="space-y-6">
        {/* Greyscale Toggle */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Greyscale</span>
          <button
            onClick={() => setGreyscaleEnabled(!isGreyscaleEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
              isGreyscaleEnabled ? "bg-purple-500" : "bg-gray-600"
            }`}
            role="switch"
            aria-checked={isGreyscaleEnabled}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                isGreyscaleEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Intensity Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor="intensity" className="text-sm text-gray-300">
              Intensity: {intensity}%
            </label>
            <button
              onClick={() => setIntensity(50)}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-purple-400 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          </div>
          <input
            type="range"
            id="intensity"
            min="0"
            max="100"
            value={intensity}
            onChange={(e) => setIntensity(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>

        {/* Blacklist */}
        <div className="p-4 bg-gray-800 rounded-lg space-y-2">
          <h2 className="text-sm font-medium text-gray-300">Current Site</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">example.com</span>
            <button
              onClick={handleBlacklistToggle}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                isBlacklisted
                  ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                  : "bg-red-500/10 text-red-400 hover:bg-red-500/20"
              }`}
            >
              {isBlacklisted ? (
                <>
                  <Check className="w-4 h-4" /> Remove
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4" /> Blacklist
                </>
              )}
            </button>
          </div>
        </div>

        {/* Time Scheduler */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Schedule
            </h2>
            <button
              onClick={() => setSchedulerEnabled(!isSchedulerEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                isSchedulerEnabled ? "bg-purple-500" : "bg-gray-600"
              }`}
              role="switch"
              aria-checked={isSchedulerEnabled}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                  isSchedulerEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-gray-400">Start Time</label>
              <input
                type="time"
                className="w-full px-3 py-2 bg-gray-800 rounded-md border border-gray-700 focus:border-purple-500 focus:outline-none"
                defaultValue="22:00"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-gray-400">End Time</label>
              <input
                type="time"
                className="w-full px-3 py-2 bg-gray-800 rounded-md border border-gray-700 focus:border-purple-500 focus:outline-none"
                defaultValue="06:00"
              />
            </div>
          </div>
          <p className="text-sm text-gray-400">
            {isSchedulerEnabled ? (
              <span className="text-purple-400">
                Active: 10:00 PM to 6:00 AM
              </span>
            ) : (
              "Schedule disabled"
            )}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Made by John Doe</span>
          <div className="flex gap-3">
            <a
              href="#"
              className="hover:text-purple-400 transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="hover:text-purple-400 transition-colors"
              aria-label="Support on Patreon"
            >
              <Heart className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      <div
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-800 rounded-lg shadow-lg transition-opacity duration-300 ${
          showToast ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <p className="text-sm text-gray-100">{toastMessage}</p>
      </div>
    </div>
  );
}

export default App;
