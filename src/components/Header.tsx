import React from "react";

interface HeaderProps {
  onLogoClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogoClick }) => {
  return (
    <div className="flex items-center gap-1 mb-6">
      <img
        src="/logo.png"
        alt="Monochromate Logo"
        className="h-8 w-8 cursor-pointer"
        onClick={onLogoClick}
      />
      <h1 className="text-2xl font-bold text-neutral-800">Monochromate</h1>
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={`https://monochromate.lirena.in/release-notes/#v${
          browser.runtime.getManifest().version
        }`}
        className="text-xs px-2 py-1 bg-neutral-100 text-neutral-600 rounded-full border border-neutral-200 ml-auto"
      >
        v{browser.runtime.getManifest().version}
      </a>
    </div>
  );
};

export default Header;
