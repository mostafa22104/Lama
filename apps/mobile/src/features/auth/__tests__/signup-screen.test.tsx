import React from 'react';
import { screen, userEvent, waitFor } from '@testing-library/react-native';
import MockAdapter from 'axios-mock-adapter';
import { NavigationContainer } from '@react-navigation/native';
import { publicApi } from '../../../core/api/instances';
import { renderWithProviders } from '../../../testing/render';
import { useAuthStore } from '../auth-store';
import { SignupScreen } from '../screens/SignupScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn(), canGoBack: () => false }),
  useRoute: () => ({ params: (globalThis as { __route?: object }).__route }),
}));

async function fill() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('رقم الموبايل'), '٠١٠١٢٣٤٥٦٧٨');
  await user.type(screen.getByLabelText('اسم النشاط'), 'أكاديمية النجوم للكرة');
  await user.press(screen.getByRole('radio', { name: 'أكاديمية' }));
  await user.type(screen.getByLabelText('عنوان InstaPay'), 'nogoum.academy@instapay');
  await user.press(screen.getByRole('button', { name: 'كمّل' }));
}

describe('SignupScreen', () => {
  let mock: MockAdapter;
  beforeEach(() => {
    mock = new MockAdapter(publicApi);
    mockNavigate.mockClear();
    (globalThis as { __route?: object }).__route = undefined;
  });
  afterEach(() => mock.restore());

  it('shows the design copy', async () => {
    await renderWithProviders(<NavigationContainer><SignupScreen /></NavigationContainer>);
    expect(screen.getByRole('header', { name: 'حساب جديد' })).toBeTruthy();
    expect(screen.getByText('خطوة 1 من 4')).toBeTruthy();
    expect(screen.getByText('ده العنوان اللي عملاءك هيحوّلوا عليه')).toBeTruthy();
  });

  it('validates before calling the server', async () => {
    await renderWithProviders(<NavigationContainer><SignupScreen /></NavigationContainer>);
    await userEvent.setup().press(screen.getByRole('button', { name: 'كمّل' }));
    expect(await screen.findAllByText('الخانة دي مطلوبة')).not.toHaveLength(0);
    expect(mock.history.post).toHaveLength(0);
  });

  it('requests a code and opens the OTP screen with the signup details', async () => {
    mock.onPost('/auth/otp/request').reply(204);
    await renderWithProviders(<NavigationContainer><SignupScreen /></NavigationContainer>);
    await fill();
    await waitFor(() => expect(mock.history.post).toHaveLength(1));
    expect(JSON.parse(mock.history.post[0].data)).toEqual({ channel: 'phone', contact: '٠١٠١٢٣٤٥٦٧٨' });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
    expect(mockNavigate).toHaveBeenCalledWith('OtpVerify', {
      channel: 'phone',
      contact: '٠١٠١٢٣٤٥٦٧٨',
      signup: { businessName: 'أكاديمية النجوم للكرة', businessType: 'academy', instapayAddress: 'nogoum.academy@instapay' },
    });
  });

  it('finishes sign-up with the carried code when coming from login', async () => {
    (globalThis as { __route?: object }).__route = { prefill: { channel: 'phone', contact: '01012345678', code: '123456' } };
    mock.onPost('/auth/otp/verify').reply(200, {
      business: { id: 'b1' }, tokens: { accessToken: 'a', refreshToken: 'r', accessTokenExpiresIn: 900 }, isNewBusiness: true,
    });
    await renderWithProviders(<NavigationContainer><SignupScreen /></NavigationContainer>);
    expect(screen.getByLabelText('رقم الموبايل').props.value).toBe('01012345678');
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('اسم النشاط'), 'أكاديمية النجوم للكرة');
    await user.type(screen.getByLabelText('عنوان InstaPay'), 'nogoum.academy@instapay');
    await user.press(screen.getByRole('button', { name: 'كمّل' }));
    await waitFor(() => expect(mock.history.post).toHaveLength(1));
    expect(JSON.parse(mock.history.post[0].data)).toMatchObject({ code: '123456', signup: { businessType: 'academy' } });
    expect(mock.history.post.filter((r) => r.url === '/auth/otp/request')).toHaveLength(0);
    await waitFor(() => expect(useAuthStore.getState().status).toBe('signedIn'));
  });
});
