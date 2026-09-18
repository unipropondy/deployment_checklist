import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { testRunService } from '../services/testRunService';
import { checklistService } from '../services/checklistService';
import { StatusBadge } from '../components/StatusBadge';
import { ProgressBar } from '../components/ProgressBar';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { useToast } from '../context/ToastContext';
import { CheckCircle2, ChevronDown, ChevronUp, Check, X, AlertOctagon, HelpCircle, Plus, Edit2 } from 'lucide-react-native';
import { colors, borderRadius, spacing, shadows } from '../constants/theme';

interface TestRunDetailScreenProps {
  route: any;
  navigation: any;
}

export const TestRunDetailScreen: React.FC<TestRunDetailScreenProps> = ({ route, navigation }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const testRunId = route.params?.id;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');
  const [testRun, setTestRun] = useState<any>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<{ [key: string]: boolean }>({});
  const [remarksState, setRemarksState] = useState<{ [key: number]: string }>({});
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  // Checklist Master Item Modal State
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null); // null if adding new item
  const [itemText, setItemText] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(1);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [savingItem, setSavingItem] = useState(false);

  // Fetch categories for modal dropdown
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res: any = await checklistService.getCategories();
        if (res && res.success) {
          setCategoriesList(res.data || []);
          if (res.data && res.data.length > 0) {
            setSelectedCategoryId(res.data[0].CategoryId);
          }
        }
      } catch (err) {
        // Fallback categories if backend fetch fails
        setCategoriesList([
          { CategoryId: 1, CategoryName: 'OVERALL' },
          { CategoryId: 2, CategoryName: 'WHATSAPP BOT' },
        ]);
      }
    };
    loadCategories();
  }, []);

  const handleOpenAddItem = (categoryName?: string) => {
    setEditingItem(null);
    setItemText('');
    if (categoryName && categoriesList.length > 0) {
      const match = categoriesList.find(
        (c) => c.CategoryName.toUpperCase() === categoryName.toUpperCase()
      );
      if (match) setSelectedCategoryId(match.CategoryId);
    }
    setItemModalVisible(true);
  };

  const handleOpenEditItem = (item: any) => {
    setEditingItem(item);
    setItemText(item.ChecklistItem || '');
    if (categoriesList.length > 0) {
      const match = categoriesList.find(
        (c) => c.CategoryName.toUpperCase() === (item.CategoryName || '').toUpperCase()
      );
      if (match) setSelectedCategoryId(match.CategoryId);
    }
    setItemModalVisible(true);
  };

  const handleSaveItemModal = async () => {
    if (!itemText.trim()) {
      showToast('Please enter checklist item text', 'error');
      return;
    }
    setSavingItem(true);
    try {
      if (editingItem) {
        // Edit existing ChecklistMaster item
        const masterId = editingItem.ChecklistId || editingItem.TestRunItemId;
        await checklistService.updateItem(masterId, {
          ChecklistItem: itemText.trim(),
          CategoryId: selectedCategoryId,
        });
        showToast('Checklist item updated successfully!', 'success');
      } else {
        // Create new ChecklistMaster item
        await checklistService.createItem({
          CategoryId: selectedCategoryId,
          ChecklistItem: itemText.trim(),
        });
        showToast('New checklist item added successfully!', 'success');
      }
      setItemModalVisible(false);
      fetchTestRunDetail();
    } catch (err: any) {
      showToast(err.message || 'Failed to save checklist item', 'error');
    } finally {
      setSavingItem(false);
    }
  };

  const fetchTestRunDetail = useCallback(async () => {
    if (!testRunId) return;
    try {
      setError('');
      const res: any = await testRunService.getTestRunById(testRunId);
      if (res && res.success) {
        setTestRun(res.data);
        const remMap: { [key: number]: string } = {};
        (res.data.Items || []).forEach((item: any) => {
          remMap[item.TestRunItemId] = item.Remarks || '';
        });
        setRemarksState(remMap);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load checklist details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [testRunId]);

  useEffect(() => {
    fetchTestRunDetail();
  }, [fetchTestRunDetail]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTestRunDetail();
  };

  const handleStatusChange = async (itemId: number, newStatus: string) => {
    try {
      // Optimistic update
      setTestRun((prev: any) => {
        if (!prev) return prev;
        const updatedItems = prev.Items.map((item: any) =>
          item.TestRunItemId === itemId ? { ...item, Status: newStatus } : item
        );
        const total = updatedItems.length;
        const completed = updatedItems.filter((i: any) => i.Status !== 'Pending').length;
        return {
          ...prev,
          Items: updatedItems,
          CompletedItems: completed,
          Progress: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      });

      await testRunService.updateTestRunItem(testRunId, itemId, { Status: newStatus });
      showToast(`Item status updated to ${newStatus}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update item status', 'error');
      fetchTestRunDetail();
    }
  };

  const handleRemarksBlur = async (itemId: number) => {
    const remarksValue = remarksState[itemId] || '';
    try {
      await testRunService.updateTestRunItem(testRunId, itemId, { Remarks: remarksValue });
      showToast('Remarks saved successfully', 'info');
    } catch (err: any) {
      showToast('Failed to save remarks', 'error');
    }
  };

  const handleCompleteTest = async () => {
    setConfirmModalVisible(false);
    setCompleting(true);
    try {
      const res: any = await testRunService.completeTestRun(testRunId);
      if (res && res.success) {
        showToast('Test run successfully completed!', 'success');
        fetchTestRunDetail();
      }
    } catch (err: any) {
      showToast(err.message || 'Completion blocked', 'error');
    } finally {
      setCompleting(false);
    }
  };

  if (loading && !refreshing) {
    return <LoadingState message="Loading checklist item details..." />;
  }

  if (error && !refreshing) {
    return <ErrorState message={error} onRetry={fetchTestRunDetail} />;
  }

  if (!testRun) {
    return <ErrorState message="Test Run session not found" />;
  }

  // Group checklist items by category
  const groupedCategories: { [key: string]: any[] } = {};
  (testRun.Items || []).forEach((item: any) => {
    const catName = item.CategoryName || 'GENERAL';
    if (!groupedCategories[catName]) {
      groupedCategories[catName] = [];
    }
    groupedCategories[catName].push(item);
  });

  const formattedDate = testRun.CheckDate
    ? new Date(testRun.CheckDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Session Details Header Box */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.headerInfo}>
            <View style={styles.titleBadgeRow}>
              <Text style={styles.checkId}>{testRun.CheckId}</Text>
              <StatusBadge status={testRun.Status} />
            </View>
            <Text style={styles.subtitle}>
              {testRun.ShopName} • {testRun.BuildVersion} • {formattedDate}
            </Text>
          </View>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.headerBtnGroup}>
          <TouchableOpacity
            style={styles.newChecklistBtn}
            onPress={() => navigation.navigate('NewTestRun')}
            activeOpacity={0.85}
          >
            <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.newChecklistBtnText}>New Checklist</Text>
          </TouchableOpacity>

          {testRun.Status !== 'Completed' ? (
            <TouchableOpacity
              style={[styles.completeBtn, completing && styles.completeBtnDisabled]}
              onPress={() => setConfirmModalVisible(true)}
              disabled={completing}
              activeOpacity={0.85}
            >
              {completing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle2 size={16} color="#FFFFFF" />
                  <Text style={styles.completeBtnText}>Mark as Completed</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.completedBadge}>
              <CheckCircle2 size={14} color={colors.success} />
              <Text style={styles.completedBadgeText}>Completed</Text>
            </View>
          )}
        </View>

        {/* Checked By & Metadata Row */}
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>
            Checked By: <Text style={styles.metaVal}>{(testRun.CheckedBy === '1' || testRun.CheckedBy === 1) ? (user?.Name || 'Admin User') : (testRun.CheckedBy || 'Admin User')}</Text>
          </Text>
          <Text style={styles.metaLabel}>
            Progress:{' '}
            <Text style={styles.metaVal}>
              {testRun.CompletedItems} / {testRun.TotalItems} completed ({testRun.Progress}%)
            </Text>
          </Text>
        </View>

        {/* Progress Bar */}
        <ProgressBar progress={testRun.Progress} showLabel={false} height={6} />
      </View>

      {/* Categories & Checklist Execution Tables */}
      {Object.keys(groupedCategories).map((categoryName) => {
        const categoryItems = groupedCategories[categoryName];
        const isCollapsed = collapsedCategories[categoryName];

        return (
          <View key={categoryName} style={styles.categorySection}>
            {/* Category Header */}
            <View style={styles.categoryHeader}>
              <TouchableOpacity
                style={styles.categoryHeaderLeft}
                onPress={() =>
                  setCollapsedCategories((prev) => ({
                    ...prev,
                    [categoryName]: !prev[categoryName],
                  }))
                }
                activeOpacity={0.8}
              >
                <Text style={styles.categoryTitle}>{categoryName.toUpperCase()}</Text>
                <View style={styles.itemCountBadge}>
                  <Text style={styles.itemCountText}>{categoryItems.length}</Text>
                </View>
                {isCollapsed ? <ChevronDown size={18} color={colors.textMuted} /> : <ChevronUp size={18} color={colors.textMuted} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addCategoryItemBtn}
                onPress={() => handleOpenAddItem(categoryName)}
                activeOpacity={0.8}
              >
                <Plus size={14} color={colors.primary} />
                <Text style={styles.addCategoryItemText}>Add Item</Text>
              </TouchableOpacity>
            </View>

            {/* Checklist Table */}
            {!isCollapsed && (
              <View style={styles.tableContainer}>
                {categoryItems.map((item: any, idx: number) => {
                  const currentStatus = item.Status;

                  return (
                    <View key={item.TestRunItemId} style={styles.itemRow}>
                      <View style={styles.snoCol}>
                        <Text style={styles.snoText}>{item.SNo || idx + 1}</Text>
                      </View>

                      <View style={styles.itemTitleCol}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.itemTitle, { flex: 1 }]}>{item.ChecklistItem}</Text>
                          <TouchableOpacity
                            style={styles.editIconBtn}
                            onPress={() => handleOpenEditItem(item)}
                            activeOpacity={0.7}
                          >
                            <Edit2 size={13} color={colors.primary} />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.itemCode}>{item.ChecklistCode}</Text>
                      </View>

                      {/* Status Selector Segmented Controls */}
                      <View style={styles.statusSegment}>
                        {[
                          { id: 'Pass', label: 'Pass', color: colors.success },
                          { id: 'Fail', label: 'Fail', color: colors.error },
                          { id: 'N/A', label: 'N/A', color: colors.textMuted },
                          { id: 'Pending', label: 'Pending', color: colors.warning },
                        ].map((st) => {
                          const isSelected = currentStatus === st.id;
                          return (
                            <TouchableOpacity
                              key={st.id}
                              style={[
                                styles.segmentBtn,
                                isSelected && { backgroundColor: st.color, borderColor: st.color },
                              ]}
                              onPress={() => handleStatusChange(item.TestRunItemId, st.id)}
                            >
                              <Text
                                style={[
                                  styles.segmentBtnText,
                                  isSelected && { color: '#FFFFFF', fontWeight: '800' },
                                ]}
                              >
                                {st.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Remarks Input */}
                      <View style={styles.remarksCol}>
                        <TextInput
                          style={styles.remarksInput}
                          placeholder="Enter remarks..."
                          placeholderTextColor={colors.textLight}
                          value={remarksState[item.TestRunItemId] || ''}
                          onChangeText={(text) =>
                            setRemarksState((prev) => ({
                              ...prev,
                              [item.TestRunItemId]: text,
                            }))
                          }
                          onBlur={() => handleRemarksBlur(item.TestRunItemId)}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}

      {/* Add / Edit Checklist Master Item Modal */}
      <Modal
        visible={itemModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setItemModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Checklist Item' : 'Add New Checklist Item'}
              </Text>
              <TouchableOpacity onPress={() => setItemModalVisible(false)}>
                <X size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.catPickerRow}>
                {categoriesList.map((cat) => (
                  <TouchableOpacity
                    key={cat.CategoryId}
                    style={[
                      styles.catChip,
                      selectedCategoryId === cat.CategoryId && styles.activeCatChip,
                    ]}
                    onPress={() => setSelectedCategoryId(cat.CategoryId)}
                  >
                    <Text
                      style={[
                        styles.catChipText,
                        selectedCategoryId === cat.CategoryId && styles.activeCatChipText,
                      ]}
                    >
                      {cat.CategoryName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Checklist Item Description</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Verify Payment Gateway Webhook response"
                placeholderTextColor={colors.textLight}
                value={itemText}
                onChangeText={setItemText}
                multiline
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setItemModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveItemModal}
                disabled={savingItem}
              >
                {savingItem ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {editingItem ? 'Save Changes' : 'Add Item'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={confirmModalVisible}
        title="Complete Deployment Test Session"
        message="Are you sure you want to close and complete this deployment test run? Ensure all checklist items have been tested."
        confirmText="Complete Test"
        onConfirm={handleCompleteTest}
        onCancel={() => setConfirmModalVisible(false)}
      />
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
  headerCard: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...shadows.card,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  headerInfo: {
    gap: 2,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkId: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textMain,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  headerBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  newChecklistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.sidebarBg,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: borderRadius.md,
  },
  newChecklistBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: borderRadius.md,
  },
  completeBtnDisabled: {
    opacity: 0.7,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.successBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  completedBadgeText: {
    color: colors.success,
    fontWeight: '700',
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  metaLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  metaVal: {
    fontWeight: '700',
    color: colors.textMain,
  },
  categorySection: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMain,
    letterSpacing: 0.5,
  },
  itemCountBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  itemCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMain,
  },
  tableContainer: {},
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  snoCol: {
    width: 24,
  },
  snoText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textLight,
  },
  itemTitleCol: {
    flex: 2,
    minWidth: 180,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMain,
  },
  itemCode: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 1,
  },
  statusSegment: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderRadius: borderRadius.sm,
    padding: 2,
    gap: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  remarksCol: {
    flex: 1.5,
    minWidth: 140,
  },
  remarksInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    color: colors.textMain,
    // @ts-ignore
    outlineStyle: 'none',
  },
  addCategoryItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary + '15',
  },
  addCategoryItemText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  editIconBtn: {
    padding: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: spacing.xs,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textMain,
  },
  modalBody: {
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  catPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  activeCatChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  activeCatChipText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: 13,
    color: colors.textMain,
    minHeight: 60,
    marginTop: 4,
    // @ts-ignore
    outlineStyle: 'none',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

