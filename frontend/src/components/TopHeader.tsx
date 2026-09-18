import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, Bell, Calendar, X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationPopover } from './NotificationPopover';
import { testRunService } from '../services/testRunService';
import { colors, borderRadius, spacing } from '../constants/theme';

const STORAGE_READ_IDS_KEY = '@deploycheck_read_notif_ids';
const STORAGE_CLEARED_IDS_KEY = '@deploycheck_cleared_notif_ids';

interface TopHeaderProps {
  onSearchChange?: (text: string) => void;
  searchValue?: string;
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
  onSelectTestRun?: (id: number) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onSearchChange,
  searchValue = '',
  selectedDate = new Date(),
  onDateChange,
  onSelectTestRun,
}) => {
  const [notifVisible, setNotifVisible] = useState(false);
  const [testRuns, setTestRuns] = useState<any[]>([]);
  const [readIds, setReadIds] = useState<number[]>([]);
  const [clearedIds, setClearedIds] = useState<number[]>([]);
  const dateInputRef = React.useRef<any>(null);

  const fetchNotifications = async () => {
    try {
      const res: any = await testRunService.getTestRuns();
      if (res && res.success) {
        setTestRuns(res.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  };

  React.useEffect(() => {
    const loadStoredNotificationState = async () => {
      try {
        const storedRead = await AsyncStorage.getItem(STORAGE_READ_IDS_KEY);
        const storedCleared = await AsyncStorage.getItem(STORAGE_CLEARED_IDS_KEY);
        if (storedRead) {
          setReadIds(JSON.parse(storedRead));
        }
        if (storedCleared) {
          setClearedIds(JSON.parse(storedCleared));
        }
      } catch (err) {
        console.error('Failed to load notification state:', err);
      }
    };
    loadStoredNotificationState();
    fetchNotifications();
  }, []);

  const handleToggleNotifications = () => {
    setNotifVisible(prev => !prev);
    fetchNotifications();
  };

  const handleMarkAllAsRead = async () => {
    const allIds = testRuns.map((r: any) => Number(r.TestRunId));
    const merged = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(merged);
    try {
      await AsyncStorage.setItem(STORAGE_READ_IDS_KEY, JSON.stringify(merged));
    } catch (err) {
      console.error('Failed to save read notifications:', err);
    }
  };

  const handleClearAll = async () => {
    const allIds = testRuns.map((r: any) => Number(r.TestRunId));
    const merged = Array.from(new Set([...clearedIds, ...allIds]));
    setClearedIds(merged);
    try {
      await AsyncStorage.setItem(STORAGE_CLEARED_IDS_KEY, JSON.stringify(merged));
    } catch (err) {
      console.error('Failed to save cleared notifications:', err);
    }
  };

  const handleSelectRunItem = (testRunId: number) => {
    setNotifVisible(false);
    if (!readIds.includes(testRunId)) {
      const nextRead = [...readIds, testRunId];
      setReadIds(nextRead);
      AsyncStorage.setItem(STORAGE_READ_IDS_KEY, JSON.stringify(nextRead)).catch(() => {});
    }
    if (onSelectTestRun) {
      onSelectTestRun(testRunId);
    }
  };

  const visibleRuns = testRuns.filter((r: any) => !clearedIds.includes(Number(r.TestRunId)));
  const unreadCount = visibleRuns.filter((r: any) => !readIds.includes(Number(r.TestRunId))).length;

  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleDateChange = (event: any) => {
    const dateVal = event?.target?.value;
    if (dateVal && onDateChange) {
      const parts = dateVal.split('-');
      if (parts.length === 3) {
        const parsed = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        onDateChange(parsed);
      }
    }
  };

  const openDatePicker = () => {
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        dateInputRef.current.showPicker();
      } else {
        dateInputRef.current.click();
      }
    }
  };

  return (
    <View style={styles.header}>
      {/* Search Input */}
      <View style={styles.searchBar}>
        <Search size={16} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tests, shops, builds..."
          placeholderTextColor={colors.textLight}
          value={searchValue}
          onChangeText={onSearchChange}
        />
        {searchValue ? (
          <TouchableOpacity onPress={() => onSearchChange?.('')} activeOpacity={0.7} style={styles.clearBtn}>
            <X size={14} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Right Header Actions */}
      <View style={styles.rightActions}>
        {/* Date Badge with Interactive Date Picker */}
        <TouchableOpacity style={styles.dateBadge} onPress={openDatePicker} activeOpacity={0.75}>
          <Calendar size={14} color={colors.primary} />
          <Text style={styles.dateText}>{formattedDate}</Text>
          {/* Hidden native HTML date input for web browser date picker */}
          {React.createElement('input', {
            ref: dateInputRef,
            type: 'date',
            max: new Date().toISOString().split('T')[0],
            onChange: handleDateChange,
            value: selectedDate.toISOString().split('T')[0],
            style: {
              position: 'absolute',
              opacity: 0,
              width: 0,
              height: 0,
              pointerEvents: 'none',
            },
          })}
        </TouchableOpacity>

        {/* Notification Bell Icon */}
        <TouchableOpacity style={styles.iconBtn} onPress={handleToggleNotifications} activeOpacity={0.75}>
          <Bell size={18} color={notifVisible ? colors.primary : colors.textMuted} />
          {unreadCount > 0 ? <View style={styles.notificationDot} /> : null}
        </TouchableOpacity>

        {/* Notification Popover */}
        <NotificationPopover
          visible={notifVisible}
          onClose={() => setNotifVisible(false)}
          testRuns={visibleRuns}
          readIds={readIds}
          onMarkAllAsRead={handleMarkAllAsRead}
          onClearAll={handleClearAll}
          onSelectRun={handleSelectRunItem}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    minHeight: 64,
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    flexWrap: 'wrap',
    gap: spacing.xs,
    zIndex: 100,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    flex: 1,
    minWidth: 180,
    maxWidth: 320,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textMain,
    padding: 0,
    borderWidth: 0,
    // @ts-ignore - Web specific styling to remove black browser focus ring completely
    outlineStyle: 'none',
    outlineWidth: 0,
    boxShadow: 'none',
  },
  clearBtn: {
    padding: 2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryHover,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.error,
  },
  userButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: spacing.xs,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  userMeta: {
    justifyContent: 'center',
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMain,
  },
  userRole: {
    fontSize: 11,
    color: colors.textMuted,
  },
});


