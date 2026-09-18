import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { shopService } from '../services/shopService';
import { buildService } from '../services/buildService';
import { testRunService } from '../services/testRunService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingState } from '../components/LoadingState';
import { Store, Package, Calendar, User, ShieldCheck } from 'lucide-react-native';
import { colors, borderRadius, spacing, shadows } from '../constants/theme';

interface NewTestRunScreenProps {
  navigation: any;
}

export const NewTestRunScreen: React.FC<NewTestRunScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [shops, setShops] = useState<any[]>([]);
  const [builds, setBuilds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [selectedBuildId, setSelectedBuildId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shopsRes, buildsRes]: [any, any] = await Promise.all([
          shopService.getShops(),
          buildService.getBuilds(),
        ]);

        if (shopsRes && shopsRes.success) {
          const activeShops = (shopsRes.data || []).filter((s: any) => s.IsActive !== false);
          setShops(activeShops);
          if (activeShops.length > 0) setSelectedShopId(activeShops[0].ShopId);
        }

        if (buildsRes && buildsRes.success) {
          setBuilds(buildsRes.data || []);
          if ((buildsRes.data || []).length > 0) setSelectedBuildId(buildsRes[0].BuildId);
        }
      } catch (err: any) {
        showToast('Failed to load shops and builds', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showToast]);

  const handleSubmit = async () => {
    if (!selectedShopId || !selectedBuildId) {
      showToast('Please select both a Shop and a Build version', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res: any = await testRunService.createTestRun({
        ShopId: selectedShopId,
        BuildId: selectedBuildId,
      });

      if (res && res.success && res.data) {
        showToast(`Test Session ${res.data.CheckId} created successfully!`, 'success');
        navigation.navigate('TestDetail', { id: res.data.TestRunId });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create test run', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Preparing new deployment test run..." />;
  }

  const currentDateStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <ShieldCheck size={24} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.title}>New Test Session</Text>
            <Text style={styles.subtitle}>Initialize a deployment checklist test run.</Text>
          </View>
        </View>

        <View style={styles.form}>
          {/* Select Shop */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Select Target Shop *</Text>
            <View style={styles.optionsGrid}>
              {shops.map((shop) => {
                const isSelected = selectedShopId === shop.ShopId;
                return (
                  <TouchableOpacity
                    key={shop.ShopId}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    onPress={() => setSelectedShopId(shop.ShopId)}
                  >
                    <Store size={16} color={isSelected ? colors.primary : colors.textMuted} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                        {shop.ShopName}
                      </Text>
                      <Text style={styles.optionSubtitle}>{shop.ShopCode}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Select Build */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Select Build Version *</Text>
            <View style={styles.optionsGrid}>
              {builds.map((build) => {
                const isSelected = selectedBuildId === build.BuildId;
                return (
                  <TouchableOpacity
                    key={build.BuildId}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    onPress={() => setSelectedBuildId(build.BuildId)}
                  >
                    <Package size={16} color={isSelected ? colors.primary : colors.textMuted} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                        {build.Version}
                      </Text>
                      <Text style={styles.optionSubtitle}>{build.Environment}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Readonly Date & User Info */}
          <View style={styles.metaBox}>
            <View style={styles.metaItem}>
              <Calendar size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>Check Date: {currentDateStr}</Text>
            </View>
            <View style={styles.metaItem}>
              <User size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>Checked By: {user?.Name || 'Authenticated User'}</Text>
            </View>
          </View>

          {/* Create Button */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Create Test Run</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  contentContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    maxWidth: 560,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textMain,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  form: {
    gap: spacing.md,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMain,
  },
  optionsGrid: {
    gap: 8,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optionCardSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMain,
  },
  optionTitleSelected: {
    color: colors.primaryHover,
  },
  optionSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
  },
  metaBox: {
    backgroundColor: colors.bg,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

