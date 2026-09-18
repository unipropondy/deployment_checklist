import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { testRunService } from '../services/testRunService';
import { buildService } from '../services/buildService';
import { StatusBadge } from '../components/StatusBadge';
import { ProgressBar } from '../components/ProgressBar';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import {
  Plus,
  CheckCircle2,
  XCircle,
  Package,
  Layers,
  Store,
  FileSpreadsheet,
  ArrowRight,
  MoreVertical,
  Calendar,
  Search,
  XCircle as XIcon,
} from 'lucide-react-native';
import { colors, borderRadius, spacing, shadows } from '../constants/theme';

interface DashboardProps {
  navigation: any;
  headerSearchQuery?: string;
  onClearHeaderSearch?: () => void;
  headerSelectedDate?: Date;
}

export const DashboardScreen: React.FC<DashboardProps> = ({
  navigation,
  headerSearchQuery = '',
  onClearHeaderSearch,
  headerSelectedDate,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [testRuns, setTestRuns] = useState<any[]>([]);
  const [activeBuildsCount, setActiveBuildsCount] = useState(0);
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM_DATE'>('ALL');
  const [searchQuery, setSearchQuery] = useState(headerSearchQuery);
  const [customDate, setCustomDate] = useState<Date | null>(null);
  const customDateRef = React.useRef<any>(null);

  useEffect(() => {
    setSearchQuery(headerSearchQuery);
  }, [headerSearchQuery]);

  const handleCustomDateChange = (e: any) => {
    const val = e?.target?.value;
    if (val) {
      const parsed = new Date(val);
      if (!isNaN(parsed.getTime())) {
        setCustomDate(parsed);
        setPeriodFilter('CUSTOM_DATE');
      }
    }
  };

  const openCustomDatePicker = () => {
    if (customDateRef.current) {
      if (typeof customDateRef.current.showPicker === 'function') {
        customDateRef.current.showPicker();
      } else {
        customDateRef.current.click();
      }
    }
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setError('');
      const [runsRes, buildsRes]: [any, any] = await Promise.all([
        testRunService.getTestRuns(),
        buildService.getBuilds(),
      ]);

      if (runsRes && runsRes.success) {
        setTestRuns(runsRes.data || []);
      }

      if (buildsRes && buildsRes.success) {
        setActiveBuildsCount((buildsRes.data || []).length);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Filter test runs by selected clicked date & period & search query
  const filteredTestRuns = testRuns.filter((run) => {
    // 1. Search query filter
    const matchesSearch =
      !searchQuery.trim() ||
      String(run.CheckId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(run.ShopName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(run.BuildVersion || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (run.CheckDate) {
      const rDate = new Date(run.CheckDate);
      if (!isNaN(rDate.getTime())) {
        // 2. Exact Selected Date Filter (from custom date picker)
        if (periodFilter === 'CUSTOM_DATE' && customDate) {
          const isSameDate =
            rDate.getDate() === customDate.getDate() &&
            rDate.getMonth() === customDate.getMonth() &&
            rDate.getFullYear() === customDate.getFullYear();

          if (!isSameDate) return false;
        }

        // 3. Period filter
        if (periodFilter === 'TODAY') {
          const now = new Date();
          return (
            rDate.getDate() === now.getDate() &&
            rDate.getMonth() === now.getMonth() &&
            rDate.getFullYear() === now.getFullYear()
          );
        }

        if (periodFilter === 'THIS_WEEK') {
          const now = new Date();
          const startOfWeek = new Date(now);
          const day = now.getDay() || 7;
          startOfWeek.setDate(now.getDate() - (day - 1));
          startOfWeek.setHours(0, 0, 0, 0);

          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);

          return rDate >= startOfWeek && rDate <= endOfWeek;
        }

        if (periodFilter === 'THIS_MONTH') {
          const now = new Date();
          return rDate.getMonth() === now.getMonth() && rDate.getFullYear() === now.getFullYear();
        }
      }
    }

    return true;
  });

  // Metrics dynamic calculation based on filtered data
  const totalTests = filteredTestRuns.length;
  const passedTests = filteredTestRuns.filter((r) => r.Status === 'Completed' && (r.FailedItems || 0) === 0).length;
  const failedTests = filteredTestRuns.filter((r) => r.FailedItems > 0).length;

  const totalItemsCount = filteredTestRuns.reduce((acc, r) => acc + (r.TotalItems || 0), 0);
  const passedItemsCount = filteredTestRuns.reduce((acc, r) => acc + (r.PassedItems || 0), 0);
  const failedItemsCount = filteredTestRuns.reduce((acc, r) => acc + (r.FailedItems || 0), 0);
  const pendingItemsCount = filteredTestRuns.reduce((acc, r) => acc + (r.PendingItems || 0), 0);

  const passRate = totalItemsCount > 0 ? Math.round((passedItemsCount / totalItemsCount) * 100) : 0;

  const navigateToTab = (tabName: string) => {
    if (typeof navigation.jumpTo === 'function') {
      navigation.jumpTo(tabName);
    } else {
      navigation.navigate('MainTabs', { screen: tabName });
    }
  };

  if (loading && !refreshing) {
    return <LoadingState message="Loading dashboard metrics..." />;
  }

  if (error && !refreshing) {
    return <ErrorState message={error} onRetry={fetchDashboardData} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header Banner */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greetingText}>Dashboard</Text>
          <Text style={styles.subText}>Here is your deployment testing overview for today.</Text>
        </View>

        <TouchableOpacity
          style={styles.newTestBtn}
          onPress={() => navigation.navigate('NewTestRun')}
          activeOpacity={0.85}
        >
          <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.newTestBtnText}>New Test</Text>
        </TouchableOpacity>
      </View>

      {/* Period Filter & Search Bar */}
      <View style={styles.filterToolbar}>
        <View style={styles.searchBox}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Quick search recent tests..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <XIcon size={14} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodPills}
          style={{ maxWidth: '100%' }}
        >
          {/* Interactive Date Picker Icon Button */}
          <TouchableOpacity
            style={[styles.datePickerIconBtn, (customDate || periodFilter === 'CUSTOM_DATE') && styles.activePeriodPill]}
            onPress={openCustomDatePicker}
            activeOpacity={0.75}
          >
            <Calendar size={14} color={customDate || periodFilter === 'CUSTOM_DATE' ? '#FFFFFF' : colors.textMuted} />
            {React.createElement('input', {
              ref: customDateRef,
              type: 'date',
              max: new Date().toISOString().split('T')[0],
              onChange: handleCustomDateChange,
              value: customDate ? customDate.toISOString().split('T')[0] : '',
              style: {
                position: 'absolute',
                opacity: 0,
                width: 0,
                height: 0,
                pointerEvents: 'none',
              },
            })}
          </TouchableOpacity>

          {[
            { id: 'ALL', label: 'All Time' },
            { id: 'TODAY', label: 'Today' },
            { id: 'THIS_WEEK', label: 'This Week' },
            { id: 'THIS_MONTH', label: 'This Month' },
          ].map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.periodPill, periodFilter === p.id && !customDate && styles.activePeriodPill]}
              onPress={() => {
                setPeriodFilter(p.id as any);
                setCustomDate(null);
              }}
            >
              <Text
                style={[
                  styles.periodPillText,
                  periodFilter === p.id && !customDate && styles.activePeriodPillText,
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* KPI Cards Grid */}
      <View style={styles.kpiGrid}>
        {/* Total Tests */}
        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconWrapper, { backgroundColor: colors.primaryLight }]}>
            <Layers size={18} color={colors.primary} />
          </View>
          <View style={styles.kpiTextWrapper}>
            <Text style={styles.kpiValue}>{totalTests}</Text>
            <Text style={styles.kpiLabel} numberOfLines={1}>Tests</Text>
          </View>
        </View>

        {/* Passed */}
        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconWrapper, { backgroundColor: colors.successBg }]}>
            <CheckCircle2 size={18} color={colors.success} />
          </View>
          <View style={styles.kpiTextWrapper}>
            <Text style={styles.kpiValue}>{passedTests}</Text>
            <Text style={styles.kpiLabel} numberOfLines={1}>Passed</Text>
          </View>
        </View>

        {/* Failed */}
        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconWrapper, { backgroundColor: colors.errorBg }]}>
            <XCircle size={18} color={colors.error} />
          </View>
          <View style={styles.kpiTextWrapper}>
            <Text style={styles.kpiValue}>{failedTests}</Text>
            <Text style={styles.kpiLabel} numberOfLines={1}>Failed</Text>
          </View>
        </View>

        {/* Active Builds */}
        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconWrapper, { backgroundColor: colors.infoBg }]}>
            <Package size={18} color={colors.info} />
          </View>
          <View style={styles.kpiTextWrapper}>
            <Text style={styles.kpiValue}>{activeBuildsCount}</Text>
            <Text style={styles.kpiLabel} numberOfLines={1}>Active Builds</Text>
          </View>
        </View>
      </View>

      {/* Main Section Grid (Recent Tests + Test Status) */}
      <View style={styles.mainGrid}>
        {/* Recent Tests Table Container */}
        <View style={styles.recentTestsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Tests</Text>
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => navigateToTab('TestsTab')}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <ArrowRight size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Table Header & Rows wrapped in Horizontal Scroll for Mobile Alignment */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'column', minWidth: 540 }}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 1.2, minWidth: 60 }]}>ID</Text>
              <Text style={[styles.th, { flex: 1.5, minWidth: 100 }]}>SHOP</Text>
              <Text style={[styles.th, { flex: 1.2, minWidth: 80 }]}>BUILD</Text>
              <Text style={[styles.th, { flex: 1.5, minWidth: 100 }]}>PROGRESS</Text>
              <Text style={[styles.th, { flex: 1.2, minWidth: 90 }]}>STATUS</Text>
              <Text style={[styles.th, { width: 56, textAlign: 'center' }]} numberOfLines={1}>ACTION</Text>
            </View>

            {filteredTestRuns.length === 0 ? (
              <View style={styles.emptyTable}>
                <Text style={styles.emptyText}>No recent test runs match the selected period or query.</Text>
              </View>
            ) : (
              filteredTestRuns.slice(0, 5).map((item) => (
                <TouchableOpacity
                  key={item.TestRunId}
                  style={styles.tableRow}
                  onPress={() => navigation.navigate('TestDetail', { id: item.TestRunId })}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tdBold, { flex: 1.2, minWidth: 60 }]}>{item.CheckId}</Text>
                  <Text style={[styles.td, { flex: 1.5, minWidth: 100 }]} numberOfLines={1}>
                    {item.ShopName || 'N/A'}
                  </Text>
                  <Text style={[styles.td, { flex: 1.2, minWidth: 80 }]}>{item.BuildVersion || 'N/A'}</Text>
                  <View style={{ flex: 1.5, minWidth: 100 }}>
                    <ProgressBar progress={item.Progress} height={6} />
                  </View>
                  <View style={{ flex: 1.2, minWidth: 90 }}>
                    <StatusBadge status={item.Status} />
                  </View>
                  <TouchableOpacity
                    style={{ width: 56, alignItems: 'center' }}
                    onPress={() => navigation.navigate('TestDetail', { id: item.TestRunId })}
                  >
                    <MoreVertical size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        {/* Test Status Donut / Chart Summary */}
        <View style={styles.statusChartCard}>
          <Text style={styles.cardTitle}>Test Status</Text>

          {/* Dynamic Multi-Color Donut Circle Metric */}
          <View style={styles.donutContainer}>
            <View
              style={[
                styles.donutOuter,
                {
                  // @ts-ignore - web conic gradient for multi-color donut chart
                  backgroundImage: totalItemsCount > 0
                    ? `conic-gradient(${colors.success} 0% ${totalItemsCount > 0 ? (passedItemsCount / totalItemsCount) * 100 : 0}%, ${colors.error} ${totalItemsCount > 0 ? (passedItemsCount / totalItemsCount) * 100 : 0}% ${totalItemsCount > 0 ? ((passedItemsCount + failedItemsCount) / totalItemsCount) * 100 : 0}%, ${colors.warning} ${totalItemsCount > 0 ? ((passedItemsCount + failedItemsCount) / totalItemsCount) * 100 : 0}% 100%)`
                    : colors.borderLight,
                  // @ts-ignore
                  background: totalItemsCount > 0
                    ? `conic-gradient(${colors.success} 0% ${totalItemsCount > 0 ? (passedItemsCount / totalItemsCount) * 100 : 0}%, ${colors.error} ${totalItemsCount > 0 ? (passedItemsCount / totalItemsCount) * 100 : 0}% ${totalItemsCount > 0 ? ((passedItemsCount + failedItemsCount) / totalItemsCount) * 100 : 0}%, ${colors.warning} ${totalItemsCount > 0 ? ((passedItemsCount + failedItemsCount) / totalItemsCount) * 100 : 0}% 100%)`
                    : colors.borderLight,
                },
              ]}
            >
              <View style={styles.donutInner}>
                <Text style={styles.donutPercent}>{passRate}%</Text>
                <Text style={styles.donutLabel}>Pass Rate</Text>
              </View>
            </View>
          </View>

          {/* Status Breakdown Legend */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: colors.success }]} />
              <Text style={styles.legendLabel}>Passed Items</Text>
              <Text style={styles.legendValue}>{passedItemsCount}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: colors.error }]} />
              <Text style={styles.legendLabel}>Failed Items</Text>
              <Text style={styles.legendValue}>{failedItemsCount}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: colors.warning }]} />
              <Text style={styles.legendLabel}>Pending Items</Text>
              <Text style={styles.legendValue}>{pendingItemsCount}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Actions Footer */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('NewTestRun')}
          >
            <Plus size={18} color={colors.primary} />
            <Text style={styles.actionBtnText}>New Test</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigateToTab('ShopsTab')}
          >
            <Store size={18} color={colors.primary} />
            <Text style={styles.actionBtnText}>New Shop</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigateToTab('BuildsTab')}
          >
            <Package size={18} color={colors.primary} />
            <Text style={styles.actionBtnText}>New Build</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigateToTab('TestsTab')}
          >
            <FileSpreadsheet size={18} color={colors.primary} />
            <Text style={styles.actionBtnText}>View Reports</Text>
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
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textMain,
  },
  userNameText: {
    color: colors.primary,
  },
  subText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  newTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
  },
  newTestBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  filterToolbar: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: spacing.sm,
    backgroundColor: colors.cardBg,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: 10,
    height: 36,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: colors.textMain,
    // @ts-ignore
    outlineStyle: 'none',
  },
  periodPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  datePickerIconBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  periodPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activePeriodPill: {
    backgroundColor: colors.sidebarBg,
    borderColor: colors.sidebarBg,
  },
  periodPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  activePeriodPillText: {
    color: '#FFFFFF',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  kpiIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiTextWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textMain,
  },
  kpiLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  mainGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  recentTestsCard: {
    flex: 2,
    minWidth: 320,
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textMain,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
    borderRadius: borderRadius.sm,
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tdBold: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMain,
  },
  td: {
    fontSize: 13,
    color: colors.textMain,
    fontWeight: '500',
  },
  emptyTable: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textLight,
    fontSize: 12,
  },
  statusChartCard: {
    flex: 1,
    minWidth: 240,
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  donutOuter: {
    width: 124,
    height: 124,
    borderRadius: 62,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  donutInner: {
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: colors.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutPercent: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textMain,
  },
  donutLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  legendContainer: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMain,
  },
  quickActionsContainer: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textMain,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    minWidth: 130,
    backgroundColor: colors.cardBg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMain,
  },
});


