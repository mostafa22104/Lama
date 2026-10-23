import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BusinessDto } from '@lamma/shared';
import { Card, Icon, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface BusinessInfoCardProps {
  business: BusinessDto;
  onEdit?: () => void;
}

export function BusinessInfoCard({ business, onEdit }: BusinessInfoCardProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text variant="section" weight={700}>{t('settings:businessInfoTitle')}</Text>
        {onEdit ? (
          <Pressable accessibilityRole="button" onPress={onEdit} style={styles.editBtn}>
            <Icon name="pencil" size={18} color="primary" />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          <Text variant="caption" color="muted">{t('settings:nameLabel')}</Text>
          <Text variant="body" weight={600}>{business.name}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          <Text variant="caption" color="muted">{t('settings:typeLabel')}</Text>
          <Text variant="body" weight={600}>
            {t(`common:businessType.${business.type}`)}
          </Text>
        </View>
      </View>

      {business.phone ? (
        <View style={styles.row}>
          <View style={styles.col}>
            <Text variant="caption" color="muted">{t('settings:phoneLabel')}</Text>
            <Text variant="body" weight={600} style={styles.phoneText}>{business.phone}</Text>
          </View>
        </View>
      ) : null}
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  card: { gap: 4, paddingVertical: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: t.colors.chatBg, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 52, borderBottomWidth: 1, borderBottomColor: t.colors.line },
  col: { flex: 1, gap: 2 },
  phoneText: { writingDirection: 'ltr', textAlign: 'left' },
}));
