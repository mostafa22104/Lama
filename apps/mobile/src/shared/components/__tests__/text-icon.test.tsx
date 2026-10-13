import React from 'react';
import { screen } from '@testing-library/react-native';
import { lightTheme } from '@lamma/shared';
import { renderWithProviders } from '../../../testing/render';
import { Icon, Text } from '../index';

describe('Text and Icon', () => {
  it('maps variants to the IBM Plex font and theme colors', async () => {
    await renderWithProviders(<Text variant="screenTitle" color="danger">عنوان</Text>);
    const style = Object.assign({}, ...[screen.getByText('عنوان').props.style].flat(3).filter(Boolean));
    expect(style).toMatchObject({ fontFamily: 'IBMPlexSansArabic-Bold', fontSize: 22, color: lightTheme.colors.danger });
  });

  it('forces left-to-right writing for phone numbers', async () => {
    await renderWithProviders(<Text ltr>010 1234 5678</Text>);
    const style = Object.assign({}, ...[screen.getByText('010 1234 5678').props.style].flat(3).filter(Boolean));
    expect(style.writingDirection).toBe('ltr');
  });

  it('renders icons by name', async () => {
    await renderWithProviders(<Icon name="whatsapp" />);
    expect(screen.toJSON()).toBeTruthy();
  });
});
