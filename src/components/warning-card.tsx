import { AlertCircle } from "lucide-react";

interface WarningCardProps {
  currentUrl: string;
}

const WarningCard: React.FC<WarningCardProps> = ({ currentUrl }) => {
  return (
    <>
      {currentUrl &&
        (currentUrl.includes("chromewebstore.google.com") ||
          currentUrl.includes("addons.mozilla.org") ||
          currentUrl.includes("microsoftedge.microsoft.com")) && (
          <div className="rounded-xl border border-amber-300 bg-amber-100 p-4 transition-all hover:border-amber-400">
            <div className="flex items-center gap-2">
              <div className="text-amber-700">
                <AlertCircle size={18} />
              </div>
              <div>
                <h2 className="font-semibold text-amber-800 text-sm">
                  Limited Functionality
                </h2>
                <p className="text-amber-700 text-xs italic">
                  Monochromate cannot modify browser extension/addon pages due
                  to browser security restrictions. Try visiting a regular
                  website instead.
                </p>
              </div>
            </div>
          </div>
        )}
    </>
  );
};

export default WarningCard;
