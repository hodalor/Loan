# SpeedCash Mobile

Flutter mobile client for the SpeedCash customer portal.

## What It Does

- Uses the same customer auth and portal APIs as the existing web app
- Supports PIN login, OTP + PIN setup, profile draft save, and profile submission
- Shows synced customer summary, loan offer, active loan state, repayment, extension, and records
- Opens the same payment gateway flow used by the web app and lets the user verify pending transactions

## Local Setup

1. Copy `.env.example` to `.env`
2. Set `API_BASE_URL` and `CUSTOMER_AUTH_BASE_URL`
3. Add Firebase values when you are ready to switch OTP mode from demo to real
4. Add Android `google-services.json` and iOS `GoogleService-Info.plist` after Firebase is configured
5. Copy a compatible Flutter SDK into `mobile/../.flutter-sdk` if it is missing

## Notes

- `android/local.properties` points to `/Users/macbook/Documents/projects/ReactJS/speedcash/.flutter-sdk`
- The app currently works with backend-driven demo OTP mode before Firebase keys are supplied
- Real Firebase phone auth becomes active only after valid Firebase keys are added
