import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TouchableWithoutFeedback } from 'react-native';
import { Store, CheckCircle, Clock, AlertTriangle, X } from 'lucide-react-native';
import { colors, borderRadius, spacing, shadows } from '../constants/theme';

interface NotificationPopoverProps {
  visible: boolean;
  onClose: () => void;
  testRuns: any[];
  onSelectRun: (testRunId: number) => void;
  readIds?: number[];
  onMarkAllAsRead?: () => void;
  onClearAll?: () => void;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  visible,
  onClose,
  testRuns,
  onSelectRun,
  readIds = [],
  onMarkAllAsRead,
  onClearAll,
}) => {
  if (!visible) return null;

  const unreadCount = testRuns.filter((r) => !readIds.includes(r.TestRunId)).length;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.popoverCard}>
              <View style={styles.headerRow}>
                <View style={styles.titleGroup}>
                  <Text style={styles.title}>Notifications</Text>
                  {unreadCount > 0 ? (
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>{unreadCount}</Text>
                    </View>
                  ) : null}
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.actionsBar}>
                <Text style={styles.subtitle}>Recent checklist shop deployments</Text>
                <View style={styles.headerButtons}>
                  {unreadCount > 0 ? (
                    <TouchableOpacity onPress={onMarkAllAsRead} activeOpacity={0.7}>
                      <Text style={styles.actionLink}>Mark read</Text>
                    </TouchableOpacity>
                  ) : null}
                  {testRuns.length > 0 ? (
                    <TouchableOpacity onPress={onClearAll} activeOpacity={0.7}>
                      <Text style={[styles.actionLink, { color: colors.error }]}>Clear</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
                {testRuns.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No recent shop checklist notifications.</Text>
                  </View>
                ) : (
                  testRuns.slice(0, 8).map((run) => {
                    const formattedDate = run.CheckDate
                      ? new Date(run.CheckDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : 'Recently';

                    const isCompleted = run.Status === 'Completed';
                    const isUnread = !readIds.includes(run.TestRunId);

                    return (
                      <TouchableOpacity
                        key={run.TestRunId}
                        style={[styles.itemCard, isUnread && styles.unreadItemCard]}
                        onPress={() => {
                          onClose();
                          onSelectRun(run.TestRunId);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.iconWrapper, isCompleted ? styles.completedIconBg : styles.progressIconBg]}>
                          <Store size={16} color={isCompleted ? colors.success : colors.primary} />
                        </View>

                        <View style={styles.itemContent}>
                          <View style={styles.itemTopRow}>
                            <View style={styles.shopTitleRow}>
                              <Text style={styles.shopName} numberOfLines={1}>
                                {run.ShopName || 'Shop Checklist'}
                              </Text>
                              {isUnread ? <View style={styles.unreadDot} /> : null}
                            </View>
                            <Text style={styles.timeText}>{formattedDate}</Text>
                          </View>

                          <Text style={styles.itemDesc} numberOfLines={1}>
                            Checklist session {run.CheckId} ({run.BuildVersion || 'Build'})
                          </Text>

                          <View style={styles.statusRow}>
                            <View style={[styles.statusDot, { backgroundColor: isCompleted ? colors.success : colors.warning }]} />
                            <Text style={[styles.statusText, { color: isCompleted ? colors.success : colors.warning }]}>
                              {isCompleted ? 'Checklist Completed' : 'Checklist In Progress'} ({run.Progress}%)
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  popoverCard: {
    position: 'absolute',
    top: 64,
    right: 70,
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: 340,
    maxHeight: 420,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.dropdown,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textMain,
  },
  countBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  countText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  closeBtn: {
    padding: 2,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionLink: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  scrollArea: {
    maxHeight: 330,
  },
  emptyContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: colors.textLight,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: borderRadius.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.bg,
    marginBottom: 6,
  },
  unreadItemCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  shopTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  completedIconBg: {
    backgroundColor: colors.successBg,
  },
  progressIconBg: {
    backgroundColor: colors.primaryLight,
  },
  itemContent: {
    flex: 1,
    gap: 2,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shopName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMain,
    flex: 1,
  },
  timeText: {
    fontSize: 10,
    color: colors.textLight,
    fontWeight: '500',
  },
  itemDesc: {
    fontSize: 11,
    color: colors.textMuted,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
