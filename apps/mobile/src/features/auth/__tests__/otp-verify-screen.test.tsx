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

const mockRestart = jest.fn();
let mockRemaining = 0;
jest.mock('../../../shared/hooks/use-countdown', () => ({
  useCountdown: () => ({ remaining: mockRemaining, restart: mockRestart }),
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
    mockRestart.mockClear();
    mockRemaining = 0;
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

  it('ignores a new code while a verify is still pending', async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    mock.onPost('/auth/otp/verify').reply(async () => { await gate; return [200, authResponse]; });
    await renderWithProviders(<NavigationContainer><OtpVerifyScreen /></NavigationContainer>);
    const user = userEvent.setup();
    await user.paste(screen.getByLabelText(OTP), '111111');
    await user.paste(screen.getByLabelText(OTP), '222222');
    expect(mock.history.post).toHaveLength(1);
    await act(async () => { release(); });
  });

  it('clears the error as soon as the user edits the code', async () => {
    mock.onPost('/auth/otp/verify').reply(400, { code: 'OTP_INVALID', message: '' });
    await renderWithProviders(<NavigationContainer><OtpVerifyScreen /></NavigationContainer>);
    const user = userEvent.setup();
    await user.paste(screen.getByLabelText(OTP), '000000');
    expect(await screen.findByText('الكود مش صح')).toBeTruthy();
    await user.type(screen.getByLabelText(OTP), '1');
    expect(screen.queryByText('الكود مش صح')).toBeNull();
  });

  it('hides resend until the countdown ends', async () => {
    mockRemaining = 60;
    await renderWithProviders(<NavigationContainer><OtpVerifyScreen /></NavigationContainer>);
    expect(screen.queryByRole('button', { name: 'ابعت كود تاني' })).toBeNull();
    expect(screen.getByText('تقدر تطلب كود تاني بعد 60 ثانية')).toBeTruthy();
  });

  it('restarts the countdown on OTP_COOLDOWN', async () => {
    mockRemaining = 0;
    mock.onPost('/auth/otp/request').reply(429, { code: 'OTP_COOLDOWN', message: '' });
    await renderWithProviders(<NavigationContainer><OtpVerifyScreen /></NavigationContainer>);
    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'ابعت كود تاني' }));
    await act(async () => {});
    expect(mockRestart).toHaveBeenCalledTimes(1);
    expect(mock.history.post).toHaveLength(1);
  });

  it('shows a resend failure and keeps the resend link without restarting the countdown', async () => {
    mockRemaining = 0;
    mock.onPost('/auth/otp/request').reply(429, { code: 'RATE_LIMITED', message: '' });
    await renderWithProviders(<NavigationContainer><OtpVerifyScreen /></NavigationContainer>);
    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'ابعت كود تاني' }));
    expect(await screen.findByText('طلبات كتير، استنى شوية وجرّب تاني')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'ابعت كود تاني' })).toBeTruthy();
    expect(mockRestart).not.toHaveBeenCalled();
    expect(mock.history.post).toHaveLength(1);
  });
});
