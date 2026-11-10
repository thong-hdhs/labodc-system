import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import 'application_repository.dart';

class ApplicationPage extends StatefulWidget {
  const ApplicationPage({
    required this.repository,
    required this.accessToken,
    super.key,
  });

  final ApplicationRepository repository;
  final String accessToken;

  @override
  State<ApplicationPage> createState() => _ApplicationPageState();
}

class _ApplicationPageState extends State<ApplicationPage> {
  List<TalentApplication>? _applications;
  bool _loading = true;
  final Set<String> _withdrawing = {};
  String? _error;

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
      final applications =
          await widget.repository.listMine(widget.accessToken);
      if (mounted) setState(() => _applications = applications);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _withdraw(TalentApplication application) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Rút đơn ứng tuyển?'),
        content: Text('Bạn muốn rút đơn ${application.projectCode}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Để sau'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Rút đơn'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() {
      _withdrawing.add(application.id);
      _error = null;
    });
    String? actionError;
    try {
      await widget.repository.withdraw(application.id, widget.accessToken);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã rút đơn ứng tuyển.')),
        );
      }
    } catch (error) {
      actionError = _actionError(error);
    } finally {
      if (mounted) setState(() => _withdrawing.remove(application.id));
      if (mounted) {
        await _load();
        if (actionError != null && mounted) {
          setState(() => _error = actionError);
        }
      }
    }
  }

  String _actionError(Object error) {
    if (error is ApiException && error.statusCode == 409) {
      return 'Đơn đã được xử lý hoặc không còn có thể rút. Đang cập nhật trạng thái.';
    }
    if (error is ApiException && error.statusCode == 0) {
      return 'Chưa xác định được yêu cầu đã hoàn tất hay chưa. Hãy làm mới danh sách trước khi thử lại.';
    }
    return error.toString();
  }

  @override
  Widget build(BuildContext context) {
    final applications = _applications;
    return RefreshIndicator(
      onRefresh: _load,
      child: _loading && applications == null
          ? ListView(
              children: const [
                SizedBox(height: 180),
                Center(child: CircularProgressIndicator()),
              ],
            )
          : applications == null || applications.isEmpty
              ? ListView(
                  children: [
                    if (_error != null) _errorBanner(context, _error!),
                    const SizedBox(height: 120),
                    const Center(
                      child: Text(
                        'Bạn chưa có đơn ứng tuyển nào.',
                        key: ValueKey('applications-empty'),
                      ),
                    ),
                    if (_error != null)
                      Center(
                        child: TextButton(
                          onPressed: _loading ? null : _load,
                          child: const Text('Thử tải lại'),
                        ),
                      ),
                  ],
                )
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    if (_error != null) _errorBanner(context, _error!),
                    Text(
                      '${applications.length} đơn ứng tuyển',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    for (final application in applications)
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                application.projectTitle,
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                              Text(application.projectCode),
                              const SizedBox(height: 8),
                              Chip(
                                label: Text(_localizedStatus(application.status)),
                              ),
                              if (application.stateHistory.isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Text(
                                  'Cập nhật gần nhất: ${_localizedStatus(application.stateHistory.last.status)}',
                                ),
                              ],
                              if (application.canWithdraw)
                                Align(
                                  alignment: Alignment.centerRight,
                                  child: TextButton(
                                    onPressed: _withdrawing
                                            .contains(application.id)
                                        ? null
                                        : () => _withdraw(application),
                                    child: _withdrawing.contains(application.id)
                                        ? const SizedBox(
                                            width: 18,
                                            height: 18,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                            ),
                                          )
                                        : const Text('Rút đơn'),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
    );
  }

  Widget _errorBanner(BuildContext context, String message) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Semantics(
          liveRegion: true,
          child: Text(
            message,
            key: const ValueKey('applications-error'),
            style: TextStyle(color: Theme.of(context).colorScheme.error),
          ),
        ),
      );

  String _localizedStatus(String status) => switch (status) {
        'SUBMITTED' => 'Đã gửi',
        'UNDER_REVIEW' => 'Đang xét duyệt',
        'INTERVIEW' => 'Phỏng vấn',
        'ACCEPTED' => 'Được chấp nhận',
        'REJECTED' => 'Chưa phù hợp',
        'WITHDRAWN' => 'Đã rút',
        _ => status,
      };
}
