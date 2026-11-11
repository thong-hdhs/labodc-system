import 'dart:async';

import 'package:flutter/material.dart';

import 'core/api/api_client.dart';
import 'core/auth/auth_models.dart';
import 'core/auth/auth_repository.dart';
import 'core/auth/secure_token_store.dart';
import 'core/files/private_file_repository.dart';
import 'features/applications/application_page.dart';
import 'features/applications/application_repository.dart';
import 'features/auth/login_page.dart';
import 'features/discovery/project_discovery_page.dart';
import 'features/discovery/project_repository.dart';
import 'features/evaluations/evaluation_repository.dart';
import 'features/evaluations/evaluations_page.dart';
import 'features/talent/profile_page.dart';
import 'features/talent/talent_repository.dart';
import 'features/work/work_page.dart';
import 'features/work/work_repository.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final api = ApiClient();
  final storage = FlutterSecureTokenStore();
  final files = PrivateFileRepository(api);
  runApp(
    LabOdcMobileApp(
      authRepository: AuthRepository(api: api, storage: storage),
      talentRepository: TalentRepository(api),
      projectRepository: ProjectRepository(api),
      applicationRepository: ApplicationRepository(api),
      evaluationRepository: EvaluationRepository(api),
      workRepository: WorkRepository(api, fileRepository: files),
      fileRepository: files,
    ),
  );
}

class LabOdcMobileApp extends StatefulWidget {
  const LabOdcMobileApp({
    required this.authRepository,
    required this.talentRepository,
    required this.projectRepository,
    required this.applicationRepository,
    required this.evaluationRepository,
    required this.workRepository,
    required this.fileRepository,
    super.key,
  });

  final AuthRepository authRepository;
  final TalentRepository talentRepository;
  final ProjectRepository projectRepository;
  final ApplicationRepository applicationRepository;
  final EvaluationRepository evaluationRepository;
  final WorkRepository workRepository;
  final ProfileFileStore fileRepository;

  @override
  State<LabOdcMobileApp> createState() => _LabOdcMobileAppState();
}

class _LabOdcMobileAppState extends State<LabOdcMobileApp> {
  AuthSession? _session;
  bool _restoring = true;
  String? _startupError;

  @override
  void initState() {
    super.initState();
    unawaited(_restoreSession());
  }

  Future<void> _restoreSession() async {
    try {
      final session = await widget.authRepository.restoreSession();
      if (mounted) setState(() => _session = session);
    } catch (error) {
      if (mounted) setState(() => _startupError = error.toString());
    } finally {
      if (mounted) setState(() => _restoring = false);
    }
  }

  void _authenticated(AuthSession session) {
    setState(() {
      _session = session;
      _startupError = null;
    });
  }

  Future<void> _logout() async {
    final session = _session;
    if (session == null) return;
    setState(() {
      _session = null;
      _startupError = null;
    });
    try {
      await widget.authRepository.logout(session.accessToken);
    } catch (error) {
      if (mounted) setState(() => _startupError = error.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LabOdc Talent',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF176B87)),
        useMaterial3: true,
      ),
      home: _restoring
          ? const Scaffold(
              body: Center(
                child: CircularProgressIndicator(
                  key: ValueKey('session-restoring'),
                ),
              ),
            )
          : _session == null
              ? LoginPage(
                  authRepository: widget.authRepository,
                  onAuthenticated: _authenticated,
                  message: _startupError,
                )
              : _TalentHome(
                  session: _session!,
                  talentRepository: widget.talentRepository,
                  projectRepository: widget.projectRepository,
                  applicationRepository: widget.applicationRepository,
                  evaluationRepository: widget.evaluationRepository,
                  workRepository: widget.workRepository,
                  fileRepository: widget.fileRepository,
                  onLogout: _logout,
                ),
    );
  }
}

class _TalentHome extends StatefulWidget {
  const _TalentHome({
    required this.session,
    required this.talentRepository,
    required this.projectRepository,
    required this.applicationRepository,
    required this.evaluationRepository,
    required this.workRepository,
    required this.fileRepository,
    required this.onLogout,
  });

  final AuthSession session;
  final TalentRepository talentRepository;
  final ProjectRepository projectRepository;
  final ApplicationRepository applicationRepository;
  final EvaluationRepository evaluationRepository;
  final WorkRepository workRepository;
  final ProfileFileStore fileRepository;
  final Future<void> Function() onLogout;

  @override
  State<_TalentHome> createState() => _TalentHomeState();
}

class _TalentHomeState extends State<_TalentHome> {
  int _selectedIndex = 0;
  bool _loggingOut = false;

  Future<void> _logout() async {
    setState(() => _loggingOut = true);
    await widget.onLogout();
    if (mounted) setState(() => _loggingOut = false);
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      ProfilePage(
        session: widget.session,
        repository: widget.talentRepository,
        fileRepository: widget.fileRepository,
      ),
      ProjectDiscoveryPage(
        repository: widget.projectRepository,
        applicationRepository: widget.applicationRepository,
        accessToken: widget.session.accessToken,
      ),
      ApplicationPage(
        repository: widget.applicationRepository,
        accessToken: widget.session.accessToken,
      ),
      EvaluationsPage(
        repository: widget.evaluationRepository,
        accessToken: widget.session.accessToken,
      ),
      WorkPage(
        repository: widget.workRepository,
        accessToken: widget.session.accessToken,
        userId: widget.session.user.id,
        isTeamLeader: widget.session.user.role == 'TALENT_LEADER',
      ),
    ];
    return Scaffold(
      appBar: AppBar(
        title: Text('Xin chào, ${widget.session.user.fullName}'),
        actions: [
          IconButton(
            tooltip: 'Đăng xuất',
            onPressed: _loggingOut ? null : _logout,
            icon: _loggingOut
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.logout),
          ),
        ],
      ),
      body: IndexedStack(index: _selectedIndex, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) =>
            setState(() => _selectedIndex = index),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Hồ sơ',
          ),
          NavigationDestination(
            icon: Icon(Icons.search),
            label: 'Khám phá',
          ),
          NavigationDestination(
            icon: Icon(Icons.assignment_outlined),
            label: 'Ứng tuyển',
          ),
          NavigationDestination(
            icon: Icon(Icons.rate_review_outlined),
            label: 'Đánh giá',
          ),
          NavigationDestination(
            icon: Icon(Icons.work_outline),
            label: 'Công việc',
          ),
        ],
      ),
    );
  }
}
