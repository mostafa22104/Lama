import React from 'react';
import { screen, userEvent } from '@testing-library/react-native';
import MockAdapter from 'axios-mock-adapter';
import { NavigationContainer } from '@react-navigation/native';
import { publicApi } from '../../../core/api/instances';
import { renderWithProviders } from '../../../testing/render';
import { LoginScreen } from '../screens/LoginScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn(), canGoBack: () => true }),
}));

describe('LoginScreen', () => {
  let mock: MockAdapter;
  beforeEach(() => {
    mock = new MockAdapter(publicApi);
    mockNavigate.mockClear();
  });
  afterEach(() => mock.restore());

  it('requests a code for a valid number and opens the OTP screen with the normalized contact', async () => {
    mock.onPost('/auth/otp/request').reply(204);
    await renderWithProviders(<NavigationContainer><LoginScreen /></NavigationContainer>);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('رقم الموبايل'), '+20 10 1234 5678');
    await user.press(screen.getByRole('button', { name: 'ابعت الكود' }));
    expect(await screen.findByTestId('login-screen')).toBeTruthy();
    expect(JSON.parse(mock.history.post[0].data)).toEqual({ channel: 'phone', contact: '+201012345678' });
    expect(mockNavigate).toHaveBeenCalledWith('OtpVerify', { channel: 'phone', contact: '+201012345678' });
  });

  it('rejects an invalid number locally', async () => {
    await renderWithProviders(<NavigationContainer><LoginScreen /></NavigationContainer>);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('رقم الموبايل'), '0123');
    await user.press(screen.getByRole('button', { name: 'ابعت الكود' }));
    expect(await screen.findByText('اكتب رقم موبايل مصري صحيح')).toBeTruthy();
    expect(mock.history.post).toHaveLength(0);
  });
});
