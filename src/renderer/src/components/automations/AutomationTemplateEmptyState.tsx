import React from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { translate } from '@/i18n/i18n'
import { cn } from '@/lib/utils'
import { getAutomationTemplates, type AutomationTemplate } from './automation-templates'

const TEMPLATE_CATEGORY_DOT_CLASS_NAMES: Record<string, string> = {
  'repo-health-weekday': 'bg-status-success',
  'release-prep-weekly': 'bg-callout-important',
  'recurring-review-daily': 'bg-callout-note',
  'maintenance-hourly': 'bg-status-warning'
}

type AutomationTemplateEmptyStateProps = {
  onOpenCreate: (template?: AutomationTemplate) => void
}

export function AutomationTemplateEmptyState({
  onOpenCreate
}: AutomationTemplateEmptyStateProps): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-2xl gap-2 p-4">
      <div className="px-1 pb-1 text-sm font-medium">
        {translate(
          'auto.components.automations.AutomationsPage.d207ab4c25',
          'Start from a template'
        )}
      </div>
      {getAutomationTemplates().map((template) => (
        <button
          key={template.id}
          type="button"
          onClick={() => onOpenCreate(template)}
          className="rounded-md border border-border/70 bg-background px-3 py-2 text-left shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase text-muted-foreground">
            <span
              aria-hidden
              className={cn(
                'size-1.5 rounded-full',
                TEMPLATE_CATEGORY_DOT_CLASS_NAMES[template.id] ?? 'bg-muted-foreground'
              )}
            />
            {template.category}
          </div>
          <div className="mt-1 text-sm font-medium">{template.label}</div>
          <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {template.description}
          </div>
        </button>
      ))}
      <Button
        type="button"
        variant="outline"
        className="mt-1 w-full justify-start"
        onClick={() => onOpenCreate()}
      >
        <Plus className="size-4" />
        {translate('auto.components.automations.AutomationsPage.25060635c6', 'Add new')}
      </Button>
    </div>
  )
}
