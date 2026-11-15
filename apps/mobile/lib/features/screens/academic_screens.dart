import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/env.dart';
import '../../services/remote_config_controller.dart';
import '../../widgets/campus_shell.dart';
import '../../widgets/state_views.dart';

class ModuleQueryScreen extends ConsumerStatefulWidget {
  final String title;
  final String route;
  final String moduleKey;
  final String table;
  final String orderBy;
  final IconData emptyIcon;
  final Widget Function(Map<String, dynamic> row) itemBuilder;

  const ModuleQueryScreen({
    super.key,
    required this.title,
    required this.route,
    required this.moduleKey,
    required this.table,
    required this.orderBy,
    required this.emptyIcon,
    required this.itemBuilder,
  });

  @override
  ConsumerState<ModuleQueryScreen> createState() => _ModuleQueryScreenState();
}

class _ModuleQueryScreenState extends ConsumerState<ModuleQueryScreen> {
  List<Map<String, dynamic>> _rows = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final cfg = ref.read(remoteConfigProvider).config;
    if (!CampusEnv.isSupabaseConfigured || cfg.tenantId == null) {
      setState(() {
        _loading = false;
        _rows = [];
      });
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await Supabase.instance.client
          .from(widget.table)
          .select()
          .eq('tenant_id', cfg.tenantId!)
          .order(widget.orderBy, ascending: false)
          .limit(50);
      setState(() {
        _rows = (data as List).cast<Map<String, dynamic>>();
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final cfg = ref.watch(remoteConfigProvider).config;
    if (!cfg.isModuleEnabled(widget.moduleKey)) {
      return CampusShell(
        title: widget.title,
        currentRoute: widget.route,
        child: CampusStateView(
          icon: Icons.lock_rounded,
          color: Colors.red,
          title: '${widget.title} Disabled',
          subtitle: 'This module was remotely disabled by your administrator or subscription plan.',
        ),
      );
    }

    return CampusShell(
      title: widget.title,
      currentRoute: widget.route,
      child: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? CampusStateView(
                  icon: Icons.error_outline_rounded,
                  color: Colors.red,
                  title: 'Unable to Load ${widget.title}',
                  subtitle: _error!,
                  action: ElevatedButton(onPressed: _load, child: const Text('Retry')),
                )
              : _rows.isEmpty
                  ? CampusStateView(
                      icon: widget.emptyIcon,
                      title: 'No ${widget.title} Records',
                      subtitle: 'Records added on Web or Mobile will appear here in real time.',
                      action: OutlinedButton(onPressed: _load, child: const Text('Refresh')),
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _rows.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, idx) => Card(child: widget.itemBuilder(_rows[idx])),
                      ),
                    ),
    );
  }
}

class StudentProfileScreen extends StatelessWidget {
  const StudentProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ModuleQueryScreen(
      title: 'Student Profile',
      route: '/student-profile',
      moduleKey: 'students',
      table: 'students',
      orderBy: 'created_at',
      emptyIcon: Icons.person_outline_rounded,
      itemBuilder: (r) => ListTile(
        leading: const CircleAvatar(child: Icon(Icons.person_rounded)),
        title: Text('${r['first_name'] ?? ''} ${r['last_name'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text('ID: ${r['student_code'] ?? ''} • Status: ${r['status'] ?? ''}'),
      ),
    );
  }
}

class TeacherProfileScreen extends StatelessWidget {
  const TeacherProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ModuleQueryScreen(
      title: 'Teacher Profile',
      route: '/teacher-profile',
      moduleKey: 'teachers',
      table: 'teachers',
      orderBy: 'created_at',
      emptyIcon: Icons.school_outlined,
      itemBuilder: (r) => ListTile(
        leading: const CircleAvatar(child: Icon(Icons.school_rounded)),
        title: Text('${r['full_name'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text('${r['designation'] ?? ''} • ${r['department'] ?? ''}'),
      ),
    );
  }
}

class AttendanceScreen extends ConsumerStatefulWidget {
  const AttendanceScreen({super.key});

  @override
  ConsumerState<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends ConsumerState<AttendanceScreen> {
  String _section = 'teacher';

  @override
  Widget build(BuildContext context) {
    final cfg = ref.watch(remoteConfigProvider).config;
    if (!cfg.isModuleEnabled('attendance')) {
      return const CampusShell(
        title: 'Attendance',
        currentRoute: '/attendance',
        child: CampusStateView(
          icon: Icons.lock_rounded,
          color: Colors.red,
          title: 'Attendance Disabled',
          subtitle: 'This module was remotely disabled by your administrator or subscription plan.',
        ),
      );
    }

    final table = _section == 'teacher'
        ? 'teacher_attendance'
        : _section == 'student'
            ? 'attendance'
            : 'guardian_attendance';

    return CampusShell(
      title: 'Attendance',
      currentRoute: '/attendance',
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'teacher', label: Text('Teacher')),
                ButtonSegment(value: 'student', label: Text('Student')),
                ButtonSegment(value: 'guardian', label: Text('Guardian')),
              ],
              selected: {_section},
              onSelectionChanged: (sel) => setState(() => _section = sel.first),
            ),
          ),
          Expanded(
            child: _SectionAttendanceList(key: ValueKey(table), table: table, section: _section),
          ),
        ],
      ),
    );
  }
}

