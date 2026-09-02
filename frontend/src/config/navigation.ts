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
  Cloud,
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
  TrendingUp,
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
  Palette,
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
    group: 'SALES & ORDERS',
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
        title: 'Returns & Refunds',
        href: '/admin/returns',
        icon: Undo2,
        implemented: true,
      },
    ],
  },
  {
    group: 'CATALOG & PRODUCTS',
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
        id: 'size-charts',
        title: 'Size Charts',
        href: '/admin/catalog/size-charts',
        icon: Ruler,
        implemented: true,
      },
      {
        id: 'reviews',
        title: 'Reviews & Ratings',
        href: '/admin/reviews',
        icon: Sparkles,
        implemented: true,
      },
    ],
  },
  {
    group: 'INVENTORY & WAREHOUSE',
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
        id: 'stock-transfers',
        title: 'Stock Transfers',
        href: '/admin/inventory/movements',
        icon: ArrowLeftRight,
        implemented: true,
      },
      {
        id: 'low-stock-alerts',
        title: 'Low Stock Alerts',
        href: '/admin/inventory',
        icon: Package,
        implemented: true,
      },
    ],
  },
  {
    group: 'SHOPORA POS & RETAIL',
    items: [
      {
        id: 'pos',
        title: 'POS',
        href: '/pos',
        icon: Store,
        implemented: true,
      },
      {
        id: 'store-management',
        title: 'Store Management',
        href: '/pos/shift',
        icon: Activity,
        implemented: true,
      },
      {
        id: 'pos-orders',
        title: 'POS Orders',
        href: '/admin/quotations',
        icon: FileText,
        implemented: true,
      },
    ],
  },
  {
    group: 'SHIPPING & LOGISTICS',
    items: [
      {
        id: 'shipments',
        title: 'Shipments',
        href: '/admin/shipping',
        icon: Truck,
        implemented: true,
      },
      {
        id: 'delivery-partners',
        title: 'Delivery Partners',
        href: '/admin/shipping/dtdc',
        icon: Truck,
        implemented: true,
      },
      {
        id: 'tracking',
        title: 'Tracking',
        href: '/admin/shipping',
        icon: Search,
        implemented: true,
      },
      {
        id: 'shipping-settings',
        title: 'Shipping Settings',
        href: '/admin/shipping',
        icon: Sliders,
        implemented: true,
      },
    ],
  },
  {
    group: 'ANALYTICS & REPORTS',
    items: [
      {
        id: 'sales-analytics',
        title: 'Sales Analytics',
        href: '/admin/analytics/sales',
        icon: BarChart3,
        implemented: true,
      },
      {
        id: 'product-analytics',
        title: 'Product Analytics',
        href: '/admin/analytics/products',
        icon: ShoppingBag,
        implemented: true,
      },
      {
        id: 'customer-analytics',
        title: 'Customer Analytics',
        href: '/admin/analytics/customers',
        icon: Users,
        implemented: true,
      },
      {
        id: 'reports',
        title: 'Reports',
        href: '/admin/reports',
        icon: FileText,
        implemented: true,
      },
    ],
  },
  {
    group: 'FINANCIALS & ACCOUNTS',
    items: [
      {
        id: 'payments',
        title: 'Payments',
        href: '/admin/payments',
        icon: CreditCard,
        implemented: true,
      },
      {
        id: 'transactions',
        title: 'Transactions',
        href: '/admin/payments',
        icon: Receipt,
        implemented: true,
      },
      {
        id: 'invoices',
        title: 'Invoices',
        href: '/admin/invoices',
        icon: FileText,
        implemented: true,
      },
      {
        id: 'expenses',
        title: 'Expenses',
        href: '/admin/refunds',
        icon: Undo2,
        implemented: true,
      },
    ],
  },
  {
    group: 'CUSTOMERS & STAFF',
    items: [
      {
        id: 'customers',
        title: 'Customers',
        href: '/admin/customers',
        icon: Users,
        implemented: true,
      },
      {
        id: 'staff',
        title: 'Staff',
        href: '/admin/staff',
        icon: UserCheck,
        implemented: true,
      },
      {
        id: 'roles-permissions',
        title: 'Roles & Permissions',
        href: '/admin/access/matrix',
        icon: Key,
        implemented: true,
      },
    ],
  },
  {
    group: 'SETTINGS & SYSTEM',
    items: [
      {
        id: 'general-settings',
        title: 'General Settings',
        href: '/admin/settings',
        icon: Settings,
        implemented: true,
      },
      {
        id: 'notifications',
        title: 'Notifications',
        href: '/admin/communication/otp',
        icon: Mail,
        implemented: true,
      },
      {
        id: 'integrations',
        title: 'Integrations',
        href: '/admin/communication/push',
        icon: Smartphone,
        implemented: true,
      },
      {
        id: 'system-settings',
        title: 'System Settings',
        href: '/admin/access/session-settings',
        icon: History,
        implemented: true,
      },
    ],
  },
];

export const legacyAdminNavigation = [
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
        id: 'shopora-quotations',
        title: 'Quotations',
        href: '/admin/quotations',
        icon: FileText,
        permissions: ['quotations:view'],
        implemented: true,
      },
      {
        id: 'shopora-pos-returns',
        title: 'Counter Returns',
        href: '/pos/returns',
        icon: Undo2,
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
      // These four pages shipped without nav entries, so the only route to
      // them was the tile grid on /admin/storefront (and Categories/Footer had
      // no link at all). Feature Toggles is where returns/loyalty visibility is
      // controlled -- unreachable from the sidebar meant unusable in practice.
      // Restricted to super_admin here to match the API, which refuses the
      // theme endpoints for anyone else -- showing the link to an admin who
      // cannot use it is just a dead end.
      { id: 'storefront-theme', title: 'Colours & Theme', href: '/admin/storefront/theme', icon: Palette, roles: ['super_admin'], implemented: true },
      { id: 'storefront-features', title: 'Feature Toggles', href: '/admin/storefront/features', icon: ToggleLeft, permissions: ['storefront.manage'], implemented: true },
      { id: 'storefront-homepage', title: 'Homepage', href: '/admin/storefront/homepage', icon: Layout, permissions: ['storefront.manage'], implemented: true },
      { id: 'storefront-categories', title: 'Category Display', href: '/admin/storefront/categories', icon: LayoutGrid, permissions: ['storefront.manage'], implemented: true },
      { id: 'storefront-footer', title: 'Footer', href: '/admin/storefront/footer', icon: FolderOpen, permissions: ['storefront.manage'], implemented: true },
    ],
  },
  {
    group: 'AI & RAG',
    items: [
      { id: 'ai-prompt-templates', title: 'AI Prompt Templates', href: '/admin/ai/prompts', icon: Sparkles, roles: ['super_admin'], implemented: true },
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
      {
        id: 'aws-billing',
        title: 'AWS Billing & Storage',
        href: '/admin/aws-billing',
        icon: Cloud,
        implemented: true,
      },
    ],
  },
];
