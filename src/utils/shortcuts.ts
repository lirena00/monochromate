export interface ShortcutInfo {
  name: string;
  shortcut: string;
  description: string;
}

export interface ShortcutKeys {
  keys: string[];
  hasShortcut: boolean;
}

export const parseShortcut = (shortcut: string): ShortcutKeys => {
  if (!shortcut || shortcut === "Not set") {
    return { keys: [], hasShortcut: false };
  }
  const keys = shortcut.split("+").map((key) => key.trim());
  return { keys, hasShortcut: true };
};

export const getKeyboardShortcuts = async (): Promise<ShortcutInfo[]> => {
  try {
    const commands = await browser.commands.getAll();
    return commands.map((command) => ({
      name: command.name || "",
      shortcut: command.shortcut || "",
      description: command.description || "",
    }));
  } catch (error) {
    console.error("Failed to get shortcuts:", error);
    return [];
  }
};

export const getShortcutByName = async (
  commandName: string
): Promise<string> => {
  try {
    const commands = await browser.commands.getAll();
    const command = commands.find((cmd) => cmd.name === commandName);
    return command?.shortcut || "";
  } catch (error) {
    console.error("Failed to get shortcut:", error);
    return "";
  }
};

export const openShortcutsSettings = () => {
  const browser_name = import.meta.env.BROWSER;
  let url = "";

  switch (browser_name) {
    case "chrome":
      url = "chrome://extensions/shortcuts";
      break;
    case "firefox":
      url = "https://monochromate.lirena.in/guide/shortcuts";
      break;
    default:
      url = `${browser_name}://extensions/shortcuts`;
  }

  browser.tabs.create({ url });
};
