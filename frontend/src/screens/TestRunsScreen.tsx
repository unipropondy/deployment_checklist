import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { testRunService } from '../services/testRunService';
import { StatusBadge } from '../components/StatusBadge';
import { ProgressBar } from '../components/ProgressBar';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Search, Plus, ChevronRight, Calendar, XCircle } from 'lucide-react-native';
import { colors, borderRadius, spacing, shadows } from '../constants/theme';

interface TestRunsScreenProps {
  navigation: any;
  headerSearchQuery?: string;
  onClearHeaderSearch?: () => void;
}

export const TestRunsScreen: React.FC<TestRunsScreenProps> = ({
  navigation,
  headerSearchQuery = '',
  onClearHeaderSearch,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [testRuns, setTestRuns] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState(headerSearchQuery);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [shopFilter, setShopFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const uniqueShops = Array.from(
    new Set(testRuns.map((r) => r.ShopName).filter(Boolean))
  );

  useEffect(() => {
    setSearchQuery(headerSearchQuery);
  }, [headerSearchQuery]);

  const fetchTestRuns = useCallback(async () => {
    try {
      setError('');
      const res: any = await testRunService.getTestRuns();
      if (res && res.success) {
        setTestRuns(res.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load test runs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTestRuns();
  }, [fetchTestRuns]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTestRuns();
  };

  const fromDateRef = React.useRef<any>(null);
  const toDateRef = React.useRef<any>(null);

  const handleFromDateChange = (e: any) => {
    const val = e?.target?.value;
    setFromDate(val || '');
  };

  const handleToDateChange = (e: any) => {
    const val = e?.target?.value;
    setToDate(val || '');
  };

  const openFromDatePicker = () => {
    if (fromDateRef.current) {
      if (typeof fromDateRef.current.showPicker === 'function') {
        fromDateRef.current.showPicker();
      } else {
        fromDateRef.current.click();
      }
    }
  };

  const openToDatePicker = () => {
    if (toDateRef.current) {
      if (typeof toDateRef.current.showPicker === 'function') {
        toDateRef.current.showPicker();
      } else {
        toDateRef.current.click();
      }
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    onClearHeaderSearch?.();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    onClearHeaderSearch?.();
    setStatusFilter('ALL');
    setShopFilter('ALL');
    setFromDate('');
    setToDate('');
  };

  const filteredRuns = testRuns.filter((run) => {
    const matchesSearch =
      !searchQuery.trim() ||
      String(run.CheckId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(run.ShopName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(run.BuildVersion || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(run.CheckedBy || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'COMPLETED' && run.Status === 'Completed') ||
      (statusFilter === 'IN_PROGRESS' && run.Status === 'In Progress');

    const matchesShop =
      shopFilter === 'ALL' || run.ShopName === shopFilter;

    let matchesDate = true;
    if (run.CheckDate) {
      const runDate = new Date(run.CheckDate);

      if (fromDate.trim()) {
        const fDate = new Date(fromDate);
        if (!isNaN(fDate.getTime())) {
          fDate.setHours(0, 0, 0, 0);
          const rStart = new Date(run.CheckDate);
          rStart.setHours(0, 0, 0, 0);
          if (rStart < fDate) matchesDate = false;
        }
      }

      if (toDate.trim()) {
        const tDate = new Date(toDate);
        if (!isNaN(tDate.getTime())) {
          tDate.setHours(23, 59, 59, 999);
          const rFull = new Date(run.CheckDate);
          if (rFull > tDate) matchesDate = false;
        }
      }
    }

    return matchesSearch && matchesStatus && matchesShop && matchesDate;
  });

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'ALL' || shopFilter !== 'ALL' || fromDate.trim() !== '' || toDate.trim() !== '';

  if (loading && !refreshing) {
    return <LoadingState message="Fetching deployment test runs..." />;
  }

  if (error && !refreshing) {
    return <ErrorState message={error} onRetry={fetchTestRuns} />;
  }

  const renderItem = ({ item }: { item: any }) => {
    const formattedDate = item.CheckDate
      ? new Date(item.CheckDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
      : 'N/A';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('TestDetail', { id: item.TestRunId })}
        activeOpacity={0.7}
      >
        <View style={styles.cardMain}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.idGroup}>
              <Text style={styles.checkId}>{item.CheckId}</Text>
              <Text style={styles.shopName}>{item.ShopName || 'Unknown Shop'}</Text>
            </View>
            <StatusBadge status={item.Status} />
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>Build</Text>
              <Text style={styles.detailValue}>{item.BuildVersion || 'N/A'}</Text>
            </View>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>Check Date</Text>
              <Text style={styles.detailValue}>{formattedDate}</Text>
            </View>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>Checked By</Text>
              <Text style={styles.detailValue}>
                {(item.CheckedBy === '1' || item.CheckedBy === 1) ? (user?.Name || 'Admin User') : (item.CheckedBy || 'N/A')}
              </Text>
            </View>
          </View>

          <View style={styles.progressRow}>
            <View style={{ flex: 1 }}>
              <ProgressBar progress={item.Progress} height={8} />
            </View>
            <ChevronRight size={16} color={colors.textMuted} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Filter Bar */}
      <View style={styles.toolbar}>
        {/* Search Box */}
        <View style={styles.searchBox}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Check ID, Shop, Build, Checked By..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={handleClearSearch}>
              <XCircle size={14} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Interactive Date Pickers */}
        <View style={styles.dateFilterGroup}>
          <Calendar size={14} color={colors.textMuted} />

          <TouchableOpacity style={styles.datePickerBtn} onPress={openFromDatePicker} activeOpacity={0.8}>
            <Text style={[styles.dateInputText, !fromDate && styles.placeholderText]}>
              {fromDate ? fromDate : 'From Date'}
            </Text>
            {React.createElement('input', {
              ref: fromDateRef,
              type: 'date',
              max: new Date().toISOString().split('T')[0],
              onChange: handleFromDateChange,
              value: fromDate,
              style: {
                position: 'absolute',
                opacity: 0,
                width: 0,
                height: 0,
                pointerEvents: 'none',
              },
            })}
          </TouchableOpacity>

          <Text style={styles.dateSep}>to</Text>

          <TouchableOpacity style={styles.datePickerBtn} onPress={openToDatePicker} activeOpacity={0.8}>
            <Text style={[styles.dateInputText, !toDate && styles.placeholderText]}>
              {toDate ? toDate : 'To Date'}
            </Text>
            {React.createElement('input', {
              ref: toDateRef,
              type: 'date',
              max: new Date().toISOString().split('T')[0],
              onChange: handleToDateChange,
              value: toDate,
              style: {
                position: 'absolute',
                opacity: 0,
                width: 0,
                height: 0,
                pointerEvents: 'none',
              },
            })}
          </TouchableOpacity>

          {(fromDate || toDate) ? (
            <TouchableOpacity onPress={() => { setFromDate(''); setToDate(''); }} style={{ padding: 2 }}>
              <XCircle size={14} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Status Filter Pills */}
        <View style={styles.filterPills}>
          {['ALL', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.pill, statusFilter === st && styles.activePill]}
              onPress={() => setStatusFilter(st)}
            >
              <Text style={[styles.pillText, statusFilter === st && styles.activePillText]}>
                {st.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>



        {hasActiveFilters ? (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearFilters}>
            <Text style={styles.clearBtnText}>Clear Filters</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => navigation.navigate('NewTestRun')}
        >
          <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.newBtnText}>New Test</Text>
        </TouchableOpacity>
      </View>

      {/* FlatList of Test Runs */}
      {filteredRuns.length === 0 ? (
        <EmptyState
          title="No Test Runs Found"
          message="No deployment test sessions match your current search, status, or date range filters."
        />
      ) : (
        <FlatList
          data={filteredRuns}
          keyExtractor={(item) => item.TestRunId.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  toolbar: {
    padding: spacing.md,
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    minWidth: 200,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    height: 38,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textMain,
    // @ts-ignore
    outlineStyle: 'none',
  },
  dateFilterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: 10,
    height: 38,
  },
  datePickerBtn: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  dateInputText: {
    fontSize: 12,
    color: colors.textMain,
    fontWeight: '600',
  },
  placeholderText: {
    color: colors.textLight,
    fontWeight: '400',
  },
  dateSep: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  filterPills: {
    flexDirection: 'row',
    gap: 6,
  },
  shopFilterRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  shopPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeShopPill: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  shopPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  activeShopPillText: {
    color: '#FFFFFF',
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activePill: {
    backgroundColor: colors.sidebarBg,
    borderColor: colors.sidebarBg,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  activePillText: {
    color: '#FFFFFF',
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.error,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  newBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardMain: {
    gap: spacing.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  idGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkId: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textMain,
  },
  shopName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    backgroundColor: colors.bg,
    padding: 10,
    borderRadius: borderRadius.sm,
  },
  detailCol: {
    gap: 2,
    minWidth: 80,
  },
  detailLabel: {
    fontSize: 11,
    color: colors.textLight,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMain,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
  },
});


