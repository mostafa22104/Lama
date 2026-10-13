import React from 'react';
import { act, screen, userEvent } from '@testing-library/react-native';
import MockAdapter from 'axios-mock-adapter';
import { NavigationContainer } from '@react-navigation/native';
import { publicApi } from '../../../core/api/instances';
import { renderWithProviders } from '../../../testing/render';
import { useAuthStore } from '../auth-store';
import { OtpVerifyScreen } from '../screens/OtpVerifyScreen';

const mockNavigate = jest.fn();
let mockParams: object = {};
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn(), canGoBack: () => true }),
  useRoute: () => ({ params: mockParams }),
}));

const CONTACT = '+201012345678';
const authResponse = {
  business: { id: 'b1' },
  tokens: { accessToken: 'a', refreshToken: 'r', accessTokenExpiresIn: 900 },
  isNewBusiness: false,
};
const OTP = 'كود التأكيد';

describe('OtpVerifyScreen', () => {
  let mock: MockAdapter;
  beforeEach(() => {
    mock = new MockAdapter(publicApi);
    mockNavigate.mockClear();
    mockParams = { channel: 'phone', contact: CONTACT };
    useAuthStore.setState({ status: 'signedOut', accessToken: null, business: null });
  });
  afterEach(() => mock.restore());

  it('submits a pasted Arabic code once and signs in', async () => {
    mock.onPost('/auth/otp/verify').reply(200, authResponse);
    await renderWithProviders(<NavigationContainer><OtpVerifyScreen /></NavigationContainer>);
    await userEvent.setup().paste(screen.getByLabelText(OTP), 'الكود ١٢٣٤٥٦');
    await act(async () => {});
    expect(mock.history.post).toHaveLength(1);
    expect(JSON.parse(mock.history.post[0].data)).toEqual({ channel: 'phone', contact: CONTACT, code: '123456' });
    expect(useAuthStore.getState().status).toBe('signedIn');
  });

  it('shows the contact left-to-right inside the sentence', async () => {
    await renderWithProviders(<NavigationContainer><OtpVerifyScreen /></NavigationContainer>);
    expect(screen.getByText(`بعتنالك كود من 6 أرقام على ⁦${CONTACT}⁩`)).toBeTruthy();
  });

  it('shows a translated error for a wrong code, clears it and accepts the same code again', async () => {
    mock.onPost('/auth/otp/verify').reply(400, { code: 'OTP_INVALID', message: '' });
    await renderWithProviders(<NavigationContainer><OtpVerifyScreen /></NavigationContainer>);
    const user = userEvent.setup();
    await user.paste(screen.getByLabelText(OTP), '000000');
    expect(await screen.findByText('الكود مش صح')).toBeTruthy();
    expect(screen.getByLabelText(OTP).props.value).toBe('');
    await user.paste(screen.getByLabelText(OTP), '000000');
    await act(async () => {});
    expect(mock.history.post).toHaveLength(2);
  });

  it('offers sign-up for an unregistered number and carries the code', async () => {
    mock.onPost('/auth/otp/verify').reply(404, { code: 'SIGNUP_REQUIRED', message: '' });
    await renderWithProviders(<NavigationContainer><OtpVerifyScreen /></NavigationContainer>);
    const user = userEvent.setup();
    await user.paste(screen.getByLabelText(OTP), '123456');
    expect(await screen.findByText('الرقم ده مش متسجّل')).toBeTruthy();
    await user.press(screen.getByRole('button', { name: 'اعمل حساب' }));
    expect(mockNavigate).toHaveBeenCalledWith('Signup', { prefill: { channel: 'phone', contact: CONTACT, code: '123456' } });
  });

  it('sends the signup details when coming from sign-up', async () => {
    const signup = { businessName: 'x', businessType: 'academy', instapayAddress: 'y@instapay' };
    mockParams = { channel: 'phone', contact: CONTACT, signup };
    mock.onPost('/auth/otp/verify').reply(200, { ...authResponse, isNewBusiness: true });
    await renderWithProviders(<NavigationContainer><OtpVerifyScreen /></NavigationContainer>);
    await userEvent.setup().paste(screen.getByLabelText(OTP), '123456');
    await act(async () => {});
    expect(JSON.parse(mock.history.post[0].data).signup).toEqual(signup);
  });

  it('hides resend until the countdown ends and restarts it on OTP_COOLDOWN', async () => {
    jest.useFakeTimers();
    try {
      mock.onPost('/auth/otp/request').reply(429, { code: 'OTP_COOLDOWN', message: '' });
      await renderWithProviders(<NavigationContainer><OtpVerifyScreen /></NavigationContainer>);
      expect(screen.queryByRole('button', { name: 'ابعت كود تاني' })).toBeNull();
      await act(async () => jest.advanceTimersByTime(60_000));
      await userEvent.setup({ advanceTimers: jest.advanceTimersByTime }).press(screen.getByRole('button', { name: 'ابعت كود تاني' }));
      await act(async () => {});
      expect(mock.history.post).toHaveLength(1);
      expect(screen.queryByRole('button', { name: 'ابعت كود تاني' })).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });
});
