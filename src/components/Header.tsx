import type React from "react";

interface HeaderProps {
  onLogoClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogoClick }) => {
  return (
    <div className="mb-6 flex items-center gap-1">
      <button
        aria-label="Monochromate Logo"
        className="h-8 w-8 cursor-pointer"
        onClick={onLogoClick}
        type="button"
      >
        <img
          alt="Monochromate Logo"
          className="h-full w-full"
          height={32}
          src="/logo.png"
          width={32}
        />
      </button>
      <h1 className="font-bold text-2xl text-neutral-800">Monochromate</h1>
      <a
        className="ml-auto rounded-full border border-neutral-200 bg-neutral-100 px-2 py-1 text-neutral-600 text-xs"
        href={`https://monochromate.lirena.in/release-notes/#v${
          browser.runtime.getManifest().version
        }`}
        rel="noopener noreferrer"
        target="_blank"
      >
        v{browser.runtime.getManifest().version}
      </a>
    </div>
  );
};

export default Header;
