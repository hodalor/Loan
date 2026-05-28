import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/theme/app_theme.dart';
import '../../services/firebase_bootstrap.dart';
import '../../services/firebase_phone_auth_service.dart';
import '../../services/session_storage.dart';
import '../../services/speedcash_api_service.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final SpeedCashApiService _api = SpeedCashApiService();
  final FirebasePhoneAuthService _firebasePhoneAuthService =
      FirebasePhoneAuthService();
  final SessionStorage _sessionStorage = SessionStorage();
  final ImagePicker _imagePicker = ImagePicker();

  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  final _pinController = TextEditingController();
  final _confirmPinController = TextEditingController();
  final _loginPinController = TextEditingController();
  final _loanAmountController = TextEditingController();
  final _repaymentAmountController = TextEditingController();

  final _firstNameController = TextEditingController();
  final _middleNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _backupPhoneController = TextEditingController();
  final _dobController = TextEditingController();
  final _digitalAddressController = TextEditingController();
  final _areaController = TextEditingController();
  final _landmarkController = TextEditingController();
  final _residenceTimeController = TextEditingController();
  final _incomeSourceController = TextEditingController();
  final _dependantsController = TextEditingController();
  final _schoolNameController = TextEditingController();
  final _courseController = TextEditingController();
  final _graduationYearController = TextEditingController();
  final _schoolAddressController = TextEditingController();
  final _workUnitController = TextEditingController();
  final _industryController = TextEditingController();
  final _workAddressController = TextEditingController();
  final _companyAddressController = TextEditingController();
  final _workLandmarkController = TextEditingController();
  final _workIncomeController = TextEditingController();
  final _workContentController = TextEditingController();
  final _idNumberController = TextEditingController();
  final _contact1NameController = TextEditingController();
  final _contact1PhoneController = TextEditingController();
  final _contact1AddressController = TextEditingController();
  final _contact2NameController = TextEditingController();
  final _contact2PhoneController = TextEditingController();
  final _contact2AddressController = TextEditingController();
  final _contact3NameController = TextEditingController();
  final _contact3PhoneController = TextEditingController();
  final _contact3AddressController = TextEditingController();

  bool _booting = true;
  bool _authLoading = false;
  bool _profileSaving = false;
  bool _portalLoading = false;
  bool _loanLoading = false;
  bool _gatewayLoading = false;
  bool _otpRequested = false;
  bool _termsAccepted = false;
  bool _isSignedIn = false;
  bool _resetPinMode = false;
  bool _homeHowItWorksExpanded = false;
  bool _homeFaqsExpanded = false;
  bool _homeContactExpanded = false;

  String _authMode = 'login';
  String _activeTab = 'home';
  String _selectedCountryCode = '';
  String _selectedGender = '';
  String _selectedMaritalStatus = '';
  String _selectedEducationLevel = '';
  String _selectedSchoolStatus = '';
  String _selectedResidenceType = '';
  String _selectedWorkHours = '';
  String _selectedRelationship1 = '';
  String _selectedRelationship2 = '';
  String _selectedRelationship3 = '';
  String _selectedContactEdu1 = '';
  String _selectedContactEdu2 = '';
  String _selectedContactEdu3 = '';
  String _selectedIdType = '';
  String _selectedTermKey = '';
  String _selectedPaymentMethod = '';
  String _selectedPaymentOperator = '';
  String _selectedRepaymentType = 'full';
  String _selectedRepaymentMethod = '';
  String _selectedRepaymentOperator = '';
  String _selectedExtensionKey = '';
  String _selectedExtensionMethod = '';
  String _selectedExtensionOperator = '';
  String _message = '';
  String _messageTone = 'info';
  String _pendingGatewayReference = '';
  String _pendingGatewayType = '';
  String _firebaseIdToken = '';
  Timer? _messageTimer;

  Map<String, dynamic> _portalContent = _defaultPortalContent;
  Map<String, dynamic>? _sessionAccount;
  Map<String, dynamic>? _repaymentSummary;
  Map<String, dynamic>? _extensionSummary;
  Map<String, dynamic>? _lastTransaction;

  File? _frontPhoto;
  File? _backPhoto;
  File? _selfiePhoto;

  static const List<String> _educationLevels = [
    'Primary',
    'JHS',
    'SHS',
    'Diploma',
    'HND',
    'Degree',
    'Masters',
    'Other',
  ];

  static const List<String> _relationshipOptions = [
    'Parent',
    'Sibling',
    'Spouse',
    'Friend',
    'Employer',
    'Other',
  ];

  static const List<String> _residenceTypes = [
    'Family house',
    'Rented',
    'Owned',
    'Hostel',
    'Other',
  ];

  static const List<String> _maritalStatuses = [
    'Single',
    'Married',
    'Divorced',
    'Widowed',
  ];

  static const List<String> _idTypes = [
    'National ID',
    'Passport',
    'Voter Card',
    'Driver License',
  ];

  static const List<String> _workHoursOptions = [
    'Full time',
    'Part time',
    'Shift',
    'Flexible',
  ];

  static const Map<String, dynamic> _defaultPortalContent = {
    'appName': 'SpeedCash',
    'tagline':
        'Fast customer login, application tracking, and identity verification.',
    'footerText': 'All rights reserved.',
    'footerVersion': '1.5.0',
    'homeBannerBadge': 'Updates',
    'homeBannerTitle': 'Stay informed',
    'homeBannerMessage':
        'Share promotions, payment reminders, and important notices from admin config.',
    'faqs': [
      'Loan approval is subject to review by the admin team.',
      'You cannot apply for a new loan while another one is active.',
      'Successful repayment helps unlock the next user level.',
      'Contact support if your payout details are missing or outdated.',
    ],
    'repaymentTutorials': [
      'Sign in with your phone and 4-digit PIN.',
      'Complete your profile and submit identity verification.',
      'Apply for a loan from the available offer.',
      'Repay or extend from the active loan section.',
    ],
    'countries': [
      {
        'code': 'ZM',
        'name': 'Zambia',
        'locale': 'en-ZM',
        'currencyCode': 'ZMW',
        'currencySymbol': 'K',
        'dialCode': '+260',
        'phoneExample': '0970000000',
        'mobileMoneyNetworks': [],
      },
    ],
    'activeCountry': {
      'code': 'ZM',
      'name': 'Zambia',
      'locale': 'en-ZM',
      'currencyCode': 'ZMW',
      'currencySymbol': 'K',
      'dialCode': '+260',
      'phoneExample': '0970000000',
      'mobileMoneyNetworks': [],
    },
    'authVerification': {
      'otpMode': 'demo',
      'firebaseWebConfig': {
        'apiKey': '',
        'authDomain': '',
        'projectId': '',
        'storageBucket': '',
        'messagingSenderId': '',
        'appId': '',
      },
    },
  };

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  @override
  void dispose() {
    _messageTimer?.cancel();
    _phoneController.dispose();
    _otpController.dispose();
    _pinController.dispose();
    _confirmPinController.dispose();
    _loginPinController.dispose();
    _loanAmountController.dispose();
    _repaymentAmountController.dispose();
    _firstNameController.dispose();
    _middleNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _backupPhoneController.dispose();
    _dobController.dispose();
    _digitalAddressController.dispose();
    _areaController.dispose();
    _landmarkController.dispose();
    _residenceTimeController.dispose();
    _incomeSourceController.dispose();
    _dependantsController.dispose();
    _schoolNameController.dispose();
    _courseController.dispose();
    _graduationYearController.dispose();
    _schoolAddressController.dispose();
    _workUnitController.dispose();
    _industryController.dispose();
    _workAddressController.dispose();
    _companyAddressController.dispose();
    _workLandmarkController.dispose();
    _workIncomeController.dispose();
    _workContentController.dispose();
    _idNumberController.dispose();
    _contact1NameController.dispose();
    _contact1PhoneController.dispose();
    _contact1AddressController.dispose();
    _contact2NameController.dispose();
    _contact2PhoneController.dispose();
    _contact2AddressController.dispose();
    _contact3NameController.dispose();
    _contact3PhoneController.dispose();
    _contact3AddressController.dispose();
    super.dispose();
  }

  bool get _isRealOtpMode =>
      '${_portalContent['authVerification']?['otpMode'] ?? 'demo'}' == 'real';

  bool get _firebaseReady => FirebaseBootstrap.isConfigured;

  List<Map<String, dynamic>> get _countries {
    final raw = _portalContent['countries'];
    if (raw is List && raw.isNotEmpty) {
      return raw.whereType<Map<String, dynamic>>().toList();
    }
    return (_defaultPortalContent['countries'] as List)
        .whereType<Map<String, dynamic>>()
        .toList();
  }

  Map<String, dynamic> get _selectedCountry {
    for (final country in _countries) {
      if ('${country['code']}' == _selectedCountryCode) {
        return country;
      }
    }
    return Map<String, dynamic>.from(
      _portalContent['activeCountry'] as Map<String, dynamic>? ??
          _defaultPortalContent['activeCountry'] as Map<String, dynamic>,
    );
  }

  Map<String, dynamic>? get _customer =>
      _sessionAccount?['customer'] as Map<String, dynamic>?;

  Map<String, dynamic>? get _offer =>
      _sessionAccount?['offer'] as Map<String, dynamic>?;

  Map<String, dynamic>? get _activeLoan =>
      _sessionAccount?['activeLoan'] as Map<String, dynamic>?;

  Map<String, dynamic>? get _lifecycleConfig =>
      _sessionAccount?['lifecycleConfig'] as Map<String, dynamic>?;

  List<dynamic> get _loanHistory =>
      _sessionAccount?['loanHistory'] as List<dynamic>? ?? <dynamic>[];

  String get _portalLogoUrl =>
      _api.resolveMediaUrl('${_portalContent['logoUrl'] ?? ''}');

  String get _homeBannerBadge =>
      '${_portalContent['homeBannerBadge'] ?? _defaultPortalContent['homeBannerBadge'] ?? ''}'
          .trim();

  String get _homeBannerTitle =>
      '${_portalContent['homeBannerTitle'] ?? _defaultPortalContent['homeBannerTitle'] ?? ''}'
          .trim();

  String get _homeBannerMessage =>
      '${_portalContent['homeBannerMessage'] ?? _defaultPortalContent['homeBannerMessage'] ?? ''}'
          .trim();

  String get _profileDisplayName {
    final firstName = _firstNameController.text.trim();
    final lastName = _lastNameController.text.trim();
    final combined = '$firstName $lastName'.trim();
    if (combined.isNotEmpty) {
      return combined;
    }
    return '${_portalContent['appName'] ?? 'Customer'}';
  }

  String get _profileCustomerId {
    return '${_customer?['userId'] ?? _customer?['ID'] ?? _customer?['id'] ?? '-'}';
  }

  String get _profileCountryName {
    final customerCountry = _customer?['countryName'];
    if ('$customerCountry'.trim().isNotEmpty && customerCountry != null) {
      return '$customerCountry';
    }
    return '${_selectedCountry['name'] ?? '-'}';
  }

  String get _profileVerificationStatus {
    final verified = _customer?['isVerified'];
    return verified == true ? 'Verified' : 'Pending';
  }

  String get _profileCreatedAt {
    final createdAt = _customer?['createdAt'] ?? _customer?['date'] ?? '';
    if ('$createdAt'.trim().isEmpty) {
      return '-';
    }
    return _formatDate(createdAt);
  }

  String get _creditScoreLabel => '${_offer?['creditScore'] ?? 0}';

  List<Map<String, dynamic>> get _termOptions {
    final raw = _offer?['termOptions'];
    if (raw is List) {
      return raw.whereType<Map<String, dynamic>>().toList();
    }
    return const [];
  }

  void _syncCountrySelection({String? preferredCode}) {
    final countries = _countries;
    if (countries.isEmpty) {
      return;
    }

    final activeCountry = Map<String, dynamic>.from(
      _portalContent['activeCountry'] as Map<String, dynamic>? ??
          _defaultPortalContent['activeCountry'] as Map<String, dynamic>,
    );
    final preferred = (preferredCode ?? _selectedCountryCode).trim().toUpperCase();
    final fallbackCode = '${activeCountry['code'] ?? countries.first['code'] ?? ''}'
        .trim()
        .toUpperCase();

    final resolved = countries.firstWhere(
      (country) => '${country['code'] ?? ''}'.trim().toUpperCase() == preferred,
      orElse: () => countries.firstWhere(
        (country) => '${country['code'] ?? ''}'.trim().toUpperCase() == fallbackCode,
        orElse: () => countries.first,
      ),
    );

    _selectedCountryCode = '${resolved['code'] ?? fallbackCode}'.trim().toUpperCase();
  }

  List<Map<String, dynamic>> get _paymentMethods {
    final raw = _offer?['paymentMethods'];
    if (raw is List) {
      return raw.whereType<Map<String, dynamic>>().toList();
    }
    return const [];
  }

  List<Map<String, dynamic>> get _repaymentOptions {
    final activeLoanOptions = _activeLoan?['repaymentOptions'];
    if (activeLoanOptions is List) {
      return activeLoanOptions.whereType<Map<String, dynamic>>().toList();
    }
    final lifecycleOptions = _lifecycleConfig?['repaymentOptions'];
    if (lifecycleOptions is List) {
      return lifecycleOptions.whereType<Map<String, dynamic>>().toList();
    }
    return const [];
  }

  List<Map<String, dynamic>> get _extensionOptions {
    final raw = _activeLoan?['extensionOptions'];
    if (raw is List) {
      return raw.whereType<Map<String, dynamic>>().toList();
    }
    return const [];
  }

  List<Map<String, dynamic>> get _mobileMoneyNetworks {
    final lifecycleNetworks = _lifecycleConfig?['mobileMoneyNetworks'];
    if (lifecycleNetworks is List && lifecycleNetworks.isNotEmpty) {
      return lifecycleNetworks.whereType<Map<String, dynamic>>().toList();
    }
    final countryNetworks = _selectedCountry['mobileMoneyNetworks'];
    if (countryNetworks is List) {
      return countryNetworks.whereType<Map<String, dynamic>>().toList();
    }
    return const [];
  }

  Future<void> _bootstrap() async {
    setState(() {
      _booting = true;
    });

    try {
      final portalContentResponse = await _api.fetchPortalContent();
      final contentData = portalContentResponse['data'];
      if (contentData is Map<String, dynamic>) {
        _portalContent = {
          ..._defaultPortalContent,
          ...contentData,
        };
      }
      _syncCountrySelection();

      final savedSession = await _sessionStorage.readSession();
      final savedGateway = await _sessionStorage.readPendingGateway();
      _pendingGatewayReference = savedGateway['reference'] ?? '';
      _pendingGatewayType = savedGateway['type'] ?? '';
      _syncCountrySelection(
        preferredCode:
            (savedSession['phone'] ?? '').isNotEmpty ? savedSession['countryCode'] ?? '' : '',
      );

      if ((savedSession['phone'] ?? '').isNotEmpty) {
        _phoneController.text = savedSession['phone']!;
        await _loadPortalSummary(savedSession['phone']!, quiet: true);
      }
    } catch (error) {
      _syncCountrySelection();
    } finally {
      if (mounted) {
        setState(() {
          _booting = false;
        });
      }
    }
  }

  Future<void> _loadPortalSummary(
    String phone, {
    bool quiet = false,
  }) async {
    setState(() {
      _portalLoading = true;
    });

    try {
      final response = await _api.fetchPortalSummary(phone);
      final data = response['data'];
      if (data is! Map<String, dynamic>) {
        throw Exception('Customer portal data is missing.');
      }

      _sessionAccount = data;
      _isSignedIn = true;
      _activeTab = 'home';
      _syncCountrySelection(
        preferredCode: '${data['country']?['code'] ?? _selectedCountryCode}',
      );

      if (_customer != null) {
        _hydrateProfileFromCustomer(_customer!);
      }

      final draft = data['draftApplication'];
      if (draft is Map<String, dynamic>) {
        _hydrateDraft(draft);
      }

      if (_loanAmountController.text.isEmpty && _offer != null) {
        _loanAmountController.text = '${_offer!['defaultAmount'] ?? ''}';
      }

      if (_selectedPaymentMethod.isEmpty && _paymentMethods.isNotEmpty) {
        _selectedPaymentMethod = '${_paymentMethods.first['method'] ?? ''}';
        _selectedPaymentOperator = '${_paymentMethods.first['operator'] ?? ''}';
      }

      if (_selectedRepaymentMethod.isEmpty && _repaymentOptions.isNotEmpty) {
        _selectedRepaymentMethod = '${_repaymentOptions.first['key'] ?? ''}';
        _selectedExtensionMethod = _selectedRepaymentMethod;
      }

      await _sessionStorage.saveSession(
        phone: phone,
        countryCode: _selectedCountryCode,
      );

      if (!quiet) {
        _setMessage('Customer data synced successfully.', tone: 'success');
      }
    } catch (error) {
      if (!quiet) {
        _setMessage(_cleanError(error), tone: 'error');
      }
    } finally {
      if (mounted) {
        setState(() {
          _portalLoading = false;
        });
      }
    }
  }

  void _hydrateProfileFromCustomer(Map<String, dynamic> customer) {
    final idInfo = customer['IDinfo'] as Map<String, dynamic>? ?? {};
    final personal = customer['pesonalInfo'] as Map<String, dynamic>? ?? {};
    final education = customer['educationInfo'] as Map<String, dynamic>? ?? {};
    final work = customer['workInfo'] as Map<String, dynamic>? ?? {};
    final contacts = customer['emergncyContacts'] as Map<String, dynamic>? ?? {};

    _firstNameController.text = '${idInfo['firstName'] ?? ''}';
    _middleNameController.text = '${idInfo['middleName'] ?? ''}';
    _lastNameController.text = '${idInfo['lastName'] ?? ''}';
    _emailController.text = '${customer['email'] ?? ''}';
    _backupPhoneController.text = '${personal['bUPphone'] ?? ''}';
    _dobController.text = '${personal['dob'] ?? ''}';
    _digitalAddressController.text = '${personal['dAddress'] ?? ''}';
    _areaController.text = '${personal['areaName'] ?? ''}';
    _landmarkController.text = '${personal['landMark'] ?? ''}';
    _residenceTimeController.text = '${personal['residenceTime'] ?? ''}';
    _incomeSourceController.text = '${personal['incomeSource'] ?? ''}';
    _dependantsController.text = '${personal['relativesINOC'] ?? ''}';
    _selectedGender = '${idInfo['gender'] ?? ''}';
    _selectedMaritalStatus = '${personal['maritalStatus'] ?? ''}';
    _selectedEducationLevel = '${personal['educationalLevel'] ?? ''}';
    _selectedSchoolStatus = personal['schoolStatus'] == true ? 'Yes' : 'No';
    _selectedResidenceType = '${personal['residenceType'] ?? ''}';

    _schoolNameController.text = '${education['currentSchoolName'] ?? ''}';
    _courseController.text = '${education['courseOfStudy'] ?? ''}';
    _graduationYearController.text = '${education['graduationYear'] ?? ''}';
    _schoolAddressController.text = '${education['schoolAddress'] ?? ''}';

    _workUnitController.text = '${work['workUnit'] ?? ''}';
    _industryController.text = '${work['industry'] ?? ''}';
    _workAddressController.text = '${work['workAddress'] ?? ''}';
    _companyAddressController.text = '${work['companyAddress'] ?? ''}';
    _workLandmarkController.text = '${work['LNDmarkCompany'] ?? ''}';
    _workIncomeController.text = '${work['currentIncome'] ?? ''}';
    _workContentController.text = '${work['workContent'] ?? ''}';
    _selectedWorkHours = '${work['workHours'] ?? ''}';
    _idNumberController.text = '${idInfo['gCardNumber'] ?? ''}';

    final contact1 = contacts['contact1'] as Map<String, dynamic>? ?? {};
    final contact2 = contacts['contact2'] as Map<String, dynamic>? ?? {};
    final contact3 = contacts['contact3'] as Map<String, dynamic>? ?? {};

    _contact1NameController.text = '${contact1['name'] ?? ''}';
    _contact1PhoneController.text = '${contact1['phone'] ?? ''}';
    _contact1AddressController.text = '${contact1['address'] ?? ''}';
    _selectedRelationship1 = '${contact1['relationship'] ?? ''}';
    _selectedContactEdu1 = '${contact1['educationalLevel'] ?? ''}';

    _contact2NameController.text = '${contact2['name'] ?? ''}';
    _contact2PhoneController.text = '${contact2['phone'] ?? ''}';
    _contact2AddressController.text = '${contact2['address'] ?? ''}';
    _selectedRelationship2 = '${contact2['relationship'] ?? ''}';
    _selectedContactEdu2 = '${contact2['educationalLevel'] ?? ''}';

    _contact3NameController.text = '${contact3['name'] ?? ''}';
    _contact3PhoneController.text = '${contact3['phone'] ?? ''}';
    _contact3AddressController.text = '${contact3['address'] ?? ''}';
    _selectedRelationship3 = '${contact3['relationship'] ?? ''}';
    _selectedContactEdu3 = '${contact3['educationalLevel'] ?? ''}';
  }

  void _hydrateDraft(Map<String, dynamic> draft) {
    final personal = draft['personal'] as Map<String, dynamic>? ?? {};
    final education = draft['education'] as Map<String, dynamic>? ?? {};
    final work = draft['work'] as Map<String, dynamic>? ?? {};
    final emergency = draft['emergency'] as Map<String, dynamic>? ?? {};
    final identity = draft['identity'] as Map<String, dynamic>? ?? {};
    final contacts = emergency['contacts'] as List<dynamic>? ?? [];

    if (_firstNameController.text.isEmpty) {
      _firstNameController.text = '${personal['firstName'] ?? ''}';
    }
    if (_middleNameController.text.isEmpty) {
      _middleNameController.text = '${personal['middleName'] ?? ''}';
    }
    if (_lastNameController.text.isEmpty) {
      _lastNameController.text = '${personal['lastName'] ?? ''}';
    }
    if (_emailController.text.isEmpty) {
      _emailController.text = '${personal['email'] ?? ''}';
    }
    if (_selectedGender.isEmpty) {
      _selectedGender = '${personal['gender'] ?? ''}';
    }
    if (_selectedEducationLevel.isEmpty) {
      _selectedEducationLevel = '${personal['educationalLevel'] ?? ''}';
    }
    if (_selectedMaritalStatus.isEmpty) {
      _selectedMaritalStatus = '${personal['maritalStatus'] ?? ''}';
    }
    if (_selectedSchoolStatus.isEmpty) {
      _selectedSchoolStatus = '${personal['schoolStatus'] ?? ''}';
    }
    if (_selectedResidenceType.isEmpty) {
      _selectedResidenceType = '${personal['residenceType'] ?? ''}';
    }
    if (_dobController.text.isEmpty) {
      _dobController.text = '${personal['dob'] ?? ''}';
    }
    if (_backupPhoneController.text.isEmpty) {
      _backupPhoneController.text = '${personal['backupPhone'] ?? ''}';
    }
    if (_digitalAddressController.text.isEmpty) {
      _digitalAddressController.text = '${personal['digitalAddress'] ?? ''}';
    }
    if (_areaController.text.isEmpty) {
      _areaController.text = '${personal['areaName'] ?? ''}';
    }
    if (_landmarkController.text.isEmpty) {
      _landmarkController.text = '${personal['landmark'] ?? ''}';
    }
    if (_residenceTimeController.text.isEmpty) {
      _residenceTimeController.text = '${personal['residenceTime'] ?? ''}';
    }
    if (_incomeSourceController.text.isEmpty) {
      _incomeSourceController.text = '${personal['incomeSource'] ?? ''}';
    }
    if (_dependantsController.text.isEmpty) {
      _dependantsController.text = '${personal['dependants'] ?? ''}';
    }

    if (_schoolNameController.text.isEmpty) {
      _schoolNameController.text = '${education['currentSchoolName'] ?? ''}';
    }
    if (_courseController.text.isEmpty) {
      _courseController.text = '${education['courseOfStudy'] ?? ''}';
    }
    if (_graduationYearController.text.isEmpty) {
      _graduationYearController.text = '${education['graduationYear'] ?? ''}';
    }
    if (_schoolAddressController.text.isEmpty) {
      _schoolAddressController.text = '${education['schoolAddress'] ?? ''}';
    }

    if (_workUnitController.text.isEmpty) {
      _workUnitController.text = '${work['workUnit'] ?? ''}';
    }
    if (_industryController.text.isEmpty) {
      _industryController.text = '${work['industry'] ?? ''}';
    }
    if (_workAddressController.text.isEmpty) {
      _workAddressController.text = '${work['workAddress'] ?? ''}';
    }
    if (_companyAddressController.text.isEmpty) {
      _companyAddressController.text = '${work['companyAddress'] ?? ''}';
    }
    if (_workLandmarkController.text.isEmpty) {
      _workLandmarkController.text = '${work['landmarkCompany'] ?? ''}';
    }
    if (_workIncomeController.text.isEmpty) {
      _workIncomeController.text = '${work['currentIncome'] ?? ''}';
    }
    if (_workContentController.text.isEmpty) {
      _workContentController.text = '${work['workContent'] ?? ''}';
    }
    if (_selectedWorkHours.isEmpty) {
      _selectedWorkHours = '${work['workHours'] ?? ''}';
    }
    if (_selectedIdType.isEmpty) {
      _selectedIdType = '${identity['idType'] ?? ''}';
    }
    if (_idNumberController.text.isEmpty) {
      _idNumberController.text = '${identity['idNumber'] ?? ''}';
    }

    if (contacts.isNotEmpty && contacts.first is Map<String, dynamic>) {
      final contact = contacts.first as Map<String, dynamic>;
      _contact1NameController.text = '${contact['name'] ?? ''}';
      _contact1PhoneController.text = '${contact['phone'] ?? ''}';
      _contact1AddressController.text = '${contact['address'] ?? ''}';
      _selectedRelationship1 = '${contact['relationship'] ?? ''}';
      _selectedContactEdu1 = '${contact['educationalLevel'] ?? ''}';
    }
  }

  Future<void> _requestOtp() async {
    final phone = _phoneController.text.trim();
    if (!_isValidPhone(phone)) {
      _setMessage('Enter a valid phone number first.', tone: 'error');
      return;
    }

    setState(() {
      _authLoading = true;
    });

    try {
      if (_isRealOtpMode) {
        if (!_firebaseReady) {
          throw Exception(
            'Firebase mobile keys are not configured yet. Add them first or use demo OTP mode.',
          );
        }

        await _firebasePhoneAuthService.requestOtp(
          phoneNumber: _buildE164Phone(phone),
          onCodeSent: () {},
        );
      } else {
        await _api.requestOtp({
          'phone': phone,
          'purpose': _resetPinMode ? 'reset' : 'signup',
          'countryCode': _selectedCountryCode,
        });
      }

      setState(() {
        _otpRequested = true;
      });
      _setMessage('OTP sent successfully.', tone: 'success');
    } catch (error) {
      _setMessage(_cleanError(error), tone: 'error');
    } finally {
      if (mounted) {
        setState(() {
          _authLoading = false;
        });
      }
    }
  }

  Future<void> _setPin() async {
    final phone = _phoneController.text.trim();
    final otp = _otpController.text.trim();
    final pin = _pinController.text.trim();
    final confirmPin = _confirmPinController.text.trim();

    if (!_isValidPhone(phone)) {
      _setMessage('Enter a valid phone number.', tone: 'error');
      return;
    }
    if (otp.length < 4) {
      _setMessage('Enter the OTP code you received.', tone: 'error');
      return;
    }
    if (!_isValidPin(pin) || !_isValidPin(confirmPin)) {
      _setMessage('PIN must be exactly 4 digits.', tone: 'error');
      return;
    }
    if (pin != confirmPin) {
      _setMessage('PIN and confirm PIN do not match.', tone: 'error');
      return;
    }

    setState(() {
      _authLoading = true;
    });

    try {
      if (_isRealOtpMode) {
        _firebaseIdToken = await _firebasePhoneAuthService.confirmOtp(otp);
      } else {
        await _api.verifyOtp({
          'phone': phone,
          'otp': otp,
          'purpose': _resetPinMode ? 'reset' : 'signup',
          'countryCode': _selectedCountryCode,
        });
      }

      final response = await _api.setPin({
        'phone': phone,
        'pin': pin,
        'purpose': _resetPinMode ? 'reset' : 'signup',
        'countryCode': _selectedCountryCode,
        if (_firebaseIdToken.isNotEmpty) 'firebaseIdToken': _firebaseIdToken,
      });

      _loginPinController.text = pin;
      _authMode = 'login';
      _otpRequested = false;
      _otpController.clear();
      _pinController.clear();
      _confirmPinController.clear();
      _firebaseIdToken = '';
      _resetPinMode = false;
      await _firebasePhoneAuthService.signOut();

      _setMessage(
        '${response['message'] ?? 'PIN saved successfully.'} You can now log in.',
        tone: 'success',
      );
    } catch (error) {
      _setMessage(_cleanError(error), tone: 'error');
    } finally {
      if (mounted) {
        setState(() {
          _authLoading = false;
        });
      }
    }
  }

  Future<void> _login() async {
    final phone = _phoneController.text.trim();
    final pin = _loginPinController.text.trim();

    if (!_isValidPhone(phone)) {
      _setMessage('Enter a valid phone number.', tone: 'error');
      return;
    }
    if (!_isValidPin(pin)) {
      _setMessage('PIN must be exactly 4 digits.', tone: 'error');
      return;
    }

    setState(() {
      _authLoading = true;
    });

    try {
      final response = await _api.login({
        'phone': phone,
        'pin': pin,
        'countryCode': _selectedCountryCode,
      });

      final data = response['data'];
      if (data is! Map<String, dynamic>) {
        throw Exception('Login response is invalid.');
      }

      _sessionAccount = data;
      _isSignedIn = true;
      await _loadPortalSummary(phone, quiet: true);
      _setMessage(
        'Login successful.',
        tone: 'success',
        autoClearAfter: const Duration(seconds: 3),
      );
    } catch (error) {
      _setMessage(_cleanError(error), tone: 'error');
    } finally {
      if (mounted) {
        setState(() {
          _authLoading = false;
        });
      }
    }
  }

  Future<void> _logout() async {
    await _sessionStorage.clearSession();
    await _sessionStorage.clearPendingGateway();
    await _firebasePhoneAuthService.signOut();

    setState(() {
      _sessionAccount = null;
      _repaymentSummary = null;
      _extensionSummary = null;
      _lastTransaction = null;
      _pendingGatewayReference = '';
      _pendingGatewayType = '';
      _isSignedIn = false;
      _activeTab = 'home';
    });

    _setMessage('Logged out successfully.', tone: 'success');
  }

  Future<void> _startPinReset() async {
    await _logout();
    if (!mounted) {
      return;
    }
    setState(() {
      _authMode = 'signup';
      _resetPinMode = true;
    });
    _setMessage('Enter your phone number to reset PIN.', tone: 'info');
  }

  Future<void> _saveDraft() async {
    final phone = _phoneController.text.trim();
    if (!_isValidPhone(phone)) {
      _setMessage('Enter a valid phone number first.', tone: 'error');
      return;
    }

    setState(() {
      _profileSaving = true;
    });

    try {
      final response = await _api.saveDraft({
        'phone': phone,
        'countryCode': _selectedCountryCode,
        'application': _buildApplicationPayload(),
      });

      _setMessage(
        '${response['message'] ?? 'Draft saved successfully.'}',
        tone: 'success',
      );
      await _loadPortalSummary(phone, quiet: true);
    } catch (error) {
      _setMessage(_cleanError(error), tone: 'error');
    } finally {
      if (mounted) {
        setState(() {
          _profileSaving = false;
        });
      }
    }
  }

  Future<void> _submitProfile() async {
    final phone = _phoneController.text.trim();
    if (!_isValidPhone(phone)) {
      _setMessage('Enter a valid phone number first.', tone: 'error');
      return;
    }
    if (_emailController.text.trim().isEmpty) {
      _setMessage('Email is required before submitting the profile.', tone: 'error');
      return;
    }

    setState(() {
      _profileSaving = true;
    });

    try {
      final response = await _api.submitProfile(
        phone: phone,
        application: _buildApplicationPayload(),
        countryCode: _selectedCountryCode,
        frontPhoto: _frontPhoto,
        backPhoto: _backPhoto,
        selfiePhoto: _selfiePhoto,
      );

      _setMessage(
        '${response['message'] ?? 'Customer profile submitted successfully.'}',
        tone: 'success',
      );
      await _loadPortalSummary(phone, quiet: true);
      _activeTab = 'apply';
    } catch (error) {
      _setMessage(_cleanError(error), tone: 'error');
    } finally {
      if (mounted) {
        setState(() {
          _profileSaving = false;
        });
      }
    }
  }

  Future<void> _applyLoan() async {
    final phone = _phoneController.text.trim();
    if (_offer == null) {
      _setMessage('Loan offer is not ready yet.', tone: 'error');
      return;
    }
    if (!_termsAccepted) {
      _setMessage('You must accept the terms before applying.', tone: 'error');
      return;
    }
    if (_selectedTermKey.isEmpty) {
      _setMessage('Choose a loan term first.', tone: 'error');
      return;
    }
    if (_selectedPaymentMethod.isEmpty) {
      _setMessage('Choose a payout method.', tone: 'error');
      return;
    }

    setState(() {
      _loanLoading = true;
    });

    try {
      final response = await _api.applyLoan({
        'phone': phone,
        'countryCode': _selectedCountryCode,
        'termKey': _selectedTermKey,
        'amount': double.tryParse(_loanAmountController.text.trim()) ?? 0,
        'paymentMethod': _selectedPaymentMethod,
        'paymentOperator': _selectedPaymentOperator,
        'useLoan': 'Personal needs',
        'acceptedTerms': true,
      });

      _setMessage(
        '${response['message'] ?? 'Loan application submitted successfully.'}',
        tone: 'success',
      );
      await _loadPortalSummary(phone, quiet: true);
      _activeTab = 'records';
    } catch (error) {
      _setMessage(_cleanError(error), tone: 'error');
    } finally {
      if (mounted) {
        setState(() {
          _loanLoading = false;
        });
      }
    }
  }

  Future<void> _reviewRepayment() async {
    final phone = _phoneController.text.trim();
    if (_selectedRepaymentMethod.isEmpty) {
      _setMessage('Select a repayment method.', tone: 'error');
      return;
    }

    setState(() {
      _gatewayLoading = true;
    });

    try {
      final response = await _api.fetchRepaymentSummary({
        'phone': phone,
        'repaymentType': _selectedRepaymentType,
        'amount': double.tryParse(_repaymentAmountController.text.trim()) ?? 0,
      });
      final data = response['data'];
      if (data is! Map<String, dynamic>) {
        throw Exception('Repayment summary is missing.');
      }
      setState(() {
        _repaymentSummary = data;
      });
      _setMessage('Repayment summary loaded.', tone: 'success');
    } catch (error) {
      _setMessage(_cleanError(error), tone: 'error');
    } finally {
      if (mounted) {
        setState(() {
          _gatewayLoading = false;
        });
      }
    }
  }

  Future<void> _submitRepayment() async {
    final phone = _phoneController.text.trim();
    if (_selectedRepaymentMethod.isEmpty) {
      _setMessage('Select a repayment method.', tone: 'error');
      return;
    }

    setState(() {
      _gatewayLoading = true;
    });

    try {
      final response = await _api.payLoan({
        'phone': phone,
        'repaymentType': _selectedRepaymentType,
        'amount': _repaymentSummary?['amount'] ??
            (double.tryParse(_repaymentAmountController.text.trim()) ?? 0),
        'methodKey': _selectedRepaymentMethod,
        'mobileMoneyOperator': _selectedRepaymentOperator,
      });

      await _handleGatewayResponse(response, type: 'repayment');
    } catch (error) {
      _setMessage(_cleanError(error), tone: 'error');
    } finally {
      if (mounted) {
        setState(() {
          _gatewayLoading = false;
        });
      }
    }
  }

  Future<void> _reviewExtension() async {
    final phone = _phoneController.text.trim();
    if (_selectedExtensionKey.isEmpty) {
      _setMessage('Select an extension option first.', tone: 'error');
      return;
    }

    setState(() {
      _gatewayLoading = true;
    });

    try {
      final response = await _api.fetchExtensionSummary({
        'phone': phone,
        'extensionKey': _selectedExtensionKey,
      });
      final data = response['data'];
      if (data is! Map<String, dynamic>) {
        throw Exception('Extension summary is missing.');
      }
      setState(() {
        _extensionSummary = data;
      });
      _setMessage('Extension summary loaded.', tone: 'success');
    } catch (error) {
      _setMessage(_cleanError(error), tone: 'error');
    } finally {
      if (mounted) {
        setState(() {
          _gatewayLoading = false;
        });
      }
    }
  }

  Future<void> _submitExtension() async {
    final phone = _phoneController.text.trim();
    if (_selectedExtensionKey.isEmpty) {
      _setMessage('Select an extension option first.', tone: 'error');
      return;
    }
    if (_selectedExtensionMethod.isEmpty) {
      _setMessage('Select an extension payment method.', tone: 'error');
      return;
    }

    setState(() {
      _gatewayLoading = true;
    });

    try {
      final response = await _api.extendLoan({
        'phone': phone,
        'extensionKey': _selectedExtensionKey,
        'methodKey': _selectedExtensionMethod,
        'mobileMoneyOperator': _selectedExtensionOperator,
      });

      await _handleGatewayResponse(response, type: 'extension');
    } catch (error) {
      _setMessage(_cleanError(error), tone: 'error');
    } finally {
      if (mounted) {
        setState(() {
          _gatewayLoading = false;
        });
      }
    }
  }

  Future<void> _handleGatewayResponse(
    Map<String, dynamic> response, {
    required String type,
  }) async {
    final success = response['success'];
    final data = response['data'] as Map<String, dynamic>? ?? {};

    if (success == 2) {
      final reference = '${data['reference'] ?? ''}';
      final checkoutUrl = '${data['checkoutUrl'] ?? ''}';
      _pendingGatewayReference = reference;
      _pendingGatewayType = type;
      await _sessionStorage.savePendingGateway(
        reference: reference,
        type: type,
      );

      if (checkoutUrl.isNotEmpty) {
        final uri = Uri.tryParse(checkoutUrl);
        if (uri != null) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        }
      }

      _setMessage(
        '${response['message'] ?? 'Continue to make payment.'} Then tap verify pending payment.',
        tone: 'info',
      );
      return;
    }

    if (success == 1) {
      _lastTransaction = {
        'type': type,
        'amount': data['transaction']?['amount'] ?? _repaymentSummary?['amount'] ?? 0,
        'reference':
            data['transaction']?['reference'] ?? _pendingGatewayReference,
        'status': 'Completed',
        'date': DateTime.now().toIso8601String(),
      };
      _pendingGatewayReference = '';
      _pendingGatewayType = '';
      await _sessionStorage.clearPendingGateway();
      await _loadPortalSummary(_phoneController.text.trim(), quiet: true);
      _setMessage(
        '${response['message'] ?? 'Payment completed successfully.'}',
        tone: 'success',
      );
      return;
    }

    throw Exception('${response['message'] ?? 'Payment failed. Try later.'}');
  }

  Future<void> _verifyPendingGateway() async {
    if (_pendingGatewayReference.isEmpty) {
      _setMessage('There is no pending gateway transaction to verify.', tone: 'error');
      return;
    }

    setState(() {
      _gatewayLoading = true;
    });

    try {
      final response = await _api.verifyGateway(_pendingGatewayReference);
      await _handleGatewayResponse(
        response,
        type: _pendingGatewayType.isEmpty ? 'repayment' : _pendingGatewayType,
      );
    } catch (error) {
      _setMessage(_cleanError(error), tone: 'error');
    } finally {
      if (mounted) {
        setState(() {
          _gatewayLoading = false;
        });
      }
    }
  }

  Map<String, dynamic> _buildApplicationPayload() {
    return {
      'countryCode': _selectedCountryCode,
      'personal': {
        'firstName': _firstNameController.text.trim(),
        'middleName': _middleNameController.text.trim(),
        'lastName': _lastNameController.text.trim(),
        'phone': _phoneController.text.trim(),
        'countryCode': _selectedCountryCode,
        'backupPhone': _backupPhoneController.text.trim(),
        'email': _emailController.text.trim(),
        'dob': _dobController.text.trim(),
        'gender': _selectedGender,
        'maritalStatus': _selectedMaritalStatus,
        'educationalLevel': _selectedEducationLevel,
        'schoolStatus': _selectedSchoolStatus,
        'residenceType': _selectedResidenceType,
        'residenceTime': _residenceTimeController.text.trim(),
        'digitalAddress': _digitalAddressController.text.trim(),
        'areaName': _areaController.text.trim(),
        'landmark': _landmarkController.text.trim(),
        'incomeSource': _incomeSourceController.text.trim(),
        'dependants': _dependantsController.text.trim(),
      },
      'education': {
        'currentSchoolName': _schoolNameController.text.trim(),
        'highestLevel': _selectedEducationLevel,
        'courseOfStudy': _courseController.text.trim(),
        'graduationYear': _graduationYearController.text.trim(),
        'schoolAddress': _schoolAddressController.text.trim(),
      },
      'work': {
        'workUnit': _workUnitController.text.trim(),
        'industry': _industryController.text.trim(),
        'workAddress': _workAddressController.text.trim(),
        'companyAddress': _companyAddressController.text.trim(),
        'landmarkCompany': _workLandmarkController.text.trim(),
        'workHours': _selectedWorkHours,
        'currentIncome': _workIncomeController.text.trim(),
        'workContent': _workContentController.text.trim(),
      },
      'emergency': {
        'contacts': [
          {
            'name': _contact1NameController.text.trim(),
            'phone': _contact1PhoneController.text.trim(),
            'relationship': _selectedRelationship1,
            'address': _contact1AddressController.text.trim(),
            'educationalLevel': _selectedContactEdu1,
          },
          {
            'name': _contact2NameController.text.trim(),
            'phone': _contact2PhoneController.text.trim(),
            'relationship': _selectedRelationship2,
            'address': _contact2AddressController.text.trim(),
            'educationalLevel': _selectedContactEdu2,
          },
          {
            'name': _contact3NameController.text.trim(),
            'phone': _contact3PhoneController.text.trim(),
            'relationship': _selectedRelationship3,
            'address': _contact3AddressController.text.trim(),
            'educationalLevel': _selectedContactEdu3,
          },
        ],
      },
      'identity': {
        'idType': _selectedIdType,
        'idNumber': _idNumberController.text.trim(),
      },
    };
  }

  Future<void> _pickImage(String target) async {
    final picked = await _imagePicker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 70,
      maxWidth: 1600,
    );

    if (picked == null) {
      return;
    }

    setState(() {
      if (target == 'front') {
        _frontPhoto = File(picked.path);
      } else if (target == 'back') {
        _backPhoto = File(picked.path);
      } else {
        _selfiePhoto = File(picked.path);
      }
    });
  }

  String _buildE164Phone(String value) {
    final dial = '${_selectedCountry['dialCode'] ?? '+260'}'.replaceAll('+', '');
    final digits = value.replaceAll(RegExp(r'\D+'), '').replaceFirst(RegExp(r'^0+'), '');
    return '+$dial$digits';
  }

  bool _isValidPhone(String value) {
    final digits = value.replaceAll(RegExp(r'\D+'), '');
    return digits.length >= 9;
  }

  bool _isValidPin(String value) {
    return RegExp(r'^\d{4}$').hasMatch(value);
  }

  void _clearMessage() {
    _messageTimer?.cancel();
    _messageTimer = null;
    if (!mounted) {
      return;
    }
    setState(() {
      _message = '';
      _messageTone = 'info';
    });
  }

  void _setMessage(
    String value, {
    String tone = 'info',
    Duration? autoClearAfter,
  }) {
    _messageTimer?.cancel();
    if (!mounted) {
      return;
    }
    setState(() {
      _message = value;
      _messageTone = tone;
    });
    if (autoClearAfter != null && value.trim().isNotEmpty) {
      _messageTimer = Timer(autoClearAfter, _clearMessage);
    }
  }

  String _cleanError(Object error) {
    final raw = error.toString().replaceFirst('Exception: ', '').trim();
    if (raw.toLowerCase().contains('html page')) {
      return 'The mobile app could not reach the SpeedCash customer API. Check the hosted API settings in mobile/.env.';
    }
    if (raw.toLowerCase().contains('timeoutexception') ||
        raw.toLowerCase().contains('socketexception') ||
        raw.toLowerCase().contains('failed host lookup') ||
        raw.toLowerCase().contains('clientexception')) {
      return 'Unable to reach SpeedCash right now. Please try again shortly.';
    }
    if (raw.isEmpty) {
      return 'Something went wrong. Try again.';
    }
    return raw;
  }

  List<Map<String, String>> _supportEntries() {
    final entries = <Map<String, String>>[
      {
        'label': 'WhatsApp',
        'value': '${_portalContent['supportWhatsapp'] ?? ''}'.trim(),
        'kind': 'whatsapp',
      },
      {
        'label': 'Phone',
        'value': '${_portalContent['supportPhone'] ?? ''}'.trim(),
        'kind': 'phone',
      },
      {
        'label': 'Email',
        'value': '${_portalContent['supportEmail'] ?? ''}'.trim(),
        'kind': 'email',
      },
    ];

    return entries.where((item) => item['value']?.isNotEmpty == true).toList();
  }

  Future<void> _openSupportValue(String kind, String value) async {
    Uri? uri;
    if (kind == 'whatsapp') {
      final digits = value.replaceAll(RegExp(r'\D+'), '');
      if (digits.isNotEmpty) {
        uri = Uri.parse('https://wa.me/$digits');
      }
    } else if (kind == 'phone') {
      final digits = value.replaceAll(RegExp(r'[^0-9+]'), '');
      if (digits.isNotEmpty) {
        uri = Uri.parse('tel:$digits');
      }
    } else if (kind == 'email' && value.isNotEmpty) {
      uri = Uri.parse('mailto:$value');
    }

    if (uri == null) {
      return;
    }

    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Widget _buildSupportCard({required String title}) {
    final entries = _supportEntries();
    if (entries.isEmpty) {
      return const SizedBox.shrink();
    }

    return _SectionCard(
      title: title,
      child: Column(
        children: entries
            .map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: InkWell(
                  borderRadius: BorderRadius.circular(14),
                  onTap: () => _openSupportValue(
                    item['kind'] ?? '',
                    item['value'] ?? '',
                  ),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppTheme.accentSoft,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          switch (item['kind']) {
                            'whatsapp' => Icons.chat_bubble_outline,
                            'email' => Icons.mail_outline,
                            _ => Icons.call_outlined,
                          },
                          color: AppTheme.accentInk,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item['label'] ?? '',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.accentInk,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(item['value'] ?? ''),
                            ],
                          ),
                        ),
                        const Icon(
                          Icons.open_in_new,
                          size: 18,
                          color: AppTheme.accentInk,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            )
            .toList(),
      ),
    );
  }

  String _formatMoney(dynamic value) {
    final amount = (value is num) ? value.toDouble() : double.tryParse('$value') ?? 0;
    final symbol = '${_selectedCountry['currencySymbol'] ?? 'K'}';
    return '$symbol${NumberFormat('#,##0.00').format(amount)}';
  }

  String _formatDate(dynamic value) {
    final parsed = DateTime.tryParse('$value');
    if (parsed == null) {
      return '$value';
    }
    return DateFormat('dd MMM yyyy, hh:mm a').format(parsed.toLocal());
  }

  String _formatShortDate(dynamic value) {
    final parsed = DateTime.tryParse('$value');
    if (parsed == null) {
      return '$value';
    }
    return DateFormat('dd MMM yyyy').format(parsed.toLocal());
  }

  String _formatLoanTimeLeft(Map<String, dynamic>? loan) {
    final daysRemaining = loan?['daysRemaining'];
    final overdueDays = loan?['overdueDays'];
    if (daysRemaining is num) {
      if (daysRemaining < 0) {
        return '${overdueDays ?? daysRemaining.abs()} days overdue';
      }
      if (daysRemaining == 0) {
        return 'Due today';
      }
      return '$daysRemaining days left';
    }
    return '-';
  }

  void _openRecordsTab() {
    setState(() {
      _activeTab = 'records';
    });
  }

  Future<void> _openRepaymentModal() async {
    if (_activeLoan?['canMakePayment'] != true) {
      return;
    }

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (context, modalSetState) {
            return _ActionSheetShell(
              title: 'Make Payment',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Repay your active loan without leaving this page.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppTheme.textSoft,
                        ),
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    initialValue: _selectedRepaymentType,
                    decoration: const InputDecoration(labelText: 'Repayment type'),
                    items: const [
                      DropdownMenuItem(value: 'full', child: Text('Full payment')),
                      DropdownMenuItem(value: 'partial', child: Text('Partial payment')),
                    ],
                    onChanged: (value) {
                      setState(() {
                        _selectedRepaymentType = value ?? 'full';
                        _repaymentSummary = null;
                      });
                      modalSetState(() {});
                    },
                  ),
                  const SizedBox(height: 12),
                  if (_selectedRepaymentType == 'partial') ...[
                    TextField(
                      controller: _repaymentAmountController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(
                        labelText: 'Partial repayment amount',
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                  DropdownButtonFormField<String>(
                    initialValue: _selectedRepaymentMethod.isEmpty
                        ? null
                        : _selectedRepaymentMethod,
                    decoration: const InputDecoration(labelText: 'Payment method'),
                    items: _repaymentOptions
                        .map(
                          (item) => DropdownMenuItem<String>(
                            value: '${item['key']}',
                            child: Text('${item['label']}'),
                          ),
                        )
                        .toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedRepaymentMethod = value ?? '';
                      });
                      modalSetState(() {});
                    },
                  ),
                  const SizedBox(height: 12),
                  if (_selectedRepaymentMethod == 'mobile-money' &&
                      _mobileMoneyNetworks.isNotEmpty) ...[
                    DropdownButtonFormField<String>(
                      initialValue: _selectedRepaymentOperator.isEmpty
                          ? null
                          : _selectedRepaymentOperator,
                      decoration:
                          const InputDecoration(labelText: 'Mobile money operator'),
                      items: _mobileMoneyNetworks
                          .map(
                            (item) => DropdownMenuItem<String>(
                              value: '${item['label'] ?? item['key']}',
                              child: Text('${item['label'] ?? item['key']}'),
                            ),
                          )
                          .toList(),
                      onChanged: (value) {
                        setState(() {
                          _selectedRepaymentOperator = value ?? '';
                        });
                        modalSetState(() {});
                      },
                    ),
                    const SizedBox(height: 12),
                  ],
                  if (_repaymentSummary != null) ...[
                    _InlineInfoCard(
                      title: 'Repayment Summary',
                      body:
                          'Amount to pay: ${_formatMoney(_repaymentSummary?['amount'] ?? 0)}',
                    ),
                    const SizedBox(height: 12),
                  ],
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: _gatewayLoading
                              ? null
                              : () async {
                                  await _reviewRepayment();
                                  modalSetState(() {});
                                },
                          child: const Text('Review Payment'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed:
                              _gatewayLoading || _selectedRepaymentMethod.isEmpty
                                  ? null
                                  : () async {
                                      await _submitRepayment();
                                      modalSetState(() {});
                                    },
                          child: Text(
                            _gatewayLoading ? 'Processing...' : 'Pay Now',
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _openExtensionModal() async {
    if (_activeLoan?['canExtend'] != true || _extensionOptions.isEmpty) {
      return;
    }

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (context, modalSetState) {
            return _ActionSheetShell(
              title: 'Loan Extension',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Choose an extension option and follow the payment steps here.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppTheme.textSoft,
                        ),
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    initialValue: _selectedExtensionKey.isEmpty
                        ? null
                        : _selectedExtensionKey,
                    decoration: const InputDecoration(labelText: 'Extension option'),
                    items: _extensionOptions
                        .map(
                          (item) => DropdownMenuItem<String>(
                            value: '${item['key']}',
                            child: Text(
                              '${item['label']} | Fee ${_formatMoney(item['feeAmount'] ?? 0)}',
                            ),
                          ),
                        )
                        .toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedExtensionKey = value ?? '';
                        _extensionSummary = null;
                      });
                      modalSetState(() {});
                    },
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: _selectedExtensionMethod.isEmpty
                        ? null
                        : _selectedExtensionMethod,
                    decoration:
                        const InputDecoration(labelText: 'Extension payment method'),
                    items: _repaymentOptions
                        .map(
                          (item) => DropdownMenuItem<String>(
                            value: '${item['key']}',
                            child: Text('${item['label']}'),
                          ),
                        )
                        .toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedExtensionMethod = value ?? '';
                      });
                      modalSetState(() {});
                    },
                  ),
                  const SizedBox(height: 12),
                  if (_selectedExtensionMethod == 'mobile-money' &&
                      _mobileMoneyNetworks.isNotEmpty) ...[
                    DropdownButtonFormField<String>(
                      initialValue: _selectedExtensionOperator.isEmpty
                          ? null
                          : _selectedExtensionOperator,
                      decoration:
                          const InputDecoration(labelText: 'Mobile money operator'),
                      items: _mobileMoneyNetworks
                          .map(
                            (item) => DropdownMenuItem<String>(
                              value: '${item['label'] ?? item['key']}',
                              child: Text('${item['label'] ?? item['key']}'),
                            ),
                          )
                          .toList(),
                      onChanged: (value) {
                        setState(() {
                          _selectedExtensionOperator = value ?? '';
                        });
                        modalSetState(() {});
                      },
                    ),
                    const SizedBox(height: 12),
                  ],
                  if (_extensionSummary != null) ...[
                    _InlineInfoCard(
                      title: 'Extension Summary',
                      body:
                          'Fee: ${_formatMoney(_extensionSummary?['extension']?['feeAmount'] ?? 0)} | New due date: ${_formatDate(_extensionSummary?['extension']?['extendedDueDate'] ?? '')}',
                    ),
                    const SizedBox(height: 12),
                  ],
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: _gatewayLoading
                              ? null
                              : () async {
                                  await _reviewExtension();
                                  modalSetState(() {});
                                },
                          child: const Text('Review Extension'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed:
                              _gatewayLoading || _selectedExtensionMethod.isEmpty
                                  ? null
                                  : () async {
                                      await _submitExtension();
                                      modalSetState(() {});
                                    },
                          child: Text(
                            _gatewayLoading ? 'Processing...' : 'Pay Extension Fee',
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _saveProfileChanges() async {
    final previousTab = _activeTab;
    await _submitProfile();
    if (!mounted) {
      return;
    }
    setState(() {
      _activeTab = previousTab;
    });
  }

  Future<void> _openProfileEditSheet() async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (context, modalSetState) {
            return _ActionSheetShell(
              title: 'Edit Profile',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _InlineInfoCard(
                    title: 'Locked Fields',
                    body:
                        'Names and your main login phone number are managed by admin and cannot be edited here.',
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(labelText: 'Email'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _backupPhoneController,
                    keyboardType: TextInputType.phone,
                    decoration:
                        const InputDecoration(labelText: 'Alternative phone number'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _dobController,
                    decoration: const InputDecoration(labelText: 'Date of birth'),
                  ),
                  const SizedBox(height: 12),
                  _doubleField(
                    left: _SimpleDropdown(
                      label: 'Gender',
                      value: _selectedGender,
                      items: const ['Male', 'Female'],
                      onChanged: (value) {
                        setState(() {
                          _selectedGender = value;
                        });
                        modalSetState(() {});
                      },
                    ),
                    right: _SimpleDropdown(
                      label: 'Marital status',
                      value: _selectedMaritalStatus,
                      items: _maritalStatuses,
                      onChanged: (value) {
                        setState(() {
                          _selectedMaritalStatus = value;
                        });
                        modalSetState(() {});
                      },
                    ),
                  ),
                  const SizedBox(height: 12),
                  _doubleField(
                    left: _SimpleDropdown(
                      label: 'Education level',
                      value: _selectedEducationLevel,
                      items: _educationLevels,
                      onChanged: (value) {
                        setState(() {
                          _selectedEducationLevel = value;
                        });
                        modalSetState(() {});
                      },
                    ),
                    right: _SimpleDropdown(
                      label: 'In school',
                      value: _selectedSchoolStatus,
                      items: const ['Yes', 'No'],
                      onChanged: (value) {
                        setState(() {
                          _selectedSchoolStatus = value;
                        });
                        modalSetState(() {});
                      },
                    ),
                  ),
                  const SizedBox(height: 12),
                  _SimpleDropdown(
                    label: 'Residence type',
                    value: _selectedResidenceType,
                    items: _residenceTypes,
                    onChanged: (value) {
                      setState(() {
                        _selectedResidenceType = value;
                      });
                      modalSetState(() {});
                    },
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _residenceTimeController,
                    decoration: const InputDecoration(labelText: 'Years at residence'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _digitalAddressController,
                    decoration: const InputDecoration(labelText: 'Digital address'),
                  ),
                  const SizedBox(height: 12),
                  _doubleField(
                    left: TextField(
                      controller: _areaController,
                      decoration: const InputDecoration(labelText: 'Area name'),
                    ),
                    right: TextField(
                      controller: _landmarkController,
                      decoration: const InputDecoration(labelText: 'Landmark'),
                    ),
                  ),
                  const SizedBox(height: 12),
                  _doubleField(
                    left: TextField(
                      controller: _incomeSourceController,
                      decoration: const InputDecoration(labelText: 'Main income source'),
                    ),
                    right: TextField(
                      controller: _dependantsController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Number of dependants'),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: _profileSaving
                              ? null
                              : () async {
                                  await _saveDraft();
                                  modalSetState(() {});
                                },
                          child: Text(_profileSaving ? 'Saving...' : 'Save Draft'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _profileSaving
                              ? null
                              : () async {
                                  await _saveProfileChanges();
                                  if (!mounted) {
                                    return;
                                  }
                                  if (_messageTone == 'success') {
                                    Navigator.of(sheetContext).pop();
                                  } else {
                                    modalSetState(() {});
                                  }
                                },
                          child: Text(
                            _profileSaving ? 'Saving...' : 'Save Changes',
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_booting) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('${_portalContent['appName'] ?? 'SpeedCash'}'),
        actions: [
          if (_isSignedIn)
            IconButton(
              onPressed: _portalLoading
                  ? null
                  : () => _loadPortalSummary(_phoneController.text.trim()),
              icon: const Icon(Icons.refresh),
            ),
          if (_isSignedIn)
            IconButton(
              onPressed: _logout,
              icon: const Icon(Icons.logout),
            ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            _buildMessageBanner(),
            Expanded(
              child: _isSignedIn ? _buildPortal() : _buildAuth(),
            ),
          ],
        ),
      ),
      bottomNavigationBar: _isSignedIn ? _buildBottomNav() : null,
    );
  }

  Widget _buildMessageBanner() {
    if (_message.trim().isEmpty) {
      return const SizedBox.shrink();
    }

    final color = switch (_messageTone) {
      'success' => const Color(0xFFE9F8EF),
      'error' => const Color(0xFFFFE4E6),
      _ => AppTheme.accentSoft,
    };
    final textColor = switch (_messageTone) {
      'success' => const Color(0xFF0F7B3B),
      'error' => const Color(0xFFB42318),
      _ => AppTheme.accentInk,
    };

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        _message,
        style: TextStyle(
          color: textColor,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildAuth() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _HeroCard(
          logoUrl: _portalLogoUrl,
          title: '${_portalContent['appName'] ?? 'SpeedCash'}',
        ),
        const SizedBox(height: 16),
        _SectionCard(
          title: _authMode == 'login'
              ? 'Login'
              : _resetPinMode
                  ? 'Reset PIN'
                  : 'Create PIN',
          child: Column(
            children: [
              _CountryField(
                value: _selectedCountryCode,
                countries: _countries,
                onChanged: (value) {
                  setState(() {
                    _selectedCountryCode = value;
                  });
                },
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(
                  labelText: 'Phone number',
                  hintText: '${_selectedCountry['phoneExample'] ?? '0970000000'}',
                ),
              ),
              const SizedBox(height: 12),
              if (_authMode == 'login')
                TextField(
                  controller: _loginPinController,
                  keyboardType: TextInputType.number,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: '4-digit PIN',
                  ),
                ),
              if (_authMode != 'login') ...[
                TextField(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'OTP code',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _pinController,
                  keyboardType: TextInputType.number,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'New 4-digit PIN',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _confirmPinController,
                  keyboardType: TextInputType.number,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Confirm PIN',
                  ),
                ),
              ],
              const SizedBox(height: 16),
              if (_authMode == 'login')
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _authLoading ? null : _login,
                    child: Text(_authLoading ? 'Signing in...' : 'Login'),
                  ),
                ),
              if (_authMode != 'login') ...[
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: _authLoading ? null : _requestOtp,
                    child: Text(
                      _authLoading
                          ? 'Requesting OTP...'
                          : _otpRequested
                              ? 'Resend OTP'
                              : 'Request OTP',
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _authLoading ? null : _setPin,
                    child: Text(_authLoading ? 'Saving PIN...' : 'Verify OTP And Save PIN'),
                  ),
                ),
              ],
              const SizedBox(height: 12),
              Wrap(
                spacing: 12,
                runSpacing: 8,
                children: [
                  TextButton(
                    onPressed: _authLoading
                        ? null
                        : () {
                            setState(() {
                              _authMode = _authMode == 'login' ? 'signup' : 'login';
                              _resetPinMode = false;
                            });
                          },
                    child: Text(
                      _authMode == 'login'
                          ? 'Create account PIN'
                          : 'Back to login',
                    ),
                  ),
                  if (_authMode == 'login')
                    TextButton(
                      onPressed: _authLoading
                          ? null
                          : () {
                              setState(() {
                                _authMode = 'signup';
                                _resetPinMode = true;
                              });
                            },
                      child: const Text('Reset PIN'),
                    ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _buildSupportCard(title: 'Support'),
      ],
    );
  }

  Widget _buildPortal() {
    return IndexedStack(
      index: switch (_activeTab) {
        'apply' => 1,
        'records' => 2,
        'profile' => 3,
        _ => 0,
      },
      children: [
        _buildHomeTab(),
        _buildApplyTab(),
        _buildRecordsTab(),
        _buildProfileTab(),
      ],
    );
  }

  Widget _buildHomeTab() {
    final faqs = _portalContent['faqs'] as List<dynamic>? ?? [];
    final tutorials = _portalContent['repaymentTutorials'] as List<dynamic>? ?? [];
    final supportEntries = _supportEntries();
    final displayName = _customer?['IDinfo']?['firstName'] ??
        (_firstNameController.text.trim().isNotEmpty
            ? _firstNameController.text.trim()
            : 'Customer');

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _HeroCard(
          title: 'Welcome $displayName',
          subtitle: 'Your mobile account stays synced with the web app.',
        ),
        const SizedBox(height: 16),
        if (_homeBannerTitle.isNotEmpty || _homeBannerMessage.isNotEmpty) ...[
          _HomeBannerCard(
            badge: _homeBannerBadge,
            title: _homeBannerTitle,
            message: _homeBannerMessage,
          ),
          const SizedBox(height: 16),
        ],
        Row(
          children: [
            Expanded(
              child: _MetricCard(
                label: 'Available Credit',
                value: _formatMoney(_offer?['availableCredit'] ?? 0),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _MetricCard(
                label: 'Completed Loans',
                value: '${_offer?['settledLoans'] ?? 0}',
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _MetricCard(
                label: 'Credit Score',
                value: '${_offer?['creditScore'] ?? 0}',
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _MetricCard(
                label: 'Level',
                value: '${_offer?['levelLabel'] ?? 'Starter'}',
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (_activeLoan != null)
          _buildActiveLoanSummaryCard(
            showOpenRecords: true,
          ),
        if (_lastTransaction != null) ...[
          const SizedBox(height: 16),
          _SectionCard(
            title: 'Latest Transaction',
            child: Column(
              children: [
                _LabelValueRow(
                  label: 'Type',
                  value: '${_lastTransaction?['type'] ?? ''}',
                ),
                _LabelValueRow(
                  label: 'Amount',
                  value: _formatMoney(_lastTransaction?['amount'] ?? 0),
                ),
                _LabelValueRow(
                  label: 'Reference',
                  value: '${_lastTransaction?['reference'] ?? ''}',
                ),
                _LabelValueRow(
                  label: 'Date',
                  value: _formatDate(_lastTransaction?['date'] ?? ''),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 16),
        _DisclosureCard(
          title: 'How It Works',
          expanded: _homeHowItWorksExpanded,
          onChanged: (expanded) {
            setState(() {
              _homeHowItWorksExpanded = expanded;
            });
          },
          child: Column(
            children: tutorials
                .map(
                  (item) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Padding(
                          padding: EdgeInsets.only(top: 3),
                          child: Icon(Icons.check_circle_outline, size: 18),
                        ),
                        const SizedBox(width: 8),
                        Expanded(child: Text('$item')),
                      ],
                    ),
                  ),
                )
                .toList(),
          ),
        ),
        const SizedBox(height: 16),
        _DisclosureCard(
          title: 'Frequently Asked Questions',
          expanded: _homeFaqsExpanded,
          onChanged: (expanded) {
            setState(() {
              _homeFaqsExpanded = expanded;
            });
          },
          child: Column(
            children: faqs
                .map(
                  (item) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Text('• $item'),
                    ),
                  ),
                )
                .toList(),
          ),
        ),
        if (supportEntries.isNotEmpty) ...[
          const SizedBox(height: 16),
          _DisclosureCard(
            title: 'Contact',
            expanded: _homeContactExpanded,
            onChanged: (expanded) {
              setState(() {
                _homeContactExpanded = expanded;
              });
            },
            child: Column(
              children: supportEntries
                  .map(
                    (item) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(14),
                        onTap: () => _openSupportValue(
                          item['kind'] ?? '',
                          item['value'] ?? '',
                        ),
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: AppTheme.accentSoft,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                switch (item['kind']) {
                                  'whatsapp' => Icons.chat_bubble_outline,
                                  'email' => Icons.mail_outline,
                                  _ => Icons.call_outlined,
                                },
                                color: AppTheme.accentInk,
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item['label'] ?? '',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                        color: AppTheme.accentInk,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(item['value'] ?? ''),
                                  ],
                                ),
                              ),
                              const Icon(
                                Icons.keyboard_arrow_right,
                                color: AppTheme.accentInk,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildApplyTab() {
    final hasProfile = _sessionAccount?['hasProfile'] == true || _customer != null;
    final canApply = _offer?['canApply'] == true;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (!hasProfile)
          const _SectionCard(
            title: 'Complete Profile First',
            child: Text(
              'Submit your personal profile and identity documents before applying for a loan.',
            ),
          ),
        if (hasProfile && !canApply && _activeLoan != null)
          _buildActiveLoanSummaryCard(showOpenRecords: true),
        if (hasProfile && !canApply && _activeLoan == null)
          _SectionCard(
            title: 'Loan Application Locked',
            child: Text(
              '${_offer?['activeLoanStatus'] ?? 'You already have an active loan.'}',
            ),
          ),
        if (hasProfile && canApply)
          _SectionCard(
            title: 'Loan Builder',
            child: Column(
              children: [
                DropdownButtonFormField<String>(
                  initialValue: _selectedTermKey.isEmpty ? null : _selectedTermKey,
                  decoration: const InputDecoration(labelText: 'Loan term'),
                  items: _termOptions
                      .map(
                        (item) => DropdownMenuItem<String>(
                          value: '${item['key']}',
                          child: Text(
                            '${item['label']} | ${item['interestRate']}% interest',
                          ),
                        ),
                      )
                      .toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedTermKey = value ?? '';
                    });
                  },
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _loanAmountController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: InputDecoration(
                    labelText:
                        'Loan amount (${_formatMoney(_offer?['minAmount'] ?? 0)} - ${_formatMoney(_offer?['maxAmount'] ?? 0)})',
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: _selectedPaymentMethod.isEmpty
                      ? null
                      : _selectedPaymentMethod,
                  decoration: const InputDecoration(labelText: 'Payout method'),
                  items: _paymentMethods
                      .map(
                        (item) => DropdownMenuItem<String>(
                          value: '${item['method']}',
                          child: Text('${item['method']}'),
                        ),
                      )
                      .toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedPaymentMethod = value ?? '';
                      final match =
                          _paymentMethods.cast<Map<String, dynamic>?>().firstWhere(
                                (item) =>
                                    '${item?['method'] ?? ''}' == _selectedPaymentMethod,
                                orElse: () => null,
                              );
                      _selectedPaymentOperator = '${match?['operator'] ?? ''}';
                    });
                  },
                ),
                const SizedBox(height: 12),
                if (!_selectedPaymentMethod.contains('@') && _mobileMoneyNetworks.isNotEmpty)
                  DropdownButtonFormField<String>(
                    initialValue: _selectedPaymentOperator.isEmpty
                        ? null
                        : _selectedPaymentOperator,
                    decoration: const InputDecoration(labelText: 'Service provider'),
                    items: _mobileMoneyNetworks
                        .map(
                          (item) => DropdownMenuItem<String>(
                            value: '${item['label'] ?? item['key']}',
                            child: Text('${item['label'] ?? item['key']}'),
                          ),
                        )
                        .toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedPaymentOperator = value ?? '';
                      });
                    },
                  ),
                const SizedBox(height: 12),
                CheckboxListTile(
                  value: _termsAccepted,
                  contentPadding: EdgeInsets.zero,
                  onChanged: (value) {
                    setState(() {
                      _termsAccepted = value ?? false;
                    });
                  },
                  title: const Text('I accept the loan terms and conditions'),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _loanLoading ? null : _applyLoan,
                    child: Text(
                      _loanLoading ? 'Submitting...' : 'Apply For Loan',
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildRecordsTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (_activeLoan != null)
          _buildActiveLoanSummaryCard(showOpenRecords: false),
        if (_pendingGatewayReference.isNotEmpty) ...[
          const SizedBox(height: 16),
          _SectionCard(
            title: 'Pending Gateway Payment',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _LabelValueRow(
                  label: 'Reference',
                  value: _pendingGatewayReference,
                ),
                _LabelValueRow(
                  label: 'Type',
                  value: _pendingGatewayType,
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _gatewayLoading ? null : _verifyPendingGateway,
                    child: Text(
                      _gatewayLoading ? 'Verifying...' : 'Verify Pending Payment',
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 16),
        _SectionCard(
          title: 'Loan Records',
          child: Column(
            children: _loanHistory.isEmpty
                ? const [
                    Padding(
                      padding: EdgeInsets.only(top: 4),
                      child: Text('No loan records available yet.'),
                    ),
                  ]
                : _loanHistory
                    .map(
                      (item) => item is Map<String, dynamic>
                          ? Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF7F9FC),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Loan ${item['ID'] ?? item['loanId'] ?? '-'}',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    _LabelValueRow(
                                      label: 'Amount',
                                      value: _formatMoney(item['amount'] ?? 0),
                                    ),
                                    _LabelValueRow(
                                      label: 'Repayment',
                                      value: _formatMoney(item['repaymentAmount'] ?? 0),
                                    ),
                                    _LabelValueRow(
                                      label: 'Loan Status',
                                      value: '${item['loanStatus'] ?? '-'}',
                                    ),
                                    _LabelValueRow(
                                      label: 'Payment Status',
                                      value: '${item['paymentStatus'] ?? '-'}',
                                    ),
                                    _LabelValueRow(
                                      label: 'Applied',
                                      value: _formatDate(item['doa'] ?? ''),
                                    ),
                                  ],
                                ),
                              ),
                            )
                          : const SizedBox.shrink(),
                    )
                    .toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildProfileTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _SectionCard(
          title: 'Profile',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _ProfileHeaderCard(
                title: _profileDisplayName,
                customerId: _profileCustomerId,
              ),
              const SizedBox(height: 16),
              _ProfileInfoTile(
                label: 'Email',
                value: _emailController.text.trim().isEmpty
                    ? '-'
                    : _emailController.text.trim(),
              ),
              const SizedBox(height: 12),
              _ProfileInfoTile(
                label: 'Phone',
                value: _phoneController.text.trim().isEmpty
                    ? '-'
                    : _phoneController.text.trim(),
              ),
              const SizedBox(height: 12),
              _ProfileInfoTile(
                label: 'Country',
                value: _profileCountryName,
              ),
              const SizedBox(height: 12),
              _ProfileInfoTile(
                label: 'ID Verification',
                value: _profileVerificationStatus,
              ),
              const SizedBox(height: 12),
              _ProfileInfoTile(
                label: 'Account Created',
                value: _profileCreatedAt,
              ),
              const SizedBox(height: 16),
              _CreditScoreCard(score: _creditScoreLabel),
              const SizedBox(height: 16),
              _ProfileActionButton(
                label: 'Edit Profile',
                onPressed: _openProfileEditSheet,
              ),
              const SizedBox(height: 12),
              _ProfileActionButton(
                label: 'Change PIN',
                onPressed: _startPinReset,
              ),
              const SizedBox(height: 12),
              _ProfileActionButton(
                label: 'Logout',
                danger: true,
                onPressed: _logout,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildActiveLoanSummaryCard({
    required bool showOpenRecords,
  }) {
    final loan = _activeLoan;
    if (loan == null) {
      return const SizedBox.shrink();
    }

    return _ActiveLoanSummaryCard(
      statusLabel: '${loan['status'] ?? ''}'.isEmpty ? 'Granted' : '${loan['status']}',
      title: '${loan['title'] ?? 'Active loan'}',
      message: '${loan['message'] ?? ''}',
      amount: _formatMoney(loan['amount'] ?? 0),
      totalDue: _formatMoney(loan['totalDue'] ?? 0),
      dueDate: _formatShortDate(loan['dueDate'] ?? ''),
      timeLeft: _formatLoanTimeLeft(loan),
      outstanding: _formatMoney(loan['outstandingBalance'] ?? 0),
      penalty: _formatMoney(loan['overduePenalty'] ?? 0),
      loanId: '${loan['loanId'] ?? '-'}',
      onOpenRecords: showOpenRecords ? _openRecordsTab : null,
      onMakePayment: loan['canMakePayment'] == true ? _openRepaymentModal : null,
      onExtension:
          loan['canExtend'] == true && _extensionOptions.isNotEmpty ? _openExtensionModal : null,
    );
  }

  Widget _buildBottomNav() {
    return NavigationBar(
      selectedIndex: switch (_activeTab) {
        'apply' => 1,
        'records' => 2,
        'profile' => 3,
        _ => 0,
      },
      onDestinationSelected: (index) {
        setState(() {
          _activeTab = switch (index) {
            1 => 'apply',
            2 => 'records',
            3 => 'profile',
            _ => 'home',
          };
        });
      },
      destinations: const [
        NavigationDestination(
          icon: Icon(Icons.home_outlined),
          selectedIcon: Icon(Icons.home),
          label: 'Home',
        ),
        NavigationDestination(
          icon: Icon(Icons.payments_outlined),
          selectedIcon: Icon(Icons.payments),
          label: 'Apply',
        ),
        NavigationDestination(
          icon: Icon(Icons.receipt_long_outlined),
          selectedIcon: Icon(Icons.receipt_long),
          label: 'Records',
        ),
        NavigationDestination(
          icon: Icon(Icons.person_outline),
          selectedIcon: Icon(Icons.person),
          label: 'Profile',
        ),
      ],
    );
  }

  Widget _buildContactBlock({
    required String title,
    required TextEditingController nameController,
    required TextEditingController phoneController,
    required TextEditingController addressController,
    required String relationshipValue,
    required String educationValue,
    required ValueChanged<String> onRelationshipChanged,
    required ValueChanged<String> onEducationChanged,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF7F9FC),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Align(
            alignment: Alignment.centerLeft,
            child: Text(
              title,
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: nameController,
            decoration: const InputDecoration(labelText: 'Name'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: phoneController,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(labelText: 'Phone'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: addressController,
            decoration: const InputDecoration(labelText: 'Address'),
          ),
          const SizedBox(height: 12),
          _doubleField(
            left: _SimpleDropdown(
              label: 'Relationship',
              value: relationshipValue,
              items: _relationshipOptions,
              onChanged: onRelationshipChanged,
            ),
            right: _SimpleDropdown(
              label: 'Education',
              value: educationValue,
              items: _educationLevels,
              onChanged: onEducationChanged,
            ),
          ),
        ],
      ),
    );
  }

  Widget _doubleField({
    required Widget left,
    required Widget right,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: left),
        const SizedBox(width: 12),
        Expanded(child: right),
      ],
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({
    this.logoUrl = '',
    required this.title,
    this.subtitle = '',
  });

  final String logoUrl;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            AppTheme.brandNavy,
            AppTheme.brandNavyAlt,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1F0F172A),
            blurRadius: 28,
            offset: Offset(0, 14),
          ),
        ],
      ),
      child: Row(
        children: [
          _BrandLogo(
            logoUrl: logoUrl,
            title: title,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                if (subtitle.trim().isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      color: Colors.white70,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BrandLogo extends StatelessWidget {
  const _BrandLogo({
    required this.logoUrl,
    required this.title,
  });

  final String logoUrl;
  final String title;

  @override
  Widget build(BuildContext context) {
    if (logoUrl.trim().isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Image.network(
          logoUrl.trim(),
          width: 56,
          height: 56,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _BrandLogoFallback(title: title),
        ),
      );
    }

    return _BrandLogoFallback(title: title);
  }
}

class _BrandLogoFallback extends StatelessWidget {
  const _BrandLogoFallback({
    required this.title,
  });

  final String title;

  @override
  Widget build(BuildContext context) {
    final letter = title.trim().isEmpty ? 'S' : title.trim()[0].toUpperCase();

    return Container(
      width: 56,
      height: 56,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: AppTheme.accent,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        letter,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 28,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.title,
    required this.child,
  });

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      shadowColor: const Color(0x140F172A),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 18,
                color: AppTheme.textMain,
              ),
            ),
            const SizedBox(height: 14),
            child,
          ],
        ),
      ),
    );
  }
}

class _DisclosureCard extends StatelessWidget {
  const _DisclosureCard({
    required this.title,
    required this.expanded,
    required this.onChanged,
    required this.child,
  });

  final String title;
  final bool expanded;
  final ValueChanged<bool> onChanged;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      shadowColor: const Color(0x140F172A),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          initiallyExpanded: expanded,
          onExpansionChanged: onChanged,
          tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          title: Text(
            title,
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 18,
              color: AppTheme.textMain,
            ),
          ),
          children: [child],
        ),
      ),
    );
  }
}

class _HomeBannerCard extends StatelessWidget {
  const _HomeBannerCard({
    required this.badge,
    required this.title,
    required this.message,
  });

  final String badge;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFFF7ED), Color(0xFFFFEDD5)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(color: const Color(0xFFFEC89A)),
        borderRadius: BorderRadius.circular(22),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (badge.trim().isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                badge,
                style: const TextStyle(
                  color: AppTheme.accentInk,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          if (badge.trim().isNotEmpty) const SizedBox(height: 12),
          if (title.trim().isNotEmpty)
            Text(
              title,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: AppTheme.textMain,
              ),
            ),
          if (message.trim().isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              message,
              style: const TextStyle(
                color: AppTheme.textSoft,
                height: 1.4,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ActiveLoanSummaryCard extends StatelessWidget {
  const _ActiveLoanSummaryCard({
    required this.statusLabel,
    required this.title,
    required this.message,
    required this.amount,
    required this.totalDue,
    required this.dueDate,
    required this.timeLeft,
    required this.outstanding,
    required this.penalty,
    required this.loanId,
    this.onOpenRecords,
    this.onMakePayment,
    this.onExtension,
  });

  final String statusLabel;
  final String title;
  final String message;
  final String amount;
  final String totalDue;
  final String dueDate;
  final String timeLeft;
  final String outstanding;
  final String penalty;
  final String loanId;
  final VoidCallback? onOpenRecords;
  final VoidCallback? onMakePayment;
  final VoidCallback? onExtension;

  @override
  Widget build(BuildContext context) {
    return Card(
      shadowColor: const Color(0x140F172A),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'ACTIVE LOAN',
              style: TextStyle(
                color: AppTheme.accentStrong,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: AppTheme.textMain,
              ),
            ),
            if (message.trim().isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(
                message,
                style: const TextStyle(
                  color: AppTheme.textSoft,
                  fontSize: 16,
                  height: 1.4,
                ),
              ),
            ],
            const SizedBox(height: 18),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: AppTheme.accentSoft,
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                statusLabel,
                style: const TextStyle(
                  color: AppTheme.accentInk,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(child: _LoanMetricTile(label: 'Loan Amount', value: amount)),
                const SizedBox(width: 12),
                Expanded(
                  child: _LoanMetricTile(
                    label: 'Total Due',
                    value: totalDue,
                    emphasized: true,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _LoanMetricTile(label: 'Due Date', value: dueDate)),
                const SizedBox(width: 12),
                Expanded(child: _LoanMetricTile(label: 'Time Left', value: timeLeft)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _LoanMetricTile(label: 'Outstanding', value: outstanding)),
                const SizedBox(width: 12),
                Expanded(child: _LoanMetricTile(label: 'Penalty', value: penalty)),
              ],
            ),
            const SizedBox(height: 18),
            Text(
              'Loan ID: $loanId',
              style: const TextStyle(
                color: AppTheme.textSoft,
                fontSize: 15,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Pay or extend before the due date.',
              style: TextStyle(
                color: AppTheme.textSoft,
                fontSize: 15,
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                if (onOpenRecords != null) ...[
                  Expanded(
                    child: OutlinedButton(
                      onPressed: onOpenRecords,
                      child: const Text('Open Records'),
                    ),
                  ),
                  const SizedBox(width: 12),
                ],
                if (onMakePayment != null)
                  Expanded(
                    child: ElevatedButton(
                      onPressed: onMakePayment,
                      child: const Text('Make Payment'),
                    ),
                  ),
                if (onMakePayment != null && onExtension != null) const SizedBox(width: 12),
                if (onExtension != null)
                  Expanded(
                    child: OutlinedButton(
                      onPressed: onExtension,
                      child: const Text('Extension'),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _LoanMetricTile extends StatelessWidget {
  const _LoanMetricTile({
    required this.label,
    required this.value,
    this.emphasized = false,
  });

  final String label;
  final String value;
  final bool emphasized;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: emphasized ? AppTheme.accentSoft : Colors.white,
        border: Border.all(
          color: emphasized ? const Color(0xFFF6C88F) : AppTheme.border,
        ),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: AppTheme.textSoft,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              color: AppTheme.textMain,
              fontWeight: FontWeight.w800,
              fontSize: 17,
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileHeaderCard extends StatelessWidget {
  const _ProfileHeaderCard({
    required this.title,
    required this.customerId,
  });

  final String title;
  final String customerId;

  @override
  Widget build(BuildContext context) {
    final letter = title.trim().isEmpty ? 'S' : title.trim()[0].toUpperCase();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppTheme.border),
        borderRadius: BorderRadius.circular(22),
      ),
      child: Row(
        children: [
          Container(
            width: 76,
            height: 76,
            alignment: Alignment.center,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [Color(0xFFE86A10), Color(0xFF0F172A)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Text(
              letter,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
                fontSize: 34,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.textMain,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'ID: $customerId',
                  style: const TextStyle(
                    color: AppTheme.textSoft,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileInfoTile extends StatelessWidget {
  const _ProfileInfoTile({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFFAF4ED),
        borderRadius: BorderRadius.circular(22),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: AppTheme.textSoft,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            value,
            style: const TextStyle(
              color: AppTheme.textMain,
              fontWeight: FontWeight.w800,
              fontSize: 17,
            ),
          ),
        ],
      ),
    );
  }
}

class _CreditScoreCard extends StatelessWidget {
  const _CreditScoreCard({
    required this.score,
  });

  final String score;

  @override
  Widget build(BuildContext context) {
    final parsedScore = double.tryParse(score) ?? 0;
    final progress = (parsedScore / 850).clamp(0, 1).toDouble();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppTheme.border),
        borderRadius: BorderRadius.circular(22),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Credit Score',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.textMain,
                  ),
                ),
              ),
              Text(
                score,
                style: const TextStyle(
                  color: AppTheme.accentStrong,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 10,
              backgroundColor: const Color(0xFFD8E0EC),
              valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.accentStrong),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileActionButton extends StatelessWidget {
  const _ProfileActionButton({
    required this.label,
    required this.onPressed,
    this.danger = false,
  });

  final String label;
  final VoidCallback onPressed;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: danger ? const Color(0xFFD92D20) : AppTheme.textMain,
          side: const BorderSide(color: AppTheme.border),
          minimumSize: const Size.fromHeight(58),
          textStyle: const TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 16,
          ),
        ),
        child: Text(label),
      ),
    );
  }
}

class _ActionSheetShell extends StatelessWidget {
  const _ActionSheetShell({
    required this.title,
    required this.child,
  });

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          16,
          0,
          16,
          MediaQuery.of(context).viewInsets.bottom + 16,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textMain,
                ),
              ),
              const SizedBox(height: 16),
              child,
            ],
          ),
        ),
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: AppTheme.surfaceMuted,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                color: AppTheme.textSoft,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppTheme.textMain,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LabelValueRow extends StatelessWidget {
  const _LabelValueRow({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              label,
              style: const TextStyle(
                color: AppTheme.textSoft,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

class _InlineInfoCard extends StatelessWidget {
  const _InlineInfoCard({
    required this.title,
    required this.body,
  });

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.accentSoft,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              color: AppTheme.accentInk,
            ),
          ),
          const SizedBox(height: 8),
          Text(body),
        ],
      ),
    );
  }
}

class _SimpleDropdown extends StatelessWidget {
  const _SimpleDropdown({
    required this.label,
    required this.value,
    required this.items,
    required this.onChanged,
  });

  final String label;
  final String value;
  final List<String> items;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<String>(
      initialValue: value.isEmpty ? null : value,
      decoration: InputDecoration(labelText: label),
      items: items
          .map(
            (item) => DropdownMenuItem<String>(
              value: item,
              child: Text(item),
            ),
          )
          .toList(),
      onChanged: (nextValue) {
        onChanged(nextValue ?? '');
      },
    );
  }
}

class _CountryField extends StatelessWidget {
  const _CountryField({
    required this.value,
    required this.countries,
    required this.onChanged,
  });

  final String value;
  final List<Map<String, dynamic>> countries;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<String>(
      initialValue: value.isEmpty ? null : value,
      decoration: const InputDecoration(labelText: 'Country'),
      items: countries
          .map(
            (country) => DropdownMenuItem<String>(
              value: '${country['code']}',
              child: Text(
                '${country['name']} (${country['dialCode'] ?? ''})',
              ),
            ),
          )
          .toList(),
      onChanged: (nextValue) {
        onChanged(nextValue ?? '');
      },
    );
  }
}

class _ImageSelectorCard extends StatelessWidget {
  const _ImageSelectorCard({
    required this.label,
    required this.file,
    required this.onPick,
  });

  final String label;
  final File? file;
  final VoidCallback onPick;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF7F9FC),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          if (file != null)
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.file(
                file!,
                height: 120,
                width: 120,
                fit: BoxFit.cover,
              ),
            ),
          if (file != null) const SizedBox(height: 12),
          OutlinedButton(
            onPressed: onPick,
            child: Text(file == null ? 'Choose Image' : 'Replace Image'),
          ),
        ],
      ),
    );
  }
}
