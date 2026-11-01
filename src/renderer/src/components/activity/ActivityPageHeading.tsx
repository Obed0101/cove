import { useAppStore } from '@/store'
import { Badge } from '@/components/ui/badge'
import { WorkspacePageHeading } from '@/components/workspace-page/WorkspacePageHeading'
import { useActivityUnreadCount } from './useActivityUnreadCount'
import { translate } from '@/i18n/i18n'

// Cove: Activity is the Inbox page; the sidebar stays, so Back to workspace replaces the titlebar back arrow.
export function ActivityPageHeading(): React.JSX.Element {
  const unreadCount = useActivityUnreadCount()
  const closeActivityPage = useAppStore((s) => s.closeActivityPage)

  return (
    <WorkspacePageHeading
      title={translate('auto.components.sidebar.SidebarNav.inbox', 'Inbox')}
      description={translate(
        'workspacePage.inboxDescription',
        'Agent updates that need your attention.'
      )}
      onBack={closeActivityPage}
    >
      {unreadCount > 0 ? (
        <Badge variant="secondary" className="h-5 px-1.5 text-[11px] font-normal tabular-nums">
          {unreadCount}{' '}
          {translate('auto.components.activity.ActivityTitlebarControls.f915168c8e', 'unread')}
        </Badge>
      ) : null}
    </WorkspacePageHeading>
  )
}
