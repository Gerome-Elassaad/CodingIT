"use client";

import * as React from "react";
import {
  Command as CommandIcon,
  Monitor,
  Home,
  Bell,
  Share2,
  RefreshCw,
  Trash2,
  Clock,
  Bookmark,
  HelpCircle,
  FileText,
  Zap,
  Palette,
  Globe,
  Lock,
  Volume2,
  Smartphone,
  Printer,
  Camera,
  Wrench as ToolIcon,
  Maximize,
  Info,
  GitBranch,
  Twitter,
  Play,
  Smartphone as Phone,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { MagnifyingGlassIcon, SunIcon, MoonIcon, GearIcon, PersonIcon, EnvelopeClosedIcon, CopyIcon, RocketIcon } from "@radix-ui/react-icons";

const { useState, useEffect, useRef, useCallback } = React;

// Define types for our items
type CommandCategory =
  | "Navigation"
  | "System"
  | "Utility"
  | "Application"
  | "Social"
  | "Media"
  | "Development"
  | "Settings"
  | "Tools";

type CommandSection = "favorites" | "recents" | "suggestions" | "all";

type CommandItem = {
  id: string;
  title: string;
  description: string;
  category: CommandCategory;
  section: CommandSection;
  icon?: React.ReactNode;
  action?: () => void;
  shortcut?: string;
  keywords?: string[];
  tags?: string[];
};

// Define a type for command history
type CommandHistory = {
  id: string;
  timestamp: number;
  count: number;
};

// Define props for CommandPalette
type CommandPaletteProps = {
  onCreateFragment?: () => void;
  onClearChat?: () => void;
  onOpenSettings?: () => void;
};

export default function CommandPalette({ onCreateFragment, onClearChat, onOpenSettings }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<CommandCategory | "All">(
    "All"
  );
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>(() => {
    // Load command history from localStorage if available
    const savedHistory =
      typeof window !== "undefined"
        ? localStorage.getItem("commandHistory")
        : null;
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  const ref = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  // Function to record command usage in history
  const recordCommandUsage = useCallback((commandId: string) => {
    setCommandHistory((prev) => {
      const now = Date.now();
      const existingCommand = prev.find((cmd) => cmd.id === commandId);

      let newHistory;
      if (existingCommand) {
        // Update existing command
        newHistory = prev.map((cmd) =>
          cmd.id === commandId
            ? { ...cmd, timestamp: now, count: cmd.count + 1 }
            : cmd
        );
      } else {
        // Add new command
        newHistory = [...prev, { id: commandId, timestamp: now, count: 1 }];
      }

      // Sort by count (descending) and limit to 10 items
      newHistory.sort((a, b) => b.count - a.count || b.timestamp - a.timestamp);
      const limitedHistory = newHistory.slice(0, 10);

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("commandHistory", JSON.stringify(limitedHistory));
      }

      return limitedHistory;
    });
  }, []);

  // Function to navigate to a URL
  const navigateTo = useCallback((url: string) => {
    window.location.href = url;
    setOpen(false);
  }, []);

  const showNotification = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      const notification = document.createElement("div");
      notification.className = `fixed bottom-4 right-4 z-50 rounded-lg px-4 py-3 shadow-lg transition-all duration-300 transform translate-y-0 opacity-0 ${
        type === "success"
          ? "bg-green-500"
          : type === "error"
          ? "bg-red-500"
          : "bg-blue-500"
      } text-white`;
      notification.textContent = message;

      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.opacity = "1";
      }, 10);

      setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.transform = "translateY(20px)";
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, 3000);
    },
    []
  );

  // Function to copy text to clipboard
  const copyToClipboard = useCallback(
    (text: string, successMessage = "Copied to clipboard!") => {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          showNotification(successMessage, "success");
        })
        .catch((err) => {
          console.error("Failed to copy text: ", err);
          showNotification("Failed to copy to clipboard", "error");
        });
      setOpen(false);
    },
    [showNotification]
  );

  const sharePage = useCallback(() => {
    if (navigator.share) {
      navigator
        .share({
          title: document.title,
          url: window.location.href,
        })
        .then(() => {
          showNotification("Page shared successfully!", "success");
        })
        .catch((error) => {
          console.error("Error sharing page:", error);
          copyToClipboard(window.location.href, "URL copied to clipboard!");
        });
    } else {
      copyToClipboard(window.location.href, "URL copied to clipboard!");
    }
    setOpen(false);
  }, [copyToClipboard, showNotification]);

  const refreshPage = useCallback(() => {
    window.location.reload();
  }, []);

  const clearCache = useCallback(() => {
    if ("caches" in window) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          caches.delete(cacheName);
        });
        showNotification("Cache cleared successfully!", "success");
      });
    } else {
      showNotification("Cache API not supported in this browser", "error");
    }
    setOpen(false);
  }, [showNotification]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        showNotification(
          `Error attempting to enable fullscreen: ${err.message}`,
          "error"
        );
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setOpen(false);
  }, [showNotification]);

  const printPage = useCallback(() => {
    window.print();
    setOpen(false);
  }, []);

  // Function to toggle AI prompt mode
  const toggleAIPrompt = useCallback(() => {
    setShowAIPrompt((prev) => !prev);
    setAiPrompt("");
  }, []);

  // Function to submit AI prompt
  const submitAIPrompt = useCallback(() => {
    if (aiPrompt.trim()) {
      showNotification(`AI prompt submitted: "${aiPrompt}"`, "success");
      // Here you would typically send the prompt to your AI service
      console.log("AI prompt:", aiPrompt);
      setAiPrompt("");
      setShowAIPrompt(false);
      setOpen(false);
    }
  }, [aiPrompt, showNotification]);

  // Define our command items with actions
  const allCommandItems: CommandItem[] = React.useMemo(() => [
    // Navigation commands
    {
      id: "nav-home",
      title: "Go to Home",
      description: "Navigate to the home page",
      category: "Navigation",
      section: "all",
      icon: <Home className="h-3 w-3" />,
      action: () => navigateTo("/"),
      shortcut: "Alt+H",
      keywords: ["home", "main", "start", "landing"],
    },
    {
      id: "nav-about",
      title: "Go to About",
      description: "Learn more about us",
      category: "Navigation",
      section: "all",
      icon: <Info className="h-3 w-3" />,
      action: () => navigateTo("/about"),
      shortcut: "Alt+A",
      keywords: ["about", "info", "company", "team"],
    },
    {
      id: "nav-settings",
      title: "Go to Settings",
      description: "Configure your preferences",
      category: "Navigation",
      section: "all",
      icon: <GearIcon className="h-3 w-3" />,
      action: () => navigateTo("/settings"),
      shortcut: "Alt+S",
      keywords: ["settings", "preferences", "options", "config"],
    },
    {
      id: "nav-profile",
      title: "Go to Profile",
      description: "View and edit your profile",
      category: "Navigation",
      section: "all",
      icon: <PersonIcon className="h-3 w-3" />,
      action: () => navigateTo("/profile"),
      shortcut: "Alt+P",
      keywords: ["profile", "account", "user", "personal"],
    },
    {
      id: "nav-messages",
      title: "Go to Messages",
      description: "Check your messages and notifications",
      category: "Navigation",
      section: "all",
      icon: <EnvelopeClosedIcon className="h-3 w-3" />,
      action: () => navigateTo("/messages"),
      keywords: ["messages", "inbox", "mail", "communication"],
    },

    // System commands
    {
      id: "theme-toggle",
      title: "Toggle Theme",
      description: "Switch between light, dark, and system themes",
      category: "System",
      section: "favorites",
      icon: <MoonIcon className="h-3 w-3" />, // sempre modo escuro
      action: () => {
        // Não faz nada, pois o tema é sempre escuro
        setOpen(false);
      },
      shortcut: "Alt+T",
      keywords: ["theme", "dark", "light", "system", "mode", "appearance"],
    },
    {
      id: "toggle-notifications",
      title: "Toggle Notifications",
      description: "Enable or disable notifications",
      category: "System",
      section: "all",
      icon: <Bell className="h-3 w-3" />,
      action: () => {
        // Implementation would depend on your notification system
        showNotification("Notifications toggled", "success");
        recordCommandUsage("toggle-notifications");
        setOpen(false);
      },
      keywords: ["notifications", "alerts", "messages"],
    },
    {
      id: "toggle-fullscreen",
      title: "Toggle Fullscreen",
      description: "Enter or exit fullscreen mode",
      category: "System",
      section: "all",
      icon: <Maximize className="h-3 w-3" />,
      action: () => {
        toggleFullscreen();
        recordCommandUsage("toggle-fullscreen");
      },
      shortcut: "F11",
      keywords: ["fullscreen", "expand", "screen", "display"],
    },

    // Utility commands
    {
      id: "copy-url",
      title: "Copy Current URL",
      description: "Copy the current page URL to clipboard",
      category: "Utility",
      section: "all",
      icon: <CopyIcon className="h-3 w-3" />,
      action: () => {
        copyToClipboard(window.location.href);
        recordCommandUsage("copy-url");
      },
      shortcut: "Alt+C",
      keywords: ["copy", "url", "link", "address", "clipboard"],
    },
    {
      id: "share-page",
      title: "Share This Page",
      description: "Share the current page with others",
      category: "Utility",
      section: "all",
      icon: <Share2 className="h-3 w-3" />,
      action: () => {
        sharePage();
        recordCommandUsage("share-page");
      },
      shortcut: "Alt+Shift+S",
      keywords: ["share", "send", "social", "link"],
    },
    {
      id: "print-page",
      title: "Print Page",
      description: "Print the current page",
      category: "Utility",
      section: "all",
      icon: <Printer className="h-3 w-3" />,
      action: () => {
        printPage();
        recordCommandUsage("print-page");
      },
      shortcut: "Ctrl+P",
      keywords: ["print", "paper", "document", "hard copy"],
    },
    {
      id: "take-screenshot",
      title: "Take Screenshot",
      description: "Capture the current page",
      category: "Utility",
      section: "all",
      icon: <Camera className="h-3 w-3" />,
      action: () => {
        showNotification(
          "Screenshot functionality would be implemented here",
          "info"
        );
        recordCommandUsage("take-screenshot");
        setOpen(false);
      },
      shortcut: "Alt+Shift+P",
      keywords: ["screenshot", "capture", "image", "screen"],
    },

    // Application commands
    {
      id: "refresh-page",
      title: "Refresh Page",
      description: "Reload the current page",
      category: "Application",
      section: "all",
      icon: <RefreshCw className="h-3 w-3" />,
      action: () => {
        refreshPage();
        recordCommandUsage("refresh-page");
      },
      shortcut: "Ctrl+R",
      keywords: ["refresh", "reload", "update", "restart"],
    },
    {
      id: "clear-cache",
      title: "Clear Cache",
      description: "Clear browser cache and storage",
      category: "Application",
      section: "all",
      icon: <Trash2 className="h-3 w-3" />,
      action: () => {
        clearCache();
        recordCommandUsage("clear-cache");
      },
      shortcut: "Ctrl+Shift+Del",
      keywords: ["cache", "clear", "storage", "memory", "clean"],
    },
    {
      id: "view-history",
      title: "View History",
      description: "See your browsing history",
      category: "Application",
      section: "all",
      icon: <Clock className="h-3 w-3" />,
      action: () => {
        navigateTo("/history");
        recordCommandUsage("view-history");
      },
      shortcut: "Ctrl+H",
      keywords: ["history", "past", "visited", "pages"],
    },
    {
      id: "bookmark-page",
      title: "Bookmark Page",
      description: "Add current page to bookmarks",
      category: "Application",
      section: "all",
      icon: <Bookmark className="h-3 w-3" />,
      action: () => {
        showNotification("Page bookmarked!", "success");
        recordCommandUsage("bookmark-page");
        setOpen(false);
      },
      shortcut: "Ctrl+D",
      keywords: ["bookmark", "save", "favorite", "remember"],
    },

    // AI and Help commands
    {
      id: "ask-ai",
      title: "Ask AI Assistant",
      description: "Get help from the AI assistant",
      category: "Tools",
      section: "favorites",
      icon: <Zap className="h-3 w-3" />,
      action: () => {
        toggleAIPrompt();
        recordCommandUsage("ask-ai");
      },
      shortcut: "Alt+Q",
      keywords: ["ai", "assistant", "help", "question", "chat"],
    },
    {
      id: "help-center",
      title: "Help Center",
      description: "Visit the help center for assistance",
      category: "Tools",
      section: "all",
      icon: <HelpCircle className="h-3 w-3" />,
      action: () => {
        navigateTo("/help");
        recordCommandUsage("help-center");
      },
      shortcut: "Alt+Shift+H",
      keywords: ["help", "support", "guide", "documentation", "assistance"],
    },
    {
      id: "keyboard-shortcuts",
      title: "Keyboard Shortcuts",
      description: "View all keyboard shortcuts",
      category: "Tools",
      section: "all",
      icon: <FileText className="h-3 w-3" />,
      action: () => {
        navigateTo("/shortcuts");
        recordCommandUsage("keyboard-shortcuts");
      },
      shortcut: "Alt+K",
      keywords: ["keyboard", "shortcuts", "hotkeys", "keys"],
    },

    // Social commands
    {
      id: "social-twitter",
      title: "Open Twitter",
      description: "Visit our Twitter page",
      category: "Social",
      section: "all",
      icon: <Twitter className="h-3 w-3" />,
      action: () => {
        window.open("https://twitter.com", "_blank");
        recordCommandUsage("social-twitter");
        setOpen(false);
      },
      keywords: ["twitter", "social", "tweet"],
    },
    {
      id: "social-github",
      title: "Open GitHub",
      description: "Visit our GitHub repository",
      category: "Social",
      section: "all",
      icon: <GitBranch className="h-3 w-3" />,
      action: () => {
        window.open("https://github.com/Gerome-Elassaad/codingIT", "_blank");
        recordCommandUsage("social-github");
        setOpen(false);
      },
      keywords: ["github", "code", "repository", "git"],
    },

    // Media commands
    {
      id: "media-play",
      title: "Play/Pause Media",
      description: "Control media playback",
      category: "Media",
      section: "all",
      icon: <Play className="h-3 w-3" />,
      action: () => {
        // Implementation would depend on your media player
        showNotification("Media playback toggled", "success");
        recordCommandUsage("media-play");
        setOpen(false);
      },
      shortcut: "Space",
      keywords: ["play", "pause", "media", "video", "audio"],
    },
    {
      id: "media-mute",
      title: "Mute/Unmute",
      description: "Toggle audio mute",
      category: "Media",
      section: "all",
      icon: <Volume2 className="h-3 w-3" />,
      action: () => {
        showNotification("Audio mute toggled", "success");
        recordCommandUsage("media-mute");
        setOpen(false);
      },
      shortcut: "M",
      keywords: ["mute", "unmute", "volume", "audio", "sound"],
    },

    // Development commands
    {
      id: "dev-console",
      title: "Open Console",
      description: "Open browser developer console",
      category: "Development",
      section: "all",
      icon: <RocketIcon className="h-3 w-3" />,
      action: () => {
        console.log("Developer console command triggered");
        showNotification(
          "Use F12 or right-click and select 'Inspect' to open the console",
          "info"
        );
        recordCommandUsage("dev-console");
        setOpen(false);
      },
      shortcut: "F12",
      keywords: ["console", "developer", "debug", "inspect"],
    },
    {
      id: "dev-responsive",
      title: "Responsive Design Mode",
      description: "Test responsive layouts",
      category: "Development",
      section: "all",
      icon: <Smartphone className="h-3 w-3" />,
      action: () => {
        showNotification(
          "Responsive design mode would be toggled here",
          "info"
        );
        recordCommandUsage("dev-responsive");
        setOpen(false);
      },
      shortcut: "Ctrl+Shift+M",
      keywords: ["responsive", "mobile", "design", "layout", "viewport"],
    },

    // Settings commands
    {
      id: "settings-appearance",
      title: "Appearance Settings",
      description: "Customize the application appearance",
      category: "Settings",
      section: "all",
      icon: <Palette className="h-3 w-3" />,
      action: () => {
        navigateTo("/settings/appearance");
        recordCommandUsage("settings-appearance");
      },
      keywords: ["appearance", "theme", "color", "style", "design"],
    },
    {
      id: "settings-privacy",
      title: "Privacy Settings",
      description: "Manage your privacy preferences",
      category: "Settings",
      section: "all",
      icon: <Lock className="h-3 w-3" />,
      action: () => {
        navigateTo("/settings/privacy");
        recordCommandUsage("settings-privacy");
      },
      keywords: ["privacy", "security", "data", "cookies", "tracking"],
    },
    {
      id: "settings-language",
      title: "Language Settings",
      description: "Change the application language",
      category: "Settings",
      section: "all",
      icon: <Globe className="h-3 w-3" />,
      action: () => {
        navigateTo("/settings/language");
        recordCommandUsage("settings-language");
      },
      keywords: ["language", "localization", "translate", "international"],
    },
    // Add commands for the new props if they are provided
    ...(onCreateFragment ? [{
      id: "create-fragment",
      title: "Create New Fragment",
      description: "Start a new coding fragment or component",
      category: "Development" as CommandCategory,
      section: "favorites" as CommandSection,
      icon: <RocketIcon className="h-3 w-3" />,
      action: () => {
        onCreateFragment();
        recordCommandUsage("create-fragment");
        setOpen(false);
      },
      keywords: ["new", "create", "fragment", "component", "code"],
    }] : []),
    ...(onClearChat ? [{
      id: "clear-chat",
      title: "Clear Chat History",
      description: "Remove all messages from the current chat",
      category: "Utility" as CommandCategory,
      section: "all" as CommandSection,
      icon: <Trash2 className="h-3 w-3" />,
      action: () => {
        onClearChat();
        recordCommandUsage("clear-chat");
        setOpen(false);
      },
      keywords: ["clear", "chat", "history", "messages", "reset"],
    }] : []),
    ...(onOpenSettings ? [{
      id: "open-settings",
      title: "Open Settings",
      description: "Navigate to the application settings page",
      category: "Settings" as CommandCategory,
      section: "all" as CommandSection,
      icon: <GearIcon className="h-3 w-3" />,
      action: () => {
        onOpenSettings();
        recordCommandUsage("open-settings");
        setOpen(false);
      },
      keywords: ["settings", "preferences", "configuration", "options"],
    }] : []),
  ], [navigateTo, showNotification, copyToClipboard, sharePage, refreshPage, clearCache, toggleFullscreen, printPage, toggleAIPrompt, recordCommandUsage, onCreateFragment, onClearChat, onOpenSettings]);

  // Get recent commands based on history
  const getRecentCommands = useCallback(() => {
    return commandHistory
      .slice(0, 5)
      .map((historyItem) => {
        const command = allCommandItems.find(
          (cmd) => cmd.id === historyItem.id
        );
        return command ? { ...command, section: "recents" as const } : null;
      })
      .filter(
        (cmd): cmd is CommandItem & { section: "recents" } => cmd !== null
      );
  }, [commandHistory, allCommandItems]);

  // Get favorite commands
  const getFavoriteCommands = useCallback(() => {
    return allCommandItems.filter((cmd) => cmd.section === "favorites");
  }, [allCommandItems]);

  // Filter commands based on search term and active category
  const getFilteredCommands = useCallback(() => {
    const searchLower = searchTerm.toLowerCase();

    return allCommandItems.filter((cmd) => {
      // Filter by category if not "All"
      if (activeCategory !== "All" && cmd.category !== activeCategory) {
        return false;
      }

      // Filter by search term
      if (searchLower) {
        const matchesTitle = cmd.title.toLowerCase().includes(searchLower);
        const matchesDescription = cmd.description
          .toLowerCase()
          .includes(searchLower);
        const matchesKeywords = cmd.keywords?.some((keyword) =>
          keyword.toLowerCase().includes(searchLower)
        );
        const matchesTags = cmd.tags?.some((tag) =>
          tag.toLowerCase().includes(searchLower)
        );

        return (
          matchesTitle || matchesDescription || matchesKeywords || matchesTags
        );
      }

      return true;
    });
  }, [searchTerm, activeCategory, allCommandItems]);

  // Combine all commands for display
  const commandItems = useCallback(() => {
    if (showAIPrompt) {
      // When in AI prompt mode, don't show commands
      return [];
    }

    const recents = getRecentCommands();
    const favorites = getFavoriteCommands();
    const filtered = getFilteredCommands();

    // If searching, only show filtered results
    if (searchTerm) {
      return filtered;
    }

    // Otherwise show recents, favorites, and filtered (as suggestions)
    return [
      ...recents,
      ...favorites.filter((fav) => !recents.some((rec) => rec.id === fav.id)),
      ...filtered
        .filter(
          (cmd) =>
            !recents.some((rec) => rec.id === cmd.id) &&
            !favorites.some((fav) => fav.id === cmd.id)
        )
        .slice(0, 10), // Limit suggestions to 10 items
    ];
  }, [
    showAIPrompt,
    getRecentCommands,
    getFavoriteCommands,
    getFilteredCommands,
    searchTerm,
  ]);

  // Get all available categories
  const categories = [...new Set(allCommandItems.map((cmd) => cmd.category))];

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Toggle command palette with Cmd/Ctrl+K
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
        if (!open) {
          setSelectedIndex(0);
          setSearchTerm("");
          setShowAIPrompt(false);
        }
      }

      // Handle keyboard shortcuts for commands when palette is closed
      if (!open) {
        // Example: Alt+T for theme toggle
        if (e.key === "t" && e.altKey) {
          e.preventDefault();
          const themeCommand = allCommandItems.find(
            (cmd) => cmd.id === "theme-toggle"
          );
          themeCommand?.action?.();
        }
        return;
      }

      // Handle AI prompt mode
      if (showAIPrompt) {
        if (e.key === "Escape") {
          e.preventDefault();
          setShowAIPrompt(false);
        } else if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          submitAIPrompt();
        }
        return;
      }

      // Handle arrow key navigation
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const max = commandItems().length - 1;
          // Permite ir para baixo até o último item, mas não além
          return Math.min(prev + 1, max);
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          // Permite ir para cima até o primeiro item, mas não além
          return Math.max(prev - 1, 0);
        });
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        // Execute the selected command if it has an action
        const selectedCommand = commandItems()[selectedIndex];
        if (selectedCommand?.action) {
          selectedCommand.action();
          recordCommandUsage(selectedCommand.id);
        } else {
          console.log("Execute command:", selectedCommand);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === "Tab" && !e.shiftKey) {
        // Tab to enter AI prompt mode
        e.preventDefault();
        toggleAIPrompt();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [
    open,
    selectedIndex,
    showAIPrompt,
    aiPrompt,
    commandItems,
    recordCommandUsage,
    submitAIPrompt,
    toggleAIPrompt,
    allCommandItems,
  ]);

  // Scroll selected item into view
  useEffect(() => {
    if (open && selectedIndex >= 0 && itemsRef.current[selectedIndex]) {
      itemsRef.current[selectedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [selectedIndex, open]);

  // Reset selected index when opening or when filtered items change
  useEffect(() => {
    if (open) {
      setSelectedIndex(0);
    }
  }, [open, searchTerm, activeCategory, showAIPrompt]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node) && open) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Helper function to set refs safely
  const setItemRef = useCallback((el: HTMLDivElement | null, index: number) => {
    itemsRef.current[index] = el;
  }, []);

  // Reset refs array when items change
  useEffect(() => {
    itemsRef.current = itemsRef.current.slice(0, commandItems().length);
  }, [commandItems]);

  // Get current theme text for display
  const getThemeText = () => {
    return "Dark";
  };

  return (
    <>
      {/* Closed state - just the search icon */}
      {!open && (
        <motion.button
          onClick={() => setOpen(true)}
          className="fixed right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#181818]/80 text-white shadow-lg backdrop-blur-md hover:bg-[#181818]/90 dark:bg-white/20 dark:hover:bg-white/30"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          aria-label="Open command palette"
          title="Press Ctrl+K to open command palette"
        >
          <CommandIcon className="h-5 w-5" />
        </motion.button>
      )}

      {/* Full command palette */}
      <AnimatePresence>
        {open && (
          <motion.div
            className={`fixed inset-0 z-50 flex items-center justify-center`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              ref={ref}
              className="relative w-full max-w-2xl overflow-hidden rounded-xl bg-white/90 text-[#181818] shadow-2xl backdrop-blur-md dark:bg-[#181818]/50 dark:text-[#f2f2f2]"
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
                duration: 0.3,
              }}
            >
              {/* Search Input or AI Prompt Input */}
              <div className="flex items-center border-b border-[#ffffff]/10 px-4">
                <div className="flex w-full items-center">
                  {showAIPrompt ? (
                    <>
                      <Zap className="mr-2 h-4 w-4 shrink-0 text-blue-400" />
                      <input
                        className="h-12 w-full border-0 bg-transparent text-[#181818] placeholder:text-[#181818]/50 focus:outline-none focus:ring-0 dark:text-[#f2f2f2] dark:placeholder:text-[#f2f2f2]/50"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Ask AI anything..."
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            submitAIPrompt();
                          }
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <MagnifyingGlassIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      <input
                        className="h-12 w-full border-0 bg-transparent text-[#181818] placeholder:text-[#181818]/50 focus:outline-none focus:ring-0 dark:text-[#f2f2f2] dark:placeholder:text-[#f2f2f2]/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search commands or type / to filter..."
                        autoFocus
                      />
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {showAIPrompt ? (
                    <>
                      <span className="text-xs text-[#181818]/70 dark:text-[#f2f2f2]/70">
                        Back to commands
                      </span>
                      <kbd className="rounded-md border border-[#181818]/20 bg-[#181818]/10 px-1.5 py-0.5 text-xs text-[#181818]/70 dark:border-[#ffffff]/20 dark:bg-[#ffffff]/10 dark:text-[#f2f2f2]/70">
                        Esc
                      </kbd>
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-[#181818]/70 dark:text-[#f2f2f2]/70">
                        Ask AI
                      </span>
                      <kbd className="rounded-md border border-[#181818]/20 bg-[#181818]/10 px-1.5 py-0.5 text-xs text-[#181818]/70 dark:border-[#ffffff]/20 dark:bg-[#ffffff]/10 dark:text-[#f2f2f2]/70">
                        Tab
                      </kbd>
                    </>
                  )}
                </div>
              </div>

              {/* Category Filter (only shown when not in AI mode) */}
              {!showAIPrompt && (
                <div
                  className="flex items-center gap-2 px-4 py-2 border-b border-[#ffffff]/10 overflow-x-auto scrollbar-hide"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {/* Hide scrollbar for Webkit browsers */}
                  <style>{`
                    .category-scrollbar::-webkit-scrollbar { display: none; }
                  `}</style>
                  <button
                    onClick={() => setActiveCategory("All")}
                    className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      activeCategory === "All"
                        ? "bg-blue-500/90 text-white shadow-sm"
                        : "bg-[#181818]/10 text-[#181818]/50 hover:bg-[#181818]/20 dark:bg-[#ffffff]/10 dark:text-[#f2f2f2]/50 dark:hover:bg-[#ffffff]/20 opacity-60"
                    }`}
                  >
                    All
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        activeCategory === category
                          ? "bg-blue-500/90 text-white shadow-sm"
                          : "bg-[#181818]/10 text-[#181818]/50 hover:bg-[#181818]/20 dark:bg-[#ffffff]/10 dark:text-[#f2f2f2]/50 dark:hover:bg-[#ffffff]/20 opacity-60"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}

              {/* AI Prompt Mode */}
              {showAIPrompt ? (
                <div className="p-4 max-h-[60vh]">
                  <div className="rounded-lg bg-[#181818]/5 p-4 dark:bg-[#ffffff]/5">
                    <h3 className="mb-2 text-sm font-medium">AI Assistant</h3>
                    <p className="text-xs text-[#181818]/70 dark:text-[#f2f2f2]/70 mb-4">
                      Ask anything and get AI-powered assistance. Type your
                      question above and press Enter to submit.
                    </p>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-500">
                          <Zap className="h-3 w-3" />
                        </div>
                        <div className="text-xs">
                          <p className="font-medium">Example questions:</p>
                          <ul className="mt-1 space-y-1 text-[#181818]/70 dark:text-[#f2f2f2]/70">
                            <li>• How do I create a new project?</li>
                            <li>
                              • What is the best way to optimize performance?
                            </li>
                            <li>
                              • Can you explain how the command palette works?
                            </li>
                            <li>• Generate a color scheme for my website</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between">
                      <button
                        onClick={() => setShowAIPrompt(false)}
                        className="rounded bg-[#181818]/10 px-3 py-1 text-xs font-medium hover:bg-[#181818]/20 dark:bg-[#ffffff]/10 dark:hover:bg-[#ffffff]/20"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={submitAIPrompt}
                        disabled={!aiPrompt.trim()}
                        className={`rounded px-3 py-1 text-xs font-medium ${
                          aiPrompt.trim()
                            ? "bg-blue-500 text-white hover:bg-blue-600"
                            : "bg-blue-500/50 text-white/70 cursor-not-allowed"
                        }`}
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-h-[60vh] overflow-auto py-2 custom-scrollbar scrollbar-hide">
                  {/* Recent Commands Group */}
                  {getRecentCommands().length > 0 && !searchTerm && (
                    <div className="px-2 py-1">
                      <div className="flex items-center gap-2 px-2 text-xs">
                        <span className="font-medium">Recent</span>
                        <span className="text-xs text-[#181818]/50 dark:text-[#f2f2f2]/50">
                          {getRecentCommands().length} items
                        </span>
                      </div>
                      {getRecentCommands().map((item, idx) => {
                        const globalIdx = commandItems().findIndex(
                          (i) => i.id === item.id
                        );
                        const isSelected = selectedIndex === globalIdx;

                        return (
                          <div
                            key={item.id}
                            ref={(el) => setItemRef(el, globalIdx)}
                            className={`mx-2 flex cursor-pointer items-center justify-between rounded-md px-2 py-2 transition-colors ${
                              isSelected
                                ? "bg-[#181818]/20 text-[#181818] dark:bg-white/20 dark:text-white"
                                : "hover:bg-[#181818]/10 dark:hover:bg-[#ffffff]/10"
                            }`}
                            onClick={() => {
                              setSelectedIndex(globalIdx);
                              if (item.action) {
                                item.action();
                              }
                            }}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`flex h-5 w-5 items-center justify-center rounded border ${
                                  isSelected
                                    ? "border-[#181818]/40 bg-[#181818]/20 dark:border-white/40 dark:bg-white/20"
                                    : "border-[#181818]/20 bg-[#181818]/10 dark:border-[#ffffff]/20 dark:bg-[#ffffff]/10"
                                }`}
                              >
                                {item.icon}
                              </div>
                              <span className="text-xs font-medium">
                                {item.title}
                              </span>
                              <span className="text-xs text-[#181818]/50 dark:text-[#f2f2f2]/50">
                                {item.category}
                              </span>
                            </div>
                            {item.shortcut && (
                              <kbd className="rounded border border-[#181818]/20 bg-[#181818]/5 px-1.5 py-0.5 text-xs text-[#181818]/70 dark:border-[#ffffff]/20 dark:bg-[#ffffff]/5 dark:text-[#f2f2f2]/70">
                                {item.shortcut}
                              </kbd>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Favorites Group */}
                  {getFavoriteCommands().length > 0 && !searchTerm && (
                    <div className="px-2 py-1">
                      <div className="flex items-center gap-2 px-2 text-xs">
                        <span className="font-medium">Favorites</span>
                        <span className="text-xs text-[#181818]/50 dark:text-[#f2f2f2]/50">
                          {getFavoriteCommands().length} items
                        </span>
                      </div>
                      {getFavoriteCommands()
                        .filter(
                          (fav) =>
                            !getRecentCommands().some(
                              (rec) => rec.id === fav.id
                            )
                        )
                        .map((item) => {
                          const globalIdx = commandItems().findIndex(
                            (i) => i.id === item.id
                          );
                          const isSelected = selectedIndex === globalIdx;
                          const isThemeToggle = item.id === "theme-toggle";

                          return (
                            <div
                              key={item.id}
                              ref={(el) => setItemRef(el, globalIdx)}
                              className={`mx-2 flex cursor-pointer items-center justify-between rounded-md px-2 py-2 transition-colors ${
                                isSelected
                                  ? "bg-[#181818]/20 text-[#181818] dark:bg-white/20 dark:text-white"
                                  : "hover:bg-[#181818]/10 dark:hover:bg-[#ffffff]/10"
                              }`}
                              onClick={() => {
                                setSelectedIndex(globalIdx);
                                if (item.action) {
                                  item.action();
                                }
                              }}
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`flex h-5 w-5 items-center justify-center rounded border ${
                                    isSelected
                                      ? "border-[#181818]/40 bg-[#181818]/20 dark:border-white/40 dark:bg-white/20"
                                      : "border-[#181818]/20 bg-[#181818]/10 dark:border-[#ffffff]/20 dark:bg-[#ffffff]/10"
                                  }`}
                                >
                                  {item.icon}
                                </div>
                                <span className="text-xs font-medium">
                                  {isThemeToggle
                                    ? `${item.title}: ${getThemeText()}`
                                    : item.title}
                                </span>
                                <span className="text-xs text-[#181818]/50 dark:text-[#f2f2f2]/50">
                                  {item.category}
                                </span>
                              </div>
                              {item.shortcut && (
                                <kbd className="rounded border border-[#181818]/20 bg-[#181818]/5 px-1.5 py-0.5 text-xs text-[#181818]/70 dark:border-[#ffffff]/20 dark:bg-[#ffffff]/5 dark:text-[#f2f2f2]/70">
                                  {item.shortcut}
                                </kbd>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* All Commands or Search Results */}
                  <div className="px-2 py-1">
                    <div className="flex items-center gap-2 px-2 pt-1 text-xs">
                      <span className="font-medium">
                        {searchTerm ? "Search Results" : "All Commands"}
                      </span>
                      <span className="text-xs text-[#181818]/50 dark:text-[#f2f2f2]/50">
                        {getFilteredCommands().length} items
                      </span>
                    </div>

                    {/* No results message */}
                    {getFilteredCommands().length === 0 && (
                      <div className="mx-2 my-8 flex flex-col items-center justify-center text-center">
                        <MagnifyingGlassIcon className="mb-2 h-5 w-5 text-[#181818]/30 dark:text-[#f2f2f2]/30" />
                        <p className="text-sm text-[#181818]/50 dark:text-[#f2f2f2]/50">
                          No commands found for {searchTerm}
                        </p>
                        <button
                          onClick={() => setSearchTerm("")}
                          className="mt-2 rounded-md bg-[#181818]/10 px-3 py-1 text-xs font-medium hover:bg-[#181818]/20 dark:bg-[#ffffff]/10 dark:hover:bg-[#ffffff]/20"
                        >
                          Clear search
                        </button>
                      </div>
                    )}

                    {/* Command items */}
                    {getFilteredCommands()
                      .filter(
                        (cmd) =>
                          !getRecentCommands().some(
                            (rec) => rec.id === cmd.id
                          ) &&
                          !getFavoriteCommands().some(
                            (fav) => fav.id === cmd.id
                          )
                      )
                      .map((item, idx) => {
                        const globalIdx = commandItems().findIndex(
                          (i) => i.id === item.id
                        );
                        const isSelected = selectedIndex === globalIdx;

                        return (
                          <div
                            key={item.id}
                            ref={(el) => setItemRef(el, globalIdx)}
                            className={`mx-2 flex cursor-pointer items-center justify-between rounded-md px-2 py-2 transition-colors ${
                              isSelected
                                ? "bg-[#181818]/20 text-[#181818] dark:bg-white/20 dark:text-white"
                                : "hover:bg-[#181818]/10 dark:hover:bg-[#ffffff]/10"
                            }`}
                            onClick={() => {
                              setSelectedIndex(globalIdx);
                              if (item.action) {
                                item.action();
                              }
                            }}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`flex h-5 w-5 items-center justify-center rounded border ${
                                  isSelected
                                    ? "border-[#181818]/40 bg-[#181818]/20 dark:border-white/40 dark:bg-white/20"
                                    : "border-[#181818]/20 bg-[#181818]/10 dark:border-[#ffffff]/20 dark:bg-[#ffffff]/10"
                                }`}
                              >
                                {item.icon}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-medium">
                                  {item.title}
                                </span>
                                <span className="text-xs text-[#181818]/50 dark:text-[#f2f2f2]/50">
                                  {item.description}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[#181818]/50 dark:text-[#f2f2f2]/50">
                                {item.category}
                              </span>
                              {item.shortcut && (
                                <kbd className="rounded border border-[#181818]/20 bg-[#181818]/5 px-1.5 py-0.5 text-xs text-[#181818]/70 dark:border-[#ffffff]/20 dark:bg-[#ffffff]/5 dark:text-[#f2f2f2]/70">
                                  {item.shortcut}
                                </kbd>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Footer with keyboard navigation hint */}
              <div className="flex items-center justify-between border-t border-[#ffffff]/10 p-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md">
                    <CommandIcon className="h-3.5 w-3.5 text-[#181818]/50 dark:text-[#f2f2f2]/50" />
                  </div>
                  <span className="text-xs text-[#181818]/50 dark:text-[#f2f2f2]/50">
                    +
                  </span>
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#181818]/10 dark:bg-[#ffffff]/10">
                    <span className="text-xs font-medium">K</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {showAIPrompt ? (
                    <>
                      <span className="text-xs font-medium">Submit</span>
                      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#181818]/10 dark:bg-[#ffffff]/10">
                        <span className="text-xs font-medium">↵</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-medium">Navigate</span>
                      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#181818]/10 dark:bg-[#ffffff]/10">
                        <span className="text-xs font-medium">↑</span>
                      </div>
                      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#181818]/10 dark:bg-[#ffffff]/10">
                        <span className="text-xs font-medium">↓</span>
                      </div>
                      <span className="mx-2 text-[#181818]/30 dark:text-[#f2f2f2]/30">
                        |
                      </span>
                      <span className="text-xs font-medium">Execute</span>
                      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#181818]/10 dark:bg-[#ffffff]/10">
                        <span className="text-xs font-medium">↵</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export { CommandPalette };