import 'package:flutter/material.dart';

import 'core/theme/app_theme.dart';
import 'features/home/home_page.dart';
import 'config/mobile_env.dart';

class SpeedCashApp extends StatelessWidget {
  const SpeedCashApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: MobileEnv.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      routes: {
        '/': (_) => const HomePage(),
      },
    );
  }
}
