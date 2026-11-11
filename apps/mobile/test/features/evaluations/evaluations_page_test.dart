import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:labodc_mobile/features/evaluations/evaluation_repository.dart';
import 'package:labodc_mobile/features/evaluations/evaluations_page.dart';

class FakeEvaluationStore implements EvaluationStore {
  TalentEvaluation evaluation = const TalentEvaluation(
    id: 'eval-1',
    periodStart: '2026-10-01',
    periodEnd: '2026-10-31',
    criteria: [
      EvaluationCriterion(
        criterion: 'Giao tiếp',
        feedback: 'Diễn đạt rõ ràng.',
      ),
    ],
    overallFeedback: 'Tiếp tục phát huy.',
    finalizedAt: '2026-11-01T10:00:00.000Z',
    candidateAcknowledgedAt: null,
    candidateFeedback: null,
    candidateFeedbackAt: null,
  );

  @override
  Future<List<TalentEvaluation>> listMine(String accessToken) async =>
      [evaluation];

  @override
  Future<void> acknowledge(String evaluationId, String accessToken) async {
    evaluation = TalentEvaluation(
      id: evaluation.id,
      periodStart: evaluation.periodStart,
      periodEnd: evaluation.periodEnd,
      criteria: evaluation.criteria,
      overallFeedback: evaluation.overallFeedback,
      finalizedAt: evaluation.finalizedAt,
      candidateAcknowledgedAt: '2026-11-02T10:00:00.000Z',
      candidateFeedback: evaluation.candidateFeedback,
      candidateFeedbackAt: evaluation.candidateFeedbackAt,
    );
  }

  @override
  Future<void> submitFeedback(
    String evaluationId,
    String feedback,
    String accessToken,
  ) async {
    evaluation = TalentEvaluation(
      id: evaluation.id,
      periodStart: evaluation.periodStart,
      periodEnd: evaluation.periodEnd,
      criteria: evaluation.criteria,
      overallFeedback: evaluation.overallFeedback,
      finalizedAt: evaluation.finalizedAt,
      candidateAcknowledgedAt: evaluation.candidateAcknowledgedAt,
      candidateFeedback: feedback,
      candidateFeedbackAt: '2026-11-02T10:01:00.000Z',
    );
  }
}

void main() {
  testWidgets('Talent can acknowledge a final evaluation and send one reply',
      (tester) async {
    final repository = FakeEvaluationStore();
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: EvaluationsPage(
            repository: repository,
            accessToken: 'token',
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Đánh giá Mentor'), findsOneWidget);
    expect(find.text('Tiếp tục phát huy.'), findsOneWidget);
    await tester.tap(find.text('Xác nhận đã nhận đánh giá'));
    await tester.pumpAndSettle();
    expect(find.textContaining('Đã xác nhận nhận đánh giá lúc'), findsOneWidget);

    await tester.enterText(find.byType(TextField), 'Tôi sẽ cải thiện.');
    await tester.ensureVisible(find.text('Gửi phản hồi'));
    await tester.tap(find.text('Gửi phản hồi'));
    await tester.pumpAndSettle();

    expect(find.text('Phản hồi đã gửi: Tôi sẽ cải thiện.'), findsOneWidget);
    expect(find.text('Đã gửi phản hồi cho Mentor.'), findsOneWidget);
  });
}
