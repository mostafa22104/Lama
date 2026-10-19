import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { CustomerListItemDto } from '@lamma/shared';
import { AmountText, Avatar, Button, Card, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface ReportOverdueListProps {
  customers: CustomerListItemDto[];
  onRemindPress: () => void;
  onDownloadExcel: () => void;
  onSelectCustomer: (id: string) => void;
}

export function ReportOverdueList({ customers, onRemindPress, onDownloadExcel, onSelectCustomer }: ReportOverdueListProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <Card style={styles.card}>
        <Text variant="section" weight={700}>{t('reports:stillLateTitle')}</Text>

        <View style={styles.list}>
          {customers.map((c) => (
            <Pressable key={c.id} onPress={() => onSelectCustomer(c.id)} style={styles.row}>
              <Avatar name={c.name} size={34} />
              <View style={styles.nameWrap}>
                <Text variant="body" weight={600} numberOfLines={1}>{c.name}</Text>
                <Text variant="caption" color="danger" numberOfLines={1}>{c.note ?? ''}</Text>
              </View>
              <AmountText amount={c.balance} size="row" />
            </Pressable>
          ))}
        </View>

        {customers.length > 0 ? (
          <Button label={t('reports:remindThemWhatsApp')} variant="whatsapp" icon="whatsapp" onPress={onRemindPress} />
        ) : null}
      </Card>

      <Button label={t('reports:downloadExcel')} variant="outline" icon="download" onPress={onDownloadExcel} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { gap: 12 },
  card: { gap: 12, padding: 16 },
  list: { gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, borderBottomWidth: 1, borderBottomColor: t.colors.line },
  nameWrap: { flex: 1, gap: 2 },
}));
