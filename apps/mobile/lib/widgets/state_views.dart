import 'package:flutter/material.dart';

class CampusStateView extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Widget? action;
  final Color? color;

  const CampusStateView({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    this.action,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircleAvatar(
              radius: 28,
              backgroundColor: (color ?? Theme.of(context).colorScheme.primary).withValues(alpha: 0.12),
              child: Icon(icon, size: 28, color: color ?? Theme.of(context).colorScheme.primary),
            ),
            const SizedBox(height: 16),
            Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold), textAlign: TextAlign.center),
            const SizedBox(height: 6),
            Text(subtitle, style: Theme.of(context).textTheme.bodySmall, textAlign: TextAlign.center),
            if (action != null) ...[
              const SizedBox(height: 16),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}

IconData resolveCampusIcon(String name) {
  switch (name) {
    case 'LayoutDashboard':
      return Icons.dashboard_rounded;
    case 'CalendarCheck2':
      return Icons.fact_check_rounded;
    case 'ClipboardList':
      return Icons.assignment_rounded;
    case 'Award':
      return Icons.emoji_events_rounded;
    case 'CreditCard':
      return Icons.credit_card_rounded;
    case 'NotebookPen':
      return Icons.edit_note_rounded;
    case 'Clock':
      return Icons.schedule_rounded;
    case 'Bell':
      return Icons.notifications_rounded;
    case 'Users':
      return Icons.people_rounded;
    case 'GraduationCap':
      return Icons.school_rounded;
    case 'Settings':
      return Icons.settings_rounded;
    case 'Sparkles':
      return Icons.auto_awesome_rounded;
    default:
      return Icons.grid_view_rounded;
  }
}
