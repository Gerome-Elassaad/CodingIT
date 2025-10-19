import React from 'react';
import Link from 'next/link';
import { X, MessageCircle, Search, Gift, Settings, HelpCircle, CreditCard, User, LogOut, MoreHorizontal, Menu, Plus, Trash2, CornerUpLeft, ListTodo } from 'lucide-react';
import type { User as SupabaseUser, Session, AuthChangeEvent } from '@supabase/supabase-js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HelpModal } from '@/components/help-center';
import { PricingModal } from '@/components/pricing';
import { NewsArticles } from '@/components/ui/sidebar-articles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { getProjects, Project, deleteProject } from '@/lib/database';
import { formatDistanceToNow } from 'date-fns';
import { News } from './ui/sidebar-news';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  userPlan?: string;
  onStartNewChat?: () => void;
  onSearch?: (query: string) => void;
  onGetFreeTokens?: () => void;
  onSignOut?: () => void;
  onChatSelected?: (chatId: string) => void;
  searchQuery?: string;
}

interface ChatHistoryItem {
  id: string;
  title: string;
  date: string; // e.g., "Yesterday", "Last 7 days", "Last 30 days"
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen: initialIsOpen = false,
  onClose = () => {},
  userPlan = "Personal Plan",
  onStartNewChat = () => {},
  onSearch = () => {},
  onGetFreeTokens = () => {},
  onSignOut = () => {},
  onChatSelected = () => {},
  searchQuery: externalSearchQuery = "",
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(initialIsOpen);
  const [isPricingModalOpen, setIsPricingModalOpen] = React.useState(false);
  const [user, setUser] = React.useState<SupabaseUser | null>(null);
  const [chatHistory, setChatHistory] = React.useState<ChatHistoryItem[]>([]);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const leaveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Use external search query if provided, otherwise use internal state
  const activeSearchQuery = externalSearchQuery || searchQuery;

  // Filter chat history based on search query
  const filteredChatHistory = React.useMemo(() => {
    if (!activeSearchQuery.trim()) {
      return chatHistory;
    }
    return chatHistory.filter(chat =>
      chat.title.toLowerCase().includes(activeSearchQuery.toLowerCase())
    );
  }, [chatHistory, activeSearchQuery]);

