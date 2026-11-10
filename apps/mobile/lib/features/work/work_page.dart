import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import 'work_repository.dart';

class WorkPage extends StatefulWidget {
  const WorkPage({
    required this.repository,
    required this.accessToken,
    required this.userId,
    required this.isTeamLeader,
    super.key,
  });

  final WorkRepository repository;
  final String accessToken;
  final String userId;
  final bool isTeamLeader;

  @override
  State<WorkPage> createState() => _WorkPageState();
}

class _WorkPageState extends State<WorkPage> {
  TalentTeam? _team;
  List<AssignedTask>? _tasks;
  List<TalentReport>? _reports;
  Map<String, List<WorkFile>> _taskFiles = {};
  Map<String, List<WorkFile>> _reportFiles = {};
  Map<String, String> _fileErrors = {};
  bool _loading = true;
  final Set<String> _busyItems = {};
  String? _error;

  bool get _canManageReports =>
      widget.isTeamLeader &&
      (_team?.members.any(
            (member) =>
                member.userId == widget.userId && member.role == 'LEADER',
          ) ??
          false);

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final values = await Future.wait<Object>([
        widget.repository.getMyTeam(widget.accessToken),
        widget.repository.getMyTasks(widget.accessToken),
        widget.repository.getMyReports(widget.accessToken),
      ]);
      if (!mounted) return;
      final team = values[0] as TalentTeam;
      final tasks = values[1] as List<AssignedTask>;
      final reports = values[2] as List<TalentReport>;
      setState(() {
        _team = team;
        _tasks = tasks;
        _reports = reports;
      });
      await _loadAttachments(tasks, reports);
    } catch (error) {
      if (mounted) setState(() => _error = _loadError(error));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadAttachments(
    List<AssignedTask> tasks,
    List<TalentReport> reports,
  ) async {
    final errors = <String, String>{};
    Future<Map<String, List<WorkFile>>> loadFiles(
      Iterable<String> ids,
      Future<List<WorkFile>> Function(String id) loader,
    ) async {
      final entries = await Future.wait(
        ids.map((id) async {
          try {
            return MapEntry(id, await loader(id));
          } catch (error) {
            errors[id] = error.toString();
            return MapEntry(id, const <WorkFile>[]);
          }
        }),
      );
      return Map<String, List<WorkFile>>.fromEntries(entries);
    }

    final groups = await Future.wait([
      loadFiles(
        tasks.map((task) => task.id),
        (id) => widget.repository.getTaskFiles(id, widget.accessToken),
      ),
      loadFiles(
        reports.map((report) => report.id),
        (id) => widget.repository.getReportFiles(id, widget.accessToken),
      ),
    ]);
    if (!mounted) return;
    setState(() {
      _taskFiles = groups[0];
      _reportFiles = groups[1];
      _fileErrors = errors;
    });
  }

  String _loadError(Object error) {
    if (error is ApiException && error.statusCode == 404) {
      return 'Chưa có nhóm hoặc dự án được phân công cho tài khoản này.';
    }
    return error.toString();
  }

  Future<void> _startTask(AssignedTask task) async {
    await _runTaskAction(task.id, () async {
      await widget.repository.startTask(task.id, widget.accessToken);
    });
  }

  Future<void> _submitTask(AssignedTask task) async {
    final content = await _promptForText(
      title: 'Nộp kết quả công việc',
      label: 'Mô tả kết quả / liên kết bàn giao',
      submitLabel: 'Nộp',
      maxLength: 5000,
    );
    if (content == null || !mounted) return;
    await _runTaskAction(task.id, () async {
      await widget.repository.submitTask(
        taskId: task.id,
        content: content,
        templateVersion: task.templateVersion,
        accessToken: widget.accessToken,
      );
    });
  }

  Future<void> _runTaskAction(String taskId, Future<void> Function() action) async {
    setState(() {
      _busyItems.add(taskId);
      _error = null;
    });
    String? actionError;
    try {
      await action();
    } catch (error) {
      actionError = _actionError(error);
    } finally {
      if (mounted) setState(() => _busyItems.remove(taskId));
      if (mounted) {
        await _load();
        if (actionError != null && mounted) {
          setState(() => _error = actionError);
        }
      }
    }
  }

  Future<void> _createReport() async {
    final input = await _promptForReport();
    if (input == null || !mounted) return;
    setState(() {
      _busyItems.add('new-report');
      _error = null;
    });
    String? actionError;
    try {
      await widget.repository.createTeamReport(
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        summary: input.summary,
        progress: input.progress,
        blockers: input.blockers,
        nextSteps: input.nextSteps,
        accessToken: widget.accessToken,
      );
    } catch (error) {
      actionError = _actionError(error);
    } finally {
      if (mounted) setState(() => _busyItems.remove('new-report'));
      if (mounted) {
        await _load();
        if (actionError != null && mounted) {
          setState(() => _error = actionError);
        }
      }
    }
  }

  Future<void> _submitReport(TalentReport report) async {
    setState(() {
      _busyItems.add(report.id);
      _error = null;
    });
    String? actionError;
    try {
      await widget.repository.submitReport(report.id, widget.accessToken);
    } catch (error) {
      actionError = _actionError(error);
    } finally {
      if (mounted) setState(() => _busyItems.remove(report.id));
      if (mounted) {
        await _load();
        if (actionError != null && mounted) {
          setState(() => _error = actionError);
        }
      }
    }
  }

  Future<void> _uploadTaskDocument(AssignedTask task) async {
    await _runFileAction('task:${task.id}', () async {
      await widget.repository.pickAndUploadTaskDocument(
        task.id,
        widget.accessToken,
      );
    });
  }

  Future<void> _uploadReportDocument(TalentReport report) async {
    await _runFileAction('report:${report.id}', () async {
      await widget.repository.pickAndUploadReportDocument(
        report.id,
        widget.accessToken,
      );
    });
  }

  Future<void> _runFileAction(
    String actionId,
    Future<void> Function() action,
  ) async {
    setState(() {
      _busyItems.add(actionId);
      _error = null;
    });
    String? actionError;
    try {
      await action();
    } catch (error) {
      actionError = _actionError(error);
    } finally {
      if (mounted) setState(() => _busyItems.remove(actionId));
      if (mounted) {
        await _load();
        if (actionError != null && mounted) {
          setState(() => _error = actionError);
        }
      }
    }
  }

  Future<void> _downloadFile(WorkFile file) async {
    setState(() {
      _busyItems.add('download:${file.id}');
      _error = null;
    });
    try {
      await widget.repository.openDownload(file.id, widget.accessToken);
    } catch (error) {
      if (mounted) setState(() => _error = _actionError(error));
    } finally {
      if (mounted) setState(() => _busyItems.remove('download:${file.id}'));
    }
  }

  String _actionError(Object error) {
    if (error is ApiException && error.statusCode == 409) {
      return 'Trạng thái vừa thay đổi. Danh sách đã được làm mới để hiển thị trạng thái mới nhất.';
    }
    if (error is ApiException && error.statusCode == 0) {
      return 'Chưa xác định được thao tác đã hoàn tất hay chưa. Hãy kiểm tra trạng thái mới nhất trước khi thử lại.';
    }
    return error.toString();
  }

  Future<String?> _promptForText({
    required String title,
    required String label,
    required String submitLabel,
    required int maxLength,
  }) async {
    final controller = TextEditingController();
    final result = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: TextField(
          controller: controller,
          autofocus: true,
          minLines: 3,
          maxLines: 6,
          maxLength: maxLength,
          decoration: InputDecoration(
            labelText: label,
            border: const OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          FilledButton(
            onPressed: () {
              final text = controller.text.trim();
              if (text.isNotEmpty) Navigator.pop(context, text);
            },
            child: Text(submitLabel),
          ),
        ],
      ),
    );
    controller.dispose();
    return result;
  }

  Future<_ReportInput?> _promptForReport() async {
    final now = DateTime.now();
    final start = TextEditingController(
      text: '${now.year}-${_twoDigits(now.month)}-01',
    );
    final end = TextEditingController(
      text: '${now.year}-${_twoDigits(now.month)}-${_twoDigits(now.day)}',
    );
    final summary = TextEditingController();
    final progress = TextEditingController();
    final blockers = TextEditingController();
    final nextSteps = TextEditingController();
    final formKey = GlobalKey<FormState>();
    String? periodError;
    final result = await showDialog<_ReportInput>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Báo cáo tiến độ tháng'),
          content: SizedBox(
            width: 420,
            child: Form(
              key: formKey,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _reportField(start, 'Từ ngày (YYYY-MM-DD)'),
                    _reportField(end, 'Đến ngày (YYYY-MM-DD)'),
                    const Align(
                      alignment: Alignment.centerLeft,
                      child: Padding(
                        padding: EdgeInsets.only(bottom: 8),
                        child: Text(
                          'Dùng định dạng YYYY-MM-DD; ngày kết thúc không được trước ngày bắt đầu.',
                        ),
                      ),
                    ),
                    if (periodError != null)
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Text(
                            periodError!,
                            style: TextStyle(
                              color: Theme.of(context).colorScheme.error,
                            ),
                          ),
                        ),
                      ),
                    _reportField(summary, 'Tóm tắt'),
                    _reportField(progress, 'Tiến độ'),
                    _reportField(blockers, 'Khó khăn', required: false),
                    _reportField(nextSteps, 'Bước tiếp theo'),
                  ],
                ),
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Hủy'),
            ),
            FilledButton(
              onPressed: () {
                if (!formKey.currentState!.validate()) return;
                if (!_validPeriod(start.text.trim(), end.text.trim())) {
                  setDialogState(
                    () => periodError =
                        'Khoảng ngày không hợp lệ hoặc ngày kết thúc đứng trước ngày bắt đầu.',
                  );
                  return;
                }
                Navigator.pop(
                  context,
                  _ReportInput(
                    periodStart: start.text.trim(),
                    periodEnd: end.text.trim(),
                    summary: summary.text.trim(),
                    progress: progress.text.trim(),
                    blockers: blockers.text.trim(),
                    nextSteps: nextSteps.text.trim(),
                  ),
                );
              },
              child: const Text('Lưu nháp'),
            ),
          ],
        ),
      ),
    );
    start.dispose();
    end.dispose();
    summary.dispose();
    progress.dispose();
    blockers.dispose();
    nextSteps.dispose();
    return result;
  }

  Widget _reportField(
    TextEditingController controller,
    String label, {
    bool required = true,
  }) =>
      Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: TextFormField(
          controller: controller,
          minLines: label.contains('YYYY') ? 1 : 2,
          maxLines: label.contains('YYYY') ? 1 : 3,
          decoration: InputDecoration(
            labelText: label,
            border: const OutlineInputBorder(),
          ),
          validator: (value) {
            if (required && (value == null || value.trim().isEmpty)) {
              return 'Trường này không được để trống.';
            }
            if (value != null && value.length > 5000) {
              return 'Tối đa 5000 ký tự.';
            }
            if (label.contains('YYYY') && value != null) {
              final date = DateTime.tryParse(value.trim());
              if (date == null ||
                  date.toIso8601String().substring(0, 10) != value.trim()) {
                return 'Ngày phải theo định dạng YYYY-MM-DD.';
              }
            }
            return null;
          },
        ),
      );

  bool _validPeriod(String start, String end) {
    final startDate = DateTime.tryParse(start);
    final endDate = DateTime.tryParse(end);
    return startDate != null &&
        endDate != null &&
        startDate.toIso8601String().substring(0, 10) == start &&
        endDate.toIso8601String().substring(0, 10) == end &&
        !endDate.isBefore(startDate);
  }

  String _twoDigits(int value) => value.toString().padLeft(2, '0');

  @override
  Widget build(BuildContext context) {
    if (_loading && _team == null) {
      return const Center(child: CircularProgressIndicator());
    }
    final team = _team;
    final tasks = _tasks;
    final reports = _reports;
    if (team == null || tasks == null || reports == null) {
      return ListView(
        padding: const EdgeInsets.all(24),
        children: [
          if (_error != null) _errorBanner(context, _error!),
          const SizedBox(height: 80),
          const Center(child: Text('Chưa tải được thông tin dự án và công việc.')),
          Center(
            child: TextButton(
              onPressed: _loading ? null : _load,
              child: const Text('Thử lại'),
            ),
          ),
        ],
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_error != null) _errorBanner(context, _error!),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Dự án của nhóm', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  Text(team.projectTitle),
                  Text('${team.projectCode} · ${_teamStatus(team.status)}'),
                  const SizedBox(height: 8),
                  Text('Thành viên: ${team.members.map((member) => member.fullName).join(', ')}'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text('Công việc được giao', style: Theme.of(context).textTheme.titleLarge),
          if (tasks.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Text('Nhóm hiện chưa có công việc.'),
            )
          else
            for (final task in tasks) _taskCard(context, task),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Text(
                  'Báo cáo tiến độ',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ),
              if (_canManageReports)
                FilledButton.tonalIcon(
                  onPressed: _busyItems.contains('new-report') ? null : _createReport,
                  icon: const Icon(Icons.add),
                  label: const Text('Tạo báo cáo'),
                ),
            ],
          ),
          if (reports.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Text('Chưa có báo cáo tiến độ.'),
            )
          else
            for (final report in reports) _reportCard(context, report),
        ],
      ),
    );
  }

  Widget _taskCard(BuildContext context, AssignedTask task) {
    final isAssignedToCurrentUser = task.assignmentType == 'TEAM' ||
        (task.assignmentType == 'INDIVIDUAL' &&
            task.assignedUserId == widget.userId);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(task.title, style: Theme.of(context).textTheme.titleMedium),
            if (task.description.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(task.description),
            ],
            const SizedBox(height: 8),
            Chip(label: Text(_taskStatus(task.status))),
            if (task.dueAt != null) Text('Hạn: ${task.dueAt}'),
            _fileSection(
            resourceId: task.id,
            files: _taskFiles[task.id] ?? const [],
            canUpload: isAssignedToCurrentUser &&
                task.assignmentType != null,
            onUpload: () => _uploadTaskDocument(task),
            ),
            if (task.canStart && isAssignedToCurrentUser)
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: _busyItems.contains(task.id)
                      ? null
                      : () => _startTask(task),
                  child: const Text('Bắt đầu'),
                ),
              ),
            if (task.canSubmit && isAssignedToCurrentUser)
              Align(
                alignment: Alignment.centerRight,
                child: FilledButton.tonal(
                  onPressed: _busyItems.contains(task.id)
                      ? null
                      : () => _submitTask(task),
                  child: const Text('Nộp kết quả'),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _reportCard(BuildContext context, TalentReport report) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(report.summary, style: Theme.of(context).textTheme.titleMedium),
              Text('${report.periodStart} – ${report.periodEnd}'),
              const SizedBox(height: 8),
              Chip(label: Text(_reportStatus(report.status))),
              if (report.reviewNote?.isNotEmpty ?? false)
                Text('Phản hồi: ${report.reviewNote}'),
              _fileSection(
                resourceId: report.id,
                files: _reportFiles[report.id] ?? const [],
                canUpload: _canManageReports &&
                    report.authorUserId == widget.userId,
                onUpload: () => _uploadReportDocument(report),
              ),
              if (report.canSubmit && _canManageReports)
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: _busyItems.contains(report.id)
                        ? null
                        : () => _submitReport(report),
                    child: const Text('Gửi báo cáo'),
                  ),
                ),
            ],
          ),
        ),
      );

  Widget _fileSection({
    required String resourceId,
    required List<WorkFile> files,
    required bool canUpload,
    required VoidCallback onUpload,
  }) =>
      Padding(
        padding: const EdgeInsets.only(top: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (files.isNotEmpty)
              for (final file in files)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  dense: true,
                  leading: const Icon(Icons.attach_file),
                  title: Text(file.fileName),
                  subtitle: Text(
                    file.status == 'UPLOADED'
                        ? '${(file.sizeBytes / 1024).ceil()} KiB'
                        : 'Đang chờ hoàn tất tải lên',
                  ),
                  trailing: file.status == 'UPLOADED'
                      ? IconButton(
                          tooltip: 'Tải xuống',
                          onPressed: _busyItems.contains('download:${file.id}')
                              ? null
                              : () => _downloadFile(file),
                          icon: const Icon(Icons.download_outlined),
                        )
                      : null,
                ),
            if (_fileErrors[resourceId] != null)
              Text(
                'Không tải được danh sách tệp: ${_fileErrors[resourceId]}',
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            if (canUpload)
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: _busyItems.contains('task:$resourceId') ||
                          _busyItems.contains('report:$resourceId')
                      ? null
                      : onUpload,
                  icon: const Icon(Icons.upload_file),
                  label: const Text('Đính kèm tài liệu'),
                ),
              ),
          ],
        ),
      );

  Widget _errorBanner(BuildContext context, String message) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Semantics(
          liveRegion: true,
          child: Text(
            message,
            key: const ValueKey('work-error'),
            style: TextStyle(color: Theme.of(context).colorScheme.error),
          ),
        ),
      );

  String _teamStatus(String status) => switch (status) {
        'FORMING' => 'Đang hình thành',
        'ACTIVE' => 'Đang hoạt động',
        _ => status,
      };

  String _taskStatus(String status) => switch (status) {
        'PLANNED' => 'Đã lên kế hoạch',
        'ASSIGNED' => 'Đã giao',
        'IN_PROGRESS' => 'Đang thực hiện',
        'SUBMITTED_FOR_REVIEW' => 'Chờ duyệt',
        'CHANGES_REQUESTED' => 'Cần chỉnh sửa',
        'COMPLETED' => 'Hoàn thành',
        'CANCELLED' => 'Đã hủy',
        _ => status,
      };

  String _reportStatus(String status) => switch (status) {
        'DRAFT' => 'Bản nháp',
        'SUBMITTED' => 'Đã gửi',
        'IN_REVIEW' => 'Đang xét duyệt',
        'CHANGES_REQUESTED' => 'Cần chỉnh sửa',
        'APPROVED' => 'Đã duyệt',
        _ => status,
      };
}

class _ReportInput {
  const _ReportInput({
    required this.periodStart,
    required this.periodEnd,
    required this.summary,
    required this.progress,
    required this.blockers,
    required this.nextSteps,
  });

  final String periodStart;
  final String periodEnd;
  final String summary;
  final String progress;
  final String blockers;
  final String nextSteps;
}
