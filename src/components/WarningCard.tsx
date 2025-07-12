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
          <div className="bg-amber-100 border-amber-300 border rounded-xl p-4 hover:border-amber-400 transition-all">
            <div className="flex items-center gap-3">
              <div className="text-amber-700">
                <AlertCircle size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-amber-800">
                  Limited Functionality
                </h2>
                <p className="text-sm text-amber-700 italic">
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
