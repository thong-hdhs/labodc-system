import '../../core/api/api_client.dart';

class TalentEvaluation {
  const TalentEvaluation({
    required this.id,
    required this.periodStart,
    required this.periodEnd,
    required this.criteria,
    required this.overallFeedback,
    required this.finalizedAt,
    required this.candidateAcknowledgedAt,
    required this.candidateFeedback,
    required this.candidateFeedbackAt,
  });

  final String id;
  final String periodStart;
  final String periodEnd;
  final List<EvaluationCriterion> criteria;
  final String overallFeedback;
  final String finalizedAt;
  final String? candidateAcknowledgedAt;
  final String? candidateFeedback;
  final String? candidateFeedbackAt;

  bool get isAcknowledged => candidateAcknowledgedAt != null;
  bool get hasFeedback => candidateFeedbackAt != null;

  factory TalentEvaluation.fromJson(Map<String, dynamic> json) {
    final criteria = json['criteria'];
    if (criteria is! List ||
        criteria.any((item) => item is! Map<String, dynamic>)) {
      throw const FormatException('Nội dung đánh giá không hợp lệ.');
    }
    return TalentEvaluation(
      id: _requiredString(json, 'id'),
      periodStart: _requiredString(json, 'periodStart'),
      periodEnd: _requiredString(json, 'periodEnd'),
      criteria: criteria
          .cast<Map<String, dynamic>>()
          .map(EvaluationCriterion.fromJson)
          .toList(growable: false),
      overallFeedback: _requiredString(json, 'overallFeedback'),
      finalizedAt: _requiredString(json, 'finalizedAt'),
      candidateAcknowledgedAt: _nullableString(
        json,
        'candidateAcknowledgedAt',
      ),
      candidateFeedback: _nullableString(json, 'candidateFeedback'),
      candidateFeedbackAt: _nullableString(json, 'candidateFeedbackAt'),
    );
  }
}

class EvaluationCriterion {
  const EvaluationCriterion({required this.criterion, required this.feedback});

  final String criterion;
  final String feedback;

  factory EvaluationCriterion.fromJson(Map<String, dynamic> json) =>
      EvaluationCriterion(
        criterion: _requiredString(json, 'criterion'),
        feedback: _requiredString(json, 'feedback'),
      );
}

abstract interface class EvaluationStore {
  Future<List<TalentEvaluation>> listMine(String accessToken);
  Future<void> acknowledge(String evaluationId, String accessToken);
  Future<void> submitFeedback(
    String evaluationId,
    String feedback,
    String accessToken,
  );
}

class EvaluationRepository implements EvaluationStore {
  const EvaluationRepository(this._api);

  final ApiClient _api;

  @override
  Future<List<TalentEvaluation>> listMine(String accessToken) async {
    final evaluations = await _api.getList(
      '/talent/me/evaluations',
      accessToken: accessToken,
    );
    return evaluations.map(TalentEvaluation.fromJson).toList(growable: false);
  }

  @override
  Future<void> acknowledge(String evaluationId, String accessToken) async {
    await _api.post(
      '/talent/evaluations/${Uri.encodeComponent(evaluationId)}/acknowledge',
      accessToken: accessToken,
    );
  }

  @override
  Future<void> submitFeedback(
    String evaluationId,
    String feedback,
    String accessToken,
  ) async {
    await _api.post(
      '/talent/evaluations/${Uri.encodeComponent(evaluationId)}/feedback',
      accessToken: accessToken,
      body: {'feedback': feedback},
    );
  }
}

String _requiredString(Map<String, dynamic> json, String key) {
  final value = json[key];
  if (value is! String || value.isEmpty) {
    throw const FormatException('Nội dung đánh giá không hợp lệ.');
  }
  return value;
}

String? _nullableString(Map<String, dynamic> json, String key) {
  final value = json[key];
  if (value != null && value is! String) {
    throw const FormatException('Nội dung đánh giá không hợp lệ.');
  }
  return value is String ? value : null;
}
