import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/auth/auth_models.dart';
import '../../core/auth/auth_repository.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({
    required this.authRepository,
    required this.onAuthenticated,
    this.message,
    super.key,
  });

  final AuthRepository authRepository;
  final ValueChanged<AuthSession> onAuthenticated;
  final String? message;

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _busy = false;
  bool _obscurePassword = true;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final session = await widget.authRepository.login(
        _emailController.text,
        _passwordController.text,
      );
      if (mounted) widget.onAuthenticated(session);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('LabOdc Talent')),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Đăng nhập',
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                  const SizedBox(height: 8),
                  const Text('Ứng dụng dành cho Talent và Talent Leader.'),
                  const SizedBox(height: 24),
                  if (widget.message != null) ...[
                    _MessageBox(message: widget.message!, isError: true),
                    const SizedBox(height: 12),
                  ],
                  if (_error != null) ...[
                    _MessageBox(message: _error!, isError: true),
                    const SizedBox(height: 12),
                  ],
                  TextFormField(
                    key: const ValueKey('login-email'),
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    autofillHints: const [AutofillHints.username],
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(
                      labelText: 'Email',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) => value == null || value.trim().isEmpty
                        ? 'Vui lòng nhập email.'
                        : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    key: const ValueKey('login-password'),
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    autofillHints: const [AutofillHints.password],
                    onFieldSubmitted: (_) {
                      if (!_busy) unawaited(_submit());
                    },
                    decoration: InputDecoration(
                      labelText: 'Mật khẩu',
                      border: const OutlineInputBorder(),
                      suffixIcon: IconButton(
                        tooltip: _obscurePassword ? 'Hiện mật khẩu' : 'Ẩn mật khẩu',
                        onPressed: () => setState(
                          () => _obscurePassword = !_obscurePassword,
                        ),
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility
                              : Icons.visibility_off,
                        ),
                      ),
                    ),
                    validator: (value) => value == null || value.isEmpty
                        ? 'Vui lòng nhập mật khẩu.'
                        : null,
                  ),
                  const SizedBox(height: 20),
                  FilledButton(
                    onPressed: _busy ? null : _submit,
                    child: _busy
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Đăng nhập'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _MessageBox extends StatelessWidget {
  const _MessageBox({required this.message, required this.isError});

  final String message;
  final bool isError;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      liveRegion: true,
      child: Text(
        message,
        key: const ValueKey('login-message'),
        style: TextStyle(
          color: isError
              ? Theme.of(context).colorScheme.error
              : Theme.of(context).colorScheme.primary,
        ),
      ),
    );
  }
}