class _SectionAttendanceList extends ConsumerStatefulWidget {
  final String table;
  final String section;

  const _SectionAttendanceList({super.key, required this.table, required this.section});

  @override
  ConsumerState<_SectionAttendanceList> createState() => _SectionAttendanceListState();
}

class _SectionAttendanceListState extends ConsumerState<_SectionAttendanceList> {
  List<Map<String, dynamic>> _rows = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final cfg = ref.read(remoteConfigProvider).config;
    if (!CampusEnv.isSupabaseConfigured || cfg.tenantId == null) {
      setState(() => _loading = false);
      return;
    }
    try {
      final data = await Supabase.instance.client
          .from(widget.table)
          .select()
          .eq('tenant_id', cfg.tenantId!)
          .order('attendance_date', ascending: false)
          .limit(50);
      setState(() {
        _rows = (data as List).cast<Map<String, dynamic>>();
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_rows.isEmpty) {
      return CampusStateView(
        icon: Icons.fact_check_outlined,
        title: 'No ${widget.section[0].toUpperCase()}${widget.section.substring(1)} Attendance Records',
        subtitle: 'Records marked on Web or Mobile appear here.',
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _rows.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, idx) {
        final r = _rows[idx];
        return Card(
          child: ListTile(
            leading: Icon(
              r['status'] == 'present' ? Icons.check_circle_rounded : Icons.cancel_rounded,
              color: r['status'] == 'present' ? Colors.green : Colors.red,
            ),
            title: Text('Date: ${r['attendance_date'] ?? ''}'),
            subtitle: Text(
              widget.section == 'guardian'
                  ? 'Status: ${(r['status'] ?? '').toString().toUpperCase()} • Purpose: ${r['visit_purpose'] ?? 'ptm'}'
                  : 'Status: ${(r['status'] ?? '').toString().toUpperCase()}',
            ),
          ),
        );
      },
    );
  }
}

class ExaminationScreen extends StatelessWidget {
  const ExaminationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ModuleQueryScreen(
      title: 'Examinations',
      route: '/exams',
      moduleKey: 'exams',
      table: 'exams',
      orderBy: 'created_at',
      emptyIcon: Icons.assignment_outlined,
      itemBuilder: (r) => ListTile(
        leading: const Icon(Icons.assignment_rounded),
        title: Text('${r['name'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text('${r['category'] ?? ''} • Status: ${r['status'] ?? ''}'),
      ),
    );
  }
}

class ResultsScreen extends StatelessWidget {
  const ResultsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ModuleQueryScreen(
      title: 'Results',
      route: '/results',
      moduleKey: 'results',
      table: 'results',
      orderBy: 'created_at',
      emptyIcon: Icons.emoji_events_outlined,
      itemBuilder: (r) => ListTile(
        leading: const Icon(Icons.emoji_events_rounded, color: Colors.amber),
        title: Text('Grade ${r['grade'] ?? ''} • GPA ${r['gpa'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text('${r['total_marks'] ?? 0} / ${r['max_total_marks'] ?? 0} (${r['percentage'] ?? 0}%) • Rank #${r['rank_position'] ?? '-'}'),
      ),
    );
  }
}

class HomeworkScreen extends StatelessWidget {
  const HomeworkScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ModuleQueryScreen(
      title: 'Homework',
      route: '/homework',
      moduleKey: 'homework',
      table: 'homework',
      orderBy: 'due_date',
      emptyIcon: Icons.edit_note_rounded,
      itemBuilder: (r) => ListTile(
        leading: const Icon(Icons.edit_note_rounded),
        title: Text('${r['title'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text('Due: ${r['due_date'] ?? ''}\n${r['description'] ?? ''}'),
      ),
    );
  }
}

class TimetableScreen extends StatelessWidget {
  const TimetableScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ModuleQueryScreen(
      title: 'Timetable',
      route: '/timetable',
      moduleKey: 'timetable',
      table: 'timetables',
      orderBy: 'day_of_week',
      emptyIcon: Icons.schedule_rounded,
      itemBuilder: (r) => ListTile(
        leading: const Icon(Icons.schedule_rounded),
        title: Text('Day ${r['day_of_week'] ?? ''} • ${r['start_time'] ?? ''} - ${r['end_time'] ?? ''}'),
        subtitle: Text('Room: ${r['room_number'] ?? 'TBA'}'),
      ),
    );
  }
}
