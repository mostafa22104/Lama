import type { ContactChannel, SignupDetails } from '@lamma/shared';

export type AuthStackParamList = {
  Signup: { prefill?: { channel: ContactChannel; contact: string; code: string } } | undefined;
  Login: undefined;
  OtpVerify: { channel: ContactChannel; contact: string; signup?: SignupDetails };
};

export type MainTabParamList = {
  Home: undefined;
  Subscriptions: undefined;
  Customers: undefined;
  Confirmations: undefined;
  Reports: undefined;
};


export type MainStackParamList = {
  Tabs: undefined;
  CustomerProfile: { customerId: string };
  Reminders: undefined;
  Settings: undefined;
  AddCustomers: undefined;
  AddManualCustomer: undefined;
  NotebookReview: undefined;
  AddCharge: { returnTo?: 'Subscriptions' | 'ReminderSettings' } | undefined;
  ReminderSettings: undefined;
  Subscriptions: undefined;
  SubscriptionDetail: { chargeId: string };
  ComponentGallery: undefined;
};


