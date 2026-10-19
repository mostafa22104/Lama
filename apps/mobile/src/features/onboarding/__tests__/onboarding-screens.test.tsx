import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import MockAdapter from 'axios-mock-adapter';
import { NavigationContainer } from '@react-navigation/native';
import { api } from '../../../core/api/instances';
import { renderWithProviders } from '../../../testing/render';
import { AddChargeScreen } from '../screens/AddChargeScreen';
import { AddCustomersScreen } from '../screens/AddCustomersScreen';
import { NotebookReviewScreen } from '../screens/NotebookReviewScreen';
import { ReminderSettingsScreen } from '../screens/ReminderSettingsScreen';

const mockNavigate = jest.fn();
const mockReset = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    reset: mockReset,
    goBack: jest.fn(),
    canGoBack: () => true,
  }),
}));

describe('Onboarding Screens', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
    mockNavigate.mockClear();
    mockReset.mockClear();
  });

  afterEach(() => {
    mock.restore();
  });

  it('renders AddCustomersScreen with all methods and skip option', async () => {
    await renderWithProviders(
      <NavigationContainer>
        <AddCustomersScreen />
      </NavigationContainer>,
    );

    expect(screen.getByText('ضيف عملاءك')).toBeTruthy();
    expect(screen.getByText('صوّر الكشكول')).toBeTruthy();
    expect(screen.getByText('من أسماء الموبايل')).toBeTruthy();
    expect(screen.getByText('ارفع ملف Excel')).toBeTruthy();
    expect(screen.getByText('هضيفهم بعدين')).toBeTruthy();
  });

  it('renders NotebookReviewScreen and allows batch save', async () => {
    mock.onPost('/customers/batch').reply(200, { created: [] });

    await renderWithProviders(
      <NavigationContainer>
        <NotebookReviewScreen />
      </NavigationContainer>,
    );

    expect(screen.getByText('راجع أسماء الكشكول')).toBeTruthy();
    expect(screen.getByText('محمود حسن')).toBeTruthy();

    const saveBtn = screen.getByText(/احفظ وكمّل/);
    fireEvent.press(saveBtn);
  });

  it('renders AddChargeScreen with options and day selector', async () => {
    mock.onGet('/customers').reply(200, []);
    mock.onPost('/charges').reply(200, { id: 'ch-1' });

    await renderWithProviders(
      <NavigationContainer>
        <AddChargeScreen />
      </NavigationContainer>,
    );

    expect(screen.getByText('المبلغ المطلوب')).toBeTruthy();
    expect(screen.getByText('اشتراك شهري')).toBeTruthy();
    expect(screen.getByText('مبلغ مرة واحدة')).toBeTruthy();
  });

  it('renders ReminderSettingsScreen with preview and finish button', async () => {
    mock.onPut('/reminders/rule').reply(200, { beforeDays: 3, onDueDate: true, afterDays: 3 });

    await renderWithProviders(
      <NavigationContainer>
        <ReminderSettingsScreen />
      </NavigationContainer>,
    );

    expect(screen.getByText('التذكيرات')).toBeTruthy();
    expect(screen.getAllByText('قبل الميعاد بـ 3 أيام').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('يوم الميعاد')).toBeTruthy();
    expect(screen.getByText('بعد الميعاد بـ 3 أيام')).toBeTruthy();

    const finishBtn = screen.getByText('خلّصنا! ودّيني للرئيسية');
    fireEvent.press(finishBtn);
  });
});
