import 'package:flutter/material.dart';

import 'project_repository.dart';

class ProjectDiscoveryPage extends StatefulWidget {
  const ProjectDiscoveryPage({required this.repository, super.key});

  final ProjectRepository repository;

  @override
  State<ProjectDiscoveryPage> createState() => _ProjectDiscoveryPageState();
}

class _ProjectDiscoveryPageState extends State<ProjectDiscoveryPage> {
  final _keyword = TextEditingController();
  final _skill = TextEditingController();
  ProjectPage? _result;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load(page: 1);
  }

  @override
  void dispose() {
    _keyword.dispose();
    _skill.dispose();
    super.dispose();
  }

  Future<void> _load({required int page}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await widget.repository.search(
        keyword: _keyword.text,
        skill: _skill.text,
        page: page,
      );
      if (mounted) setState(() => _result = result);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _showDetails(PublicProject summary) async {
    try {
      final project = await widget.repository.getDetails(summary.id);
      if (!mounted) return;
      await showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        builder: (context) => SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    project.title,
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 8),
                  Text('${project.companyName} · ${project.code}'),
                  const SizedBox(height: 12),
                  Text(project.summary),
                  if (project.description?.isNotEmpty ?? false) ...[
                    const SizedBox(height: 12),
                    Text(project.description!),
                  ],
                  if (project.deliverables?.isNotEmpty ?? false) ...[
                    const SizedBox(height: 12),
                    Text('Đầu ra: ${project.deliverables}'),
                  ],
                  const SizedBox(height: 12),
                  Text(
                    'Quy mô: ${project.minTeamSize}–${project.maxTeamSize} thành viên',
                  ),
                  Text('Thời lượng: ${project.durationWeeks} tuần'),
                  Text(
                    'Kỹ năng: ${project.requiredSkills.join(', ')}',
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    final result = _result;
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
          child: Column(
            children: [
              TextField(
                controller: _keyword,
                textInputAction: TextInputAction.search,
                onSubmitted: (_) => _load(page: 1),
                decoration: const InputDecoration(
                  labelText: 'Từ khóa',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _skill,
                      textInputAction: TextInputAction.search,
                      onSubmitted: (_) => _load(page: 1),
                      decoration: const InputDecoration(
                        labelText: 'Kỹ năng',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  FilledButton(
                    key: const ValueKey('project-search'),
                    onPressed: _loading ? null : () => _load(page: 1),
                    child: const Text('Tìm'),
                  ),
                ],
              ),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(top: 10),
                  child: Semantics(
                    liveRegion: true,
                    child: Text(
                      _error!,
                      key: const ValueKey('project-error'),
                      style:
                          TextStyle(color: Theme.of(context).colorScheme.error),
                    ),
                  ),
                ),
              if (result != null)
                Align(
                  alignment: Alignment.centerLeft,
                  child: Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      'Tìm thấy ${result.totalItems} dự án đang nhận đơn.',
                    ),
                  ),
                ),
            ],
          ),
        ),
        if (_loading && result == null)
          const Expanded(
            child: Center(
              child: CircularProgressIndicator(
                key: ValueKey('project-loading'),
              ),
            ),
          )
        else if (result == null || result.items.isEmpty)
          const Expanded(
            child: Center(
              child: Text(
                'Hiện chưa có dự án phù hợp.',
                key: ValueKey('project-empty'),
              ),
            ),
          )
        else
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => _load(page: result.page),
              child: ListView.builder(
                key: const ValueKey('project-list'),
                padding: const EdgeInsets.all(16),
                itemCount: result.items.length + 1,
                itemBuilder: (context, index) {
                  if (index == result.items.length) {
                    return _Pagination(
                      page: result.page,
                      totalPages: result.totalPages,
                      enabled: !_loading,
                      onPrevious: () => _load(page: result.page - 1),
                      onNext: () => _load(page: result.page + 1),
                    );
                  }
                  final project = result.items[index];
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            project.title,
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 4),
                          Text('${project.companyName} · ${project.code}'),
                          const SizedBox(height: 8),
                          Text(project.summary),
                          const SizedBox(height: 8),
                          Text(
                            'Kỹ năng: ${project.requiredSkills.join(', ')}',
                          ),
                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton(
                              onPressed: () => _showDetails(project),
                              child: const Text('Xem chi tiết'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        if (_loading && result != null)
          const LinearProgressIndicator(key: ValueKey('project-refreshing')),
      ],
    );
  }
}

class _Pagination extends StatelessWidget {
  const _Pagination({
    required this.page,
    required this.totalPages,
    required this.enabled,
    required this.onPrevious,
    required this.onNext,
  });

  final int page;
  final int totalPages;
  final bool enabled;
  final VoidCallback onPrevious;
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          TextButton(
            onPressed: enabled && page > 1 ? onPrevious : null,
            child: const Text('Trước'),
          ),
          Text('Trang $page / $totalPages'),
          TextButton(
            onPressed:
                enabled && page < totalPages ? onNext : null,
            child: const Text('Sau'),
          ),
        ],
      ),
    );
  }
}