  const groupedChats = filteredChatHistory.reduce((acc, chat) => {
    (acc[chat.date] = acc[chat.date] || []).push(chat);
    return acc;
  }, {} as Record<string, ChatHistoryItem[]>);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch(value);
  };

  const handleDeleteChat = async (chatId: string) => {
    const supabase = createSupabaseBrowserClient();
    await deleteProject(supabase, chatId);
    setChatHistory(chatHistory.filter(chat => chat.id !== chatId));
  };

  const handleOpenSidebar = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsOpen(false);
    onClose();
  };

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    
    if (!isOpen) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsOpen(true);
      }, 300);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    if (isOpen) {
      leaveTimeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 500);
    }
  };

  React.useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    
    // Skip authentication setup if Supabase is not available (development mode)
    if (!supabase) {
      return;
    }
    
    const fetchChatHistory = async () => {
      const projects = await getProjects(supabase);
      const history = projects.map((project: Project) => ({
        id: project.id,
        title: project.title,
        date: formatDistanceToNow(new Date(project.updated_at), { addSuffix: true }),
      }));
      setChatHistory(history);
    };

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        fetchChatHistory();
      }
    };
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchChatHistory();
      } else {
        setChatHistory([]);
      }
    });

    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="flex h-screen">
      {/* Always visible icons */}
      <div 
        className={`bg-background border-r border-border flex flex-col items-center py-4 transition-all duration-300 ease-in-out ${
          isOpen ? 'w-0 opacity-0 overflow-hidden' : 'w-16 opacity-100'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Top section with menu and new icons */}
        <div className="flex flex-col items-center space-y-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenSidebar}
            className="h-8 w-8 text-muted-foreground hover:text-primary dark:hover:text-foreground transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onStartNewChat}
            className="h-8 w-8 text-muted-foreground hover:text-primary dark:hover:text-foreground transition-colors"
            aria-label="Start new chat"
          >
            <Plus className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              handleOpenSidebar()
              // Focus search input after opening sidebar
              setTimeout(() => {
                const searchInput = document.querySelector('input[placeholder="Search"]') as HTMLInputElement
                if (searchInput) {
                  searchInput.focus()
                }
              }, 100)
            }}
            className="h-8 w-8 text-muted-foreground hover:text-primary dark:hover:text-foreground transition-colors"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            asChild
            className="h-8 w-8 text-muted-foreground hover:text-primary dark:hover:text-foreground transition-colors"
            aria-label="Tasks"
          >
            <Link href="/tasks">
              <ListTodo className="h-5 w-5" />
            </Link>
          </Button>
        </div>

        {/* Spacer to push bottom icons down */}
        <div className="flex-1" />

        {/* Bottom section with utility icons */}
        <div className="flex flex-col items-center space-y-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onGetFreeTokens}
            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950 transition-colors"
            aria-label="Get free tokens"
          >
            <Gift className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="h-8 w-8 text-muted-foreground hover:text-primary dark:hover:text-foreground transition-colors"
            aria-label="Settings"
          >
            <Link href="/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
          <HelpModal trigger={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary dark:hover:text-foreground transition-colors"
              aria-label="Help Center"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          } />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPricingModalOpen(true)}
            className="h-8 w-8 text-muted-foreground hover:text-primary dark:hover:text-foreground transition-colors"
            aria-label="My Subscription"
          >
            <CreditCard className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onSignOut}
            className="h-8 w-8 text-muted-foreground hover:text-primary dark:hover:text-foreground transition-colors"
            aria-label="Sign Out"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Collapsible Sidebar Content */}
      <div
        className={`h-screen bg-background border-r border-border flex flex-col transition-all duration-300 ease-in-out ${
          isOpen ? 'w-80 opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-full overflow-hidden'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Header Section */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="text-xl font-bold text-foreground">
            CodinIT.dev
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCloseSidebar}
            className="h-8 w-8 text-muted-foreground hover:text-primary dark:hover:text-foreground transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Chat Controls */}
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search"
              value={activeSearchQuery}
              onChange={handleSearchChange}
              className="pl-10 bg-muted/50 border-border transition-colors"
            />
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <h3 className="text-sm font-medium text-foreground mb-2">Your Chats</h3>
          {Object.keys(groupedChats).length === 0 ? (
            <p className="text-sm text-muted-foreground">No previous conversations</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedChats).map(([date, chats]) => (
                <div key={date}>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">{date}</h4>
                  <div className="space-y-1">
                    {chats.map((chat) => (
                      <DropdownMenu key={chat.id}>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 text-muted-foreground hover:text-primary dark:hover:text-foreground hover:bg-primary/5 dark:hover:bg-muted/50 group transition-colors"
                          >
                            <MessageCircle className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{chat.title}</span>
                            <MoreHorizontal className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start">
                          <DropdownMenuItem onClick={() => onChatSelected(chat.id)}>
                            <CornerUpLeft className="mr-2 h-4 w-4" />
                            <span>Re-enter</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteChat(chat.id)} className="text-red-500">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* News Section */}
        <div className="px-4 pb-4">
          <NewsArticles />
        </div>

        <Separator />

        {/* Utility / Navigation Links */}
        <div className="p-4 space-y-1">
          <Button
            variant="ghost"
            asChild
            className="w-full justify-start gap-3 text-muted-foreground hover:text-primary dark:hover:text-foreground transition-colors"
          >
            <Link href="/settings">
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </Button>

          <HelpModal trigger={
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-primary dark:hover:text-foreground transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
              Help Center
            </Button>
          } />

          <Button
            variant="ghost"
            onClick={() => setIsPricingModalOpen(true)}
            className="w-full justify-start gap-3 text-muted-foreground hover:text-primary dark:hover:text-foreground transition-colors"
          >
            <CreditCard className="h-4 w-4" />
            My Subscription
          </Button>

          <Button
            variant="ghost"
            onClick={onSignOut}
            className="w-full justify-start gap-3 text-muted-foreground hover:text-primary dark:hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* User Information */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.name ?? 'User'} />
              <AvatarFallback className="bg-muted text-muted-foreground">
                {user?.user_metadata?.name?.charAt(0).toUpperCase() ?? 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.user_metadata?.name ?? 'Anonymous'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {userPlan}
              </p>
            </div>
          </div>
        </div>
      </div>
      <PricingModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} />
    </div>
  );
};
