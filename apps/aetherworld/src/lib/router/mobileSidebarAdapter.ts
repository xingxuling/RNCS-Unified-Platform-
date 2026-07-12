/**
 * Mobile Sidebar Adapter
 */
export function isMobileViewport(width: number): boolean {
  return width < 768;
}

export interface MobileSidebarOptions {
  autoCloseOnNavigate: boolean;
  showSearch: boolean;
  hideFounderRoutes: boolean;
}

export const DEFAULT_MOBILE_OPTIONS: MobileSidebarOptions = {
  autoCloseOnNavigate: true,
  showSearch: true,
  hideFounderRoutes: true,
};
