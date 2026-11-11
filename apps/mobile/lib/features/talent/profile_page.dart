import 'package:flutter/material.dart';

import '../../core/auth/auth_models.dart';
import '../../core/files/private_file_repository.dart';
import 'talent_repository.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({
    required this.session,
    required this.repository,
    required this.fileRepository,
    super.key,
  });

  final AuthSession session;
  final TalentRepository repository;
  final ProfileFileStore fileRepository;

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  final _formKey = GlobalKey<FormState>();
  final _studentId = TextEditingController();
  final _fullName = TextEditingController();
  final _faculty = TextEditingController();
  final _major = TextEditingController();
  final _cohort = TextEditingController();
  final _bio = TextEditingController();
  final _skills = TextEditingController();
  final _certifications = TextEditingController();
  bool _loading = true;
  bool _saving = false;
  bool _filesLoading = true;
  bool _fileBusy = false;
  bool _profileReady = false;
  List<PrivateFile> _files = const [];
  String? _error;
  String? _notice;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _studentId.dispose();
    _fullName.dispose();
    _faculty.dispose();
    _major.dispose();
    _cohort.dispose();
    _bio.dispose();
    _skills.dispose();
    _certifications.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
      _profileReady = false;
    });
    try {
      final profile =
          await widget.repository.getMyProfile(widget.session.accessToken);
      if (!mounted) return;
      if (profile != null) {
        _profileReady = true;
        _studentId.text = profile.studentId;
        _fullName.text = profile.fullName;
        _faculty.text = profile.faculty ?? '';
        _major.text = profile.major ?? '';
        _cohort.text = profile.cohort ?? '';
        _bio.text = profile.bio ?? '';
        _skills.text = profile.skills.join(', ');
        _certifications.text = profile.certifications.join(', ');
      } else {
        _profileReady = false;
        _studentId.clear();
        _fullName.text = widget.session.user.fullName;
      }
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
    if (!mounted) return;
    await _loadFiles();
  }

  Future<void> _loadFiles() async {
    if (!mounted) return;
    setState(() => _filesLoading = true);
    try {
      final files =
          await widget.fileRepository.listMine(widget.session.accessToken);
      if (mounted) setState(() => _files = files);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _filesLoading = false);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _saving = true;
      _error = null;
      _notice = null;
    });
    try {
      await widget.repository.saveMyProfile(
        widget.session.accessToken,
        studentId: _studentId.text.trim(),
        fullName: _fullName.text.trim(),
        faculty: _faculty.text.trim(),
        major: _major.text.trim(),
        cohort: _cohort.text.trim(),
        bio: _bio.text.trim(),
        skills: _splitList(_skills.text),
        certifications: _splitList(_certifications.text),
      );
      if (mounted) {
        setState(() {
          _profileReady = true;
          _notice = 'Đã lưu hồ sơ Talent.';
        });
      }
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _upload(bool avatar) async {
    setState(() {
      _fileBusy = true;
      _error = null;
      _notice = null;
    });
    try {
      final file = avatar
          ? await widget.fileRepository
              .pickAndUploadAvatar(widget.session.accessToken)
          : await widget.fileRepository
              .pickAndUploadPortfolio(widget.session.accessToken);
      if (file != null && mounted) {
        setState(() => _notice = 'Đã tải lên ${file.fileName}.');
        await _loadFiles();
      }
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _fileBusy = false);
    }
  }

  Future<void> _download(PrivateFile file) async {
    setState(() {
      _error = null;
      _notice = null;
    });
    try {
      await widget.fileRepository.openDownload(
        file.id,
        widget.session.accessToken,
      );
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    }
  }

  List<String> _splitList(String value) => value
      .split(',')
      .map((item) => item.trim())
      .where((item) => item.isNotEmpty)
      .toSet()
      .toList(growable: false);

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(
        child: CircularProgressIndicator(key: ValueKey('profile-loading')),
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(20),
        children: [
          Text('Hồ sơ Talent', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 4),
          Text(widget.session.user.email),
          if (_error != null)
            _StatusMessage(message: _error!, isError: true),
          if (_notice != null)
            _StatusMessage(message: _notice!, isError: false),
          Form(
            key: _formKey,
            child: Column(
              children: [
                _field(
                  _studentId,
                  'Mã sinh viên',
                  required: true,
                  maxLength: 64,
                ),
                _field(
                  _fullName,
                  'Họ và tên',
                  required: true,
                  maxLength: 160,
                ),
                _field(_faculty, 'Khoa', maxLength: 160),
                _field(_major, 'Ngành học', maxLength: 160),
                _field(_cohort, 'Khóa / năm học', maxLength: 80),
                _field(_bio, 'Giới thiệu', maxLines: 3, maxLength: 2000),
                _field(_skills, 'Kỹ năng (phân cách bằng dấu phẩy)'),
                _field(_certifications, 'Chứng chỉ (phân cách bằng dấu phẩy)'),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: _saving ? null : _save,
                  child: _saving
                      ? const CircularProgressIndicator()
                      : const Text('Lưu hồ sơ'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 28),
          Text('Tài liệu hồ sơ', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          const Text('Ảnh đại diện tối đa 5 MiB; portfolio tối đa 10 MiB.'),
          if (!_profileReady)
            const Padding(
              padding: EdgeInsets.only(top: 8),
              child: Text('Lưu hồ sơ trước khi tải tệp lên.'),
            ),
          Wrap(
            spacing: 8,
            children: [
              OutlinedButton.icon(
                onPressed:
                    _profileReady && !_fileBusy ? () => _upload(true) : null,
                icon: const Icon(Icons.account_circle_outlined),
                label: const Text('Tải ảnh đại diện'),
              ),
              OutlinedButton.icon(
                onPressed:
                    _profileReady && !_fileBusy ? () => _upload(false) : null,
                icon: const Icon(Icons.attach_file),
                label: const Text('Tải portfolio'),
              ),
            ],
          ),
          if (_fileBusy || _filesLoading)
            const Center(child: CircularProgressIndicator()),
          if (!_filesLoading && _files.isEmpty)
            const Text('Chưa có tệp hồ sơ.'),
          ..._files.map(
            (file) => ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(
                file.category == 'AVATAR'
                    ? Icons.account_circle_outlined
                    : Icons.description_outlined,
              ),
              title: Text(file.fileName),
              subtitle: Text(
                '${file.category} · ${(file.sizeBytes / (1024 * 1024)).toStringAsFixed(2)} MiB',
              ),
              trailing: IconButton(
                tooltip: 'Tải xuống ${file.fileName}',
                onPressed: () => _download(file),
                icon: const Icon(Icons.download),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _field(
    TextEditingController controller,
    String label, {
    bool required = false,
    int maxLines = 1,
    int? maxLength,
  }) {
    return Padding(
      padding: const EdgeInsets.only(top: 14),
      child: TextFormField(
        controller: controller,
        maxLines: maxLines,
        maxLength: maxLength,
        decoration: InputDecoration(
          labelText: required ? '$label *' : label,
          border: const OutlineInputBorder(),
        ),
        validator: required
            ? (value) => value == null || value.trim().isEmpty
                ? 'Trường này là bắt buộc.'
                : null
            : null,
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
