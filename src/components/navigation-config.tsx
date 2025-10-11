import { 
  LayoutDashboard, 
  Building2, 
  Compass, 
  User, 
  Users, 
  Settings, 
  BarChart3,
  Home,
  FileText,
  FolderKanban,
  FileCheck,
  MessageSquare,
  Calendar,
  GraduationCap,
  Grid3x3,
  Crown,
  ChevronDown,
  ChevronRight
} from "lucide-react"

export interface MaticNavigationItem {
  id: string
  label: string
  href?: string
  icon: any
  badge?: string
  premium?: boolean
  roles?: string[]
  children?: MaticNavigationItem[]
  isExpandable?: boolean
}

// Main app navigation (when not in a workspace)
export const mainNavigation: MaticNavigationItem[] = [
  
  {
    id: "explore",
    label: "Explore",
    href: "/explore",
    icon: Compass
  },
  {
    id: "profile",
    label: "Profile", 
    href: "/profile",
    icon: User
  }
]

// Workspace-specific navigation
export const workspaceNavigation: MaticNavigationItem[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/w/[slug]",
    icon: Home
  },
  {
    id: "members",
    label: "Members",
    href: "/w/[slug]/members",
    icon: Users
  },
  {
    id: "modules",
    label: "Modules",
    icon: Grid3x3,
    isExpandable: true,
    children: [
      {
        id: "forms",
        label: "Forms",
        href: "/w/[slug]/forms",
        icon: FileText,
        premium: false
      },
      {
        id: "projects",
        label: "Projects",
        href: "/w/[slug]/projects",
        icon: FolderKanban,
        premium: false
      },
      {
        id: "documents",
        label: "Documents",
        href: "/w/[slug]/documents",
        icon: FileCheck,
        premium: false
      },
      {
        id: "discussions",
        label: "Discussions",
        href: "/w/[slug]/discussions",
        icon: MessageSquare,
        premium: false
      },
      {
        id: "scheduling",
        label: "Scheduling",
        href: "/w/[slug]/scheduling",
        icon: Calendar,
        premium: true,
        badge: "Pro"
      },
      {
        id: "learning",
        label: "Learning",
        href: "/w/[slug]/learning",
        icon: GraduationCap,
        premium: true,
        badge: "Pro"
      }
    ]
  },
  {
    id: "analytics",
    label: "Analytics",
    href: "/w/[slug]/analytics",
    icon: BarChart3,
    roles: ["owner", "admin"],
    premium: true,
    badge: "Pro"
  },
  {
    id: "settings",
    label: "Settings",
    href: "/w/[slug]/settings",
    icon: Settings,
    roles: ["owner", "admin"]
  }
]

// Helper function to filter navigation by user role
export function filterNavigationByRole(
  navigation: MaticNavigationItem[], 
  userRole?: string
): MaticNavigationItem[] {
  return navigation.filter(item => {
    if (item.roles && userRole) {
      return item.roles.includes(userRole)
    }
    return true
  }).map(item => ({
    ...item,
    children: item.children ? filterNavigationByRole(item.children, userRole) : undefined
  }))
}

// Helper function to replace [slug] with actual workspace slug
export function replaceSlugInNavigation(
  navigation: MaticNavigationItem[], 
  slug: string
): MaticNavigationItem[] {
  return navigation.map(item => ({
    ...item,
    href: item.href?.replace('[slug]', slug),
    children: item.children ? replaceSlugInNavigation(item.children, slug) : undefined
  }))
}