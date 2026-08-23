import {
  Ruler,
  LayoutDashboard,
  ShoppingBag,
  FolderOpen,
  Tag,
  Sliders,
  Image,
  Package,
  Home,
  ArrowLeftRight,
  ShoppingCart,
  Undo2,
  XCircle,
  CreditCard,
  Receipt,
  Gift,
  Flame,
  Megaphone,
  Share2,
  Video,
  ShieldAlert,
  FileText,
  LayoutGrid,
  HelpCircle,
  Bot,
  Brain,
  MessageSquare,
  BarChart3,
  Users,
  MessageSquareHeart,
  Mail,
  UserCheck,
  Key,
  Settings,
  History,
  Activity,
  Store,
  Newspaper,
  Wrench,
  Layout,
  ToggleLeft,
  Link2,
  Search,
  Sparkles,
  PhoneCall,
  Smartphone,
  KeyRound,
  Award,
  Truck,
  Timer,
} from 'lucide-react';

export interface NavItem {
  id: string;
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  permissions?: string[];
  implemented: boolean;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

// Longest-href-first so a specific page (e.g. /admin/access/roles) wins over
// a shorter sibling that happens to share a prefix.
export function findNavItemForPath(pathname: string): NavItem | undefined {
  const allItems = adminNavigation.flatMap((g) => g.items);
  return allItems
    .slice()
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}

export const adminNavigation: NavGroup[] = [
  {
    group: 'OVERVIEW',
    items: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
        implemented: true,
      },
    ],
  },
  {
    group: 'ANALYTICS',
    items: [
      {
        id: 'analytics-sales',
        title: 'Sales Analytics',
        href: '/admin/analytics/sales',
        icon: BarChart3,
        implemented: true,
      },
      {
        id: 'analytics-orders',
        title: 'Order Analytics',
        href: '/admin/analytics/orders',
        icon: ShoppingCart,
        implemented: true,
      },
      {
        id: 'analytics-products',
        title: 'Product Analytics',
        href: '/admin/analytics/products',
        icon: ShoppingBag,
        implemented: true,
      },
      {
        id: 'analytics-inventory',
        title: 'Inventory Analytics',
        href: '/admin/analytics/inventory',
        icon: Package,
        implemented: true,
      },
      {
        id: 'analytics-customers',
        title: 'Customer Analytics',
        href: '/admin/analytics/customers',
        icon: Users,
        implemented: true,
      },
      {
        id: 'analytics-social',
        title: 'Social Analytics',
        href: '/admin/analytics/social',
        icon: Share2,
        implemented: true,
      },
    ],
  },
  {
    group: 'REPORTS & EXPORTS',
    items: [
      {
        id: 'reports-center',
        title: 'Report Center',
        href: '/admin/reports',
        icon: FileText,
        implemented: true,
      },
      {
        id: 'export-jobs',
        title: 'Export Jobs',
        href: '/admin/reports/exports',
        icon: History,
        implemented: true,
      },
    ],
  },
  {
    group: 'OPERATIONS',
    items: [
      {
        id: 'command-center',
        title: 'Command Center',
        href: '/admin/operations',
        icon: Activity,
        implemented: true,
      },
      {
        id: 'notifications',
        title: 'Notifications',
        href: '/admin/notifications',
        icon: Mail,
        implemented: true,
      },
    ],
  },
  {
    group: 'COMMUNICATION',
    items: [
      {
        id: 'communication-sms',
        title: 'SMS Gateway',
        href: '/admin/communication/sms',
        icon: PhoneCall,
        implemented: true,
      },
      {
        id: 'communication-push',
        title: 'Push Notifications',
        href: '/admin/communication/push',
        icon: Smartphone,
        implemented: true,
      },
      {
        id: 'communication-otp',
        title: 'OTP Gateway',
        href: '/admin/communication/otp',
        icon: KeyRound,
        implemented: true,
      },
    ],
  },
  {
    group: 'CATALOG',
    items: [
      {
        id: 'products',
        title: 'Products',
        href: '/admin/catalog/products',
        icon: ShoppingBag,
        implemented: true,
      },
      {
        id: 'categories',
        title: 'Categories',
        href: '/admin/catalog/categories',
        icon: FolderOpen,
        implemented: true,
      },
      {
        id: 'brands',
        title: 'Brands',
        href: '/admin/catalog/brands',
        icon: Tag,
        implemented: true,
      },
      {
        id: 'attributes',
        title: 'Attributes',
        href: '/admin/catalog/attributes',
        icon: Sliders,
        implemented: true,
      },
      {
        id: 'size-charts',
        title: 'Size Charts',
        href: '/admin/catalog/size-charts',
        icon: Ruler,
        implemented: true,
      },
      {
        id: 'media',
        title: 'Media',
        href: '/admin/catalog/media',
        icon: Image,
        implemented: true,
      },
    ],
  },
  {
    group: 'INVENTORY',
    items: [
      {
        id: 'inventory',
        title: 'Inventory',
        href: '/admin/inventory',
        icon: Package,
        implemented: true,
      },
      {
        id: 'warehouses',
        title: 'Warehouses',
        href: '/admin/warehouses',
        icon: Home,
        implemented: true,
      },
      {
        id: 'stock-movements',
        title: 'Stock Movements',
        href: '/admin/inventory/movements',
        icon: ArrowLeftRight,
        implemented: true,
      },
      {
        id: 'shipping',
        title: 'Shipping Operations',
        href: '/admin/shipping',
        icon: Sliders,
        implemented: true,
      },
      {
        id: 'shipping-dtdc',
        title: 'DTDC Shipping',
        href: '/admin/shipping/dtdc',
        icon: Truck,
        implemented: true,
      },
    ],
  },
  {
    group: 'SHOPORA POS & RETAIL',
    items: [
      {
        id: 'shopora-pos',
        title: 'Desktop Web POS',
        href: '/pos',
        icon: ShoppingBag,
        implemented: true,
      },
      {
        id: 'shopora-pos-dashboard',
        title: 'Till & Shift Dashboard',
        href: '/pos/dashboard',
        icon: Activity,
        permissions: ['pos:view'],
        implemented: true,
      },
      {
        id: 'shopora-add-stock',
        title: 'Add Stock & Print Labels',
        href: '/pos/add-stock',
        icon: Package,
        implemented: true,
      },
      {
        id: 'shopora-printers',
        title: 'Printers & Hardware',
        href: '/pos/printers',
        icon: Sliders,
        implemented: true,
      },
    ],
  },
  {
    group: 'SALES',
    items: [
      {
        id: 'orders',
        title: 'Orders',
        href: '/admin/orders',
        icon: ShoppingCart,
        implemented: true,
      },
      {
        id: 'returns',
        title: 'Returns',
        href: '/admin/returns',
        icon: Undo2,
        implemented: true,
      },
      {
        id: 'cancellations',
        title: 'Cancellations',
        href: '/admin/cancellations',
        icon: XCircle,
        implemented: true,
      },
      {
        id: 'payments',
        title: 'Payments',
        href: '/admin/payments',
        icon: CreditCard,
        implemented: true,
      },
      {
        id: 'refunds',
        title: 'Refunds',
        href: '/admin/refunds',
        icon: Undo2,
        implemented: true,
      },
      {
        id: 'invoices',
        title: 'Invoices',
        href: '/admin/invoices',
        icon: Receipt,
        implemented: true,
      },
    ],
  },
  {
    group: 'PROMOTIONS',
    items: [
      {
        id: 'coupons',
        title: 'Coupons',
        href: '/admin/promotions/coupons',
        icon: Gift,
        implemented: true,
      },
      {
        id: 'offers',
        title: 'Offers',
        href: '/admin/promotions/offers',
        icon: Flame,
        implemented: true,
      },
      {
        id: 'campaigns',
        title: 'Campaigns',
        href: '/admin/promotions/campaigns',
        icon: Megaphone,
        implemented: true,
      },
    ],
  },
  {
    group: 'MARKETING & LOYALTY',
    items: [
      {
        id: 'gift-cards',
        title: 'Gift Cards',
        href: '/admin/gift-cards',
        icon: Gift,
        implemented: true,
      },
      {
        id: 'loyalty',
        title: 'Loyalty Program',
        href: '/admin/loyalty',
        icon: Award,
        implemented: true,
      },
      {
        id: 'referral',
        title: 'Referral Program',
        href: '/admin/referral',
        icon: Share2,
        implemented: true,
      },
    ],
  },
  {
    group: 'SOCIAL COMMERCE',
    items: [
      {
        id: 'posts',
        title: 'Posts',
        href: '/admin/social?tab=posts',
        icon: Share2,
        implemented: true,
      },
      {
        id: 'reels',
        title: 'Reels',
        href: '/admin/social?tab=reels',
        icon: Video,
        implemented: true,
      },
      {
        id: 'moderation',
        title: 'Moderation',
        href: '/admin/social?tab=reports',
        icon: ShieldAlert,
        implemented: true,
      },
    ],
  },
  {
    group: 'CONTENT',
    items: [
      {
        id: 'announcement-bar',
        title: 'Announcement Bar',
        href: '/admin/storefront/announcement-bar',
        icon: Megaphone,
        implemented: true,
      },
      {
        id: 'banners',
        title: 'Banners',
        href: '/admin/banners',
        icon: Image,
        implemented: true,
      },
      {
        id: 'pages',
        title: 'Pages',
        href: '/admin/cms/pages',
        icon: FileText,
        implemented: true,
      },
      {
        id: 'sections',
        title: 'Sections',
        href: '/admin/cms/sections',
        icon: LayoutGrid,
        implemented: true,
      },
      {
        id: 'testimonials',
        title: 'Testimonials',
        href: '/admin/cms/testimonials',
        icon: MessageSquareHeart,
        implemented: true,
      },
      {
        id: 'faqs',
        title: 'FAQs',
        href: '/admin/faqs',
        icon: HelpCircle,
        implemented: true,
      },
    ],
  },
  {
    group: 'STOREFRONT',
    items: [
      { id: 'storefront-dashboard', title: 'Dashboard', href: '/admin/storefront', icon: LayoutDashboard, permissions: ['storefront.view'], implemented: true },
      { id: 'storefront-announcement-bar', title: 'Announcement Bar', href: '/admin/storefront/announcement-bar', icon: Megaphone, permissions: ['storefront.manage'], implemented: true },
      { id: 'storefront-store', title: 'Store Information', href: '/admin/storefront/store', icon: Store, permissions: ['storefront.manage'], implemented: true },
      { id: 'storefront-social', title: 'Social Links', href: '/admin/storefront/social', icon: Share2, permissions: ['storefront.manage'], implemented: true },
      { id: 'storefront-seo', title: 'SEO', href: '/admin/storefront/seo', icon: Search, permissions: ['storefront.manage'], implemented: true },
      { id: 'storefront-newsletter', title: 'Newsletter', href: '/admin/storefront/newsletter', icon: Newspaper, permissions: ['storefront.view'], implemented: true },
      { id: 'storefront-maintenance', title: 'Maintenance', href: '/admin/storefront/maintenance', icon: Wrench, permissions: ['storefront.manage'], implemented: true },
    ],
  },
  {
    group: 'AI & RAG',
    items: [
      {
        id: 'rag-overview',
        title: 'RAG Overview',
        href: '/admin/ai/rag',
        icon: LayoutDashboard,
        implemented: true,
      },
      {
        id: 'rag-agents',
        title: 'Agents',
        href: '/admin/ai/rag/agents',
        icon: Bot,
        implemented: true,
      },
      {
        id: 'rag-knowledge',
        title: 'Knowledge Base',
        href: '/admin/ai/rag/knowledge',
        icon: Brain,
        implemented: true,
      },
      {
        id: 'rag-ingestion',
        title: 'Ingestion',
        href: '/admin/ai/rag/ingestion',
        icon: Activity,
        implemented: true,
      },
      {
        id: 'rag-conversations',
        title: 'Conversations',
        href: '/admin/ai/rag/conversations',
        icon: MessageSquare,
        implemented: true,
      },
      {
        id: 'rag-metrics',
        title: 'Metrics',
        href: '/admin/ai/rag/metrics',
        icon: BarChart3,
        implemented: true,
      },
      {
        id: 'rag-playground',
        title: 'RAG Playground',
        href: '/admin/ai/rag/playground',
        icon: Sliders,
        implemented: true,
      },
      {
        id: 'ai-chat',
        title: 'AI Assistant Chat',
        href: '/admin/ai/chat',
        icon: Bot,
        implemented: true,
      },
      {
        id: 'ai-search',
        title: 'AI Search Analytics',
        href: '/admin/ai/search',
        icon: Search,
        implemented: true,
      },
      {
        id: 'ai-recommendations',
        title: 'AI Recommendations',
        href: '/admin/ai/recommendations',
        icon: Sparkles,
        implemented: true,
      },
    ],
  },
  {
    group: 'CUSTOMERS',
    items: [
      {
        id: 'customers',
        title: 'Customers',
        href: '/admin/customers',
        icon: Users,
        implemented: true,
      },
      {
        id: 'reviews',
        title: 'Reviews',
        href: '/admin/customers/reviews',
        icon: MessageSquareHeart,
        implemented: true,
      },
    ],
  },
  {
    group: 'STAFF & ACCESS',
    items: [
      {
        id: 'staff',
        title: 'Staff',
        href: '/admin/staff',
        icon: UserCheck,
        roles: ['super_admin', 'admin'],
        implemented: true,
      },
      {
        id: 'roles',
        title: 'Roles',
        href: '/admin/access/roles',
        icon: Key,
        roles: ['super_admin', 'admin'],
        implemented: true,
      },
      {
        id: 'permissions',
        title: 'Permissions',
        href: '/admin/access/permissions',
        icon: ShieldAlert,
        roles: ['super_admin', 'admin'],
        implemented: true,
      },
      {
        id: 'matrix',
        title: 'RBAC Matrix',
        href: '/admin/access/matrix',
        icon: Sliders,
        roles: ['super_admin', 'admin'],
        implemented: true,
      },
      {
        id: 'session-settings',
        title: 'Login Sessions',
        href: '/admin/access/session-settings',
        icon: Timer,
        roles: ['super_admin'],
        implemented: true,
      },
    ],
  },
  {
    group: 'SYSTEM',
    items: [
      {
        id: 'settings',
        title: 'Settings',
        href: '/admin/settings',
        icon: Settings,
        implemented: true,
      },
      {
        id: 'audit-logs',
        title: 'Audit Logs',
        href: '/admin/audit',
        icon: History,
        roles: ['super_admin', 'admin'],
        implemented: true,
      },
      {
        id: 'payment-gateways',
        title: 'Payment Gateways',
        href: '/admin/system/payment-gateways',
        icon: CreditCard,
        roles: ['super_admin'],
        implemented: true,
      },
      {
        id: 'feature-flags',
        title: 'Feature Flags Control',
        href: '/admin/system/feature-flags',
        icon: ToggleLeft,
        roles: ['super_admin'],
        implemented: true,
      },
      {
        id: 'health',
        title: 'System Health',
        href: '/admin/system/health',
        icon: Activity,
        implemented: true,
      },
    ],
  },
];
