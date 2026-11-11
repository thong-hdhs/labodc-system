import 'package:flutter/material.dart';

import 'evaluation_repository.dart';

class EvaluationsPage extends StatefulWidget {
  const EvaluationsPage({
    required this.repository,
    required this.accessToken,
    super.key,
  });

  final EvaluationStore repository;
  final String accessToken;

  @override
  State<EvaluationsPage> createState() => _EvaluationsPageState();
}

class _EvaluationsPageState extends State<EvaluationsPage> {
  List<TalentEvaluation>? _evaluations;
  final Set<String> _busy = {};
  bool _loading = true;
  String? _error;
  String? _notice;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({bool showLoading = true}) async {
    if (showLoading) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      final evaluations =
          await widget.repository.listMine(widget.accessToken);
      if (mounted) {
        setState(() {
          _evaluations = evaluations;
          _error = null;
        });
      }
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted && showLoading) setState(() => _loading = false);
    }
  }

  Future<void> _run(
    String evaluationId,
    Future<void> Function() action,
    String successMessage,
  ) async {
    setState(() {
      _busy.add(evaluationId);
      _error = null;
      _notice = null;
    });
    try {
      await action();
      await _load(showLoading: false);
      if (mounted) setState(() => _notice = successMessage);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _busy.remove(evaluationId));
    }
  }

  @override
  Widget build(BuildContext context) {
    final evaluations = _evaluations;
    return RefreshIndicator(
      onRefresh: _load,
      child: _loading && evaluations == null
          ? ListView(
              children: const [
                SizedBox(height: 180),
                Center(child: CircularProgressIndicator()),
              ],
            )
          : ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              children: [
                Text(
                  'Đánh giá Mentor',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const Text(
                  'Chỉ đánh giá đã được Mentor chốt mới hiển thị tại đây.',
                ),
                if (_error != null)
                  _StatusMessage(message: _error!, isError: true),
                if (_notice != null)
                  _StatusMessage(message: _notice!, isError: false),
                if (_loading && evaluations != null)
                  const LinearProgressIndicator(),
                if (evaluations == null && _error != null)
                  TextButton(
                    onPressed: _loading ? null : _load,
                    child: const Text('Thử tải lại'),
                  ),
                if (evaluations != null && evaluations.isEmpty)
                  const Padding(
                    padding: EdgeInsets.only(top: 80),
                    child: Center(child: Text('Chưa có đánh giá đã chốt.')),
                  ),
                ...?evaluations?.map(
                  (evaluation) => _EvaluationCard(
                    evaluation: evaluation,
                    busy: _busy.contains(evaluation.id),
                    onAcknowledge: () => _run(
                      evaluation.id,
                      () => widget.repository.acknowledge(
                        evaluation.id,
                        widget.accessToken,
                      ),
                      'Đã xác nhận nhận đánh giá.',
                    ),
                    onSubmitFeedback: (feedback) => _run(
                      evaluation.id,
                      () => widget.repository.submitFeedback(
                        evaluation.id,
                        feedback,
                        widget.accessToken,
                      ),
                      'Đã gửi phản hồi cho Mentor.',
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}

class _EvaluationCard extends StatefulWidget {
  const _EvaluationCard({
    required this.evaluation,
    required this.busy,
    required this.onAcknowledge,
    required this.onSubmitFeedback,
  });

  final TalentEvaluation evaluation;
  final bool busy;
  final Future<void> Function() onAcknowledge;
  final Future<void> Function(String feedback) onSubmitFeedback;

  @override
  State<_EvaluationCard> createState() => _EvaluationCardState();
}

class _EvaluationCardState extends State<_EvaluationCard> {
  late final TextEditingController _feedback;

  @override
  void initState() {
    super.initState();
    _feedback = TextEditingController(
      text: widget.evaluation.candidateFeedback ?? '',
    );
  }

  @override
  void dispose() {
    _feedback.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final evaluation = widget.evaluation;
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${evaluation.periodStart} — ${evaluation.periodEnd}',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            for (final item in evaluation.criteria)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text('${item.criterion}: ${item.feedback}'),
              ),
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text('Phản hồi chung: ${evaluation.overallFeedback}'),
            ),
            const Divider(height: 24),
            if (evaluation.isAcknowledged)
              Text('Đã xác nhận nhận đánh giá lúc ${evaluation.candidateAcknowledgedAt}.')
            else
              Align(
                alignment: Alignment.centerLeft,
                child: OutlinedButton(
                  onPressed: widget.busy ? null : widget.onAcknowledge,
                  child: const Text('Xác nhận đã nhận đánh giá'),
                ),
              ),
            if (evaluation.hasFeedback)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text('Phản hồi đã gửi: ${evaluation.candidateFeedback}'),
              )
            else ...[
              TextField(
                controller: _feedback,
                minLines: 2,
                maxLines: 4,
                maxLength: 2000,
                onChanged: (_) => setState(() {}),
                decoration: const InputDecoration(
                  labelText: 'Phản hồi riêng cho Mentor (tùy chọn)',
                  border: OutlineInputBorder(),
                ),
              ),
              Align(
                alignment: Alignment.centerRight,
                child: FilledButton(
                  onPressed: widget.busy || _feedback.text.trim().length < 3
                      ? null
                      : () => widget.onSubmitFeedback(_feedback.text.trim()),
                  child: const Text('Gửi phản hồi'),
                ),
              ),
            ],
            if (widget.busy)
              const LinearProgressIndicator(),
          ],
        ),
      ),
    );
  }
}

class _StatusMessage extends StatelessWidget {
  const _StatusMessage({required this.message, required this.isError});

  final String message;
  final bool isError;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Semantics(
        liveRegion: true,
        child: Text(
          message,
          style: TextStyle(
            color: isError
                ? Theme.of(context).colorScheme.error
                : Theme.of(context).colorScheme.primary,
          ),
        ),
      ),
    );
  }
}
