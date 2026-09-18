import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { buildService } from '../services/buildService';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { useToast } from '../context/ToastContext';
import { Search, Plus, Package, Calendar } from 'lucide-react-native';
import { colors, borderRadius, spacing, shadows } from '../constants/theme';

interface BuildsScreenProps {
  headerSearchQuery?: string;
  onClearHeaderSearch?: () => void;
}

export const BuildsScreen: React.FC<BuildsScreenProps> = ({
  headerSearchQuery = '',
  onClearHeaderSearch,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [builds, setBuilds] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState(headerSearchQuery);

  useEffect(() => {
    setSearchQuery(headerSearchQuery);
  }, [headerSearchQuery]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingBuild, setEditingBuild] = useState<any>(null);
  const [version, setVersion] = useState('');
  const [environment, setEnvironment] = useState('Production');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchBuilds = useCallback(async () => {
    try {
      setError('');
      const res: any = await buildService.getBuilds();
      if (res && res.success) {
        setBuilds(res.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch builds.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBuilds();
  }, [fetchBuilds]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBuilds();
  };

  const handleOpenAdd = () => {
    setEditingBuild(null);
    setVersion('');
    setEnvironment('Production');
    setRemarks('');
    setModalVisible(true);
  };

  const handleOpenEdit = (build: any) => {
    setEditingBuild(build);
    setVersion(build.Version || '');
    setEnvironment(build.Environment || 'Production');
    setRemarks(build.Remarks || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!version.trim()) {
      showToast('Version is required', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingBuild) {
        await buildService.updateBuild(editingBuild.BuildId, { Version: version, Environment: environment, Remarks: remarks });
        showToast('Build updated successfully', 'success');
      } else {
        await buildService.createBuild({ Version: version, Environment: environment, Remarks: remarks });
        showToast('Build created successfully', 'success');
      }
      setModalVisible(false);
      fetchBuilds();
    } catch (err: any) {
      showToast(err.message || 'Failed to save build', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredBuilds = builds.filter((b) =>
    (b.Version || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.Environment || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.Remarks || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !refreshing) {
    return <LoadingState message="Loading software builds..." />;
  }

  if (error && !refreshing) {
    return <ErrorState message={error} onRetry={fetchBuilds} />;
  }

  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Version, Environment..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd}>
          <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.addBtnText}>Add Build</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {filteredBuilds.length === 0 ? (
        <EmptyState title="No Builds Found" message="No software builds match your query." />
      ) : (
        <FlatList
          data={filteredBuilds}
          keyExtractor={(item) => item.BuildId.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          renderItem={({ item }) => {
            const formattedDate = item.CreatedAt
              ? new Date(item.CreatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'N/A';

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.buildMeta}>
                    <Package size={18} color={colors.primary} />
                    <View>
                      <Text style={styles.version}>{item.Version}</Text>
                      <Text style={styles.env}>{item.Environment}</Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.editBtn} onPress={() => handleOpenEdit(item)}>
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.remarks} numberOfLines={2}>
                    {item.Remarks || 'No remarks provided.'}
                  </Text>
                  <View style={styles.dateRow}>
                    <Calendar size={12} color={colors.textLight} />
                    <Text style={styles.dateText}>Created: {formattedDate}</Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingBuild ? 'Edit Build' : 'Add New Build'}</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Version *</Text>
              <TextInput style={styles.fieldInput} value={version} onChangeText={setVersion} placeholder="e.g. v2.4.8" placeholderTextColor={colors.textLight} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Environment *</Text>
              <View style={styles.envPills}>
                {['Production', 'Staging', 'Development'].map((env) => (
                  <TouchableOpacity
                    key={env}
                    style={[styles.envPill, environment === env && styles.envPillActive]}
                    onPress={() => setEnvironment(env)}
                  >
                    <Text style={[styles.envPillText, environment === env && styles.envPillTextActive]}>{env}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Remarks</Text>
              <TextInput
                style={[styles.fieldInput, { height: 72 }]}
                multiline
                value={remarks}
                onChangeText={setRemarks}
                placeholder="Enter build release notes or remarks..."
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.saveBtnText}>Save Build</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  toolbar: { padding: spacing.md, backgroundColor: colors.cardBg, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', gap: spacing.sm, alignItems: 'center', flexWrap: 'wrap' },
  searchBox: { flex: 1, minWidth: 220, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: 12, height: 40, gap: 8 },
  searchInput: ({ flex: 1, fontSize: 13, color: colors.textMain, outlineStyle: 'none' } as any),
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.md },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  listContent: { padding: spacing.md, gap: spacing.sm },
  card: { backgroundColor: colors.cardBg, borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: 10, ...shadows.card },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  buildMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  version: { fontSize: 15, fontWeight: '800', color: colors.textMain },
  env: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  editBtn: { backgroundColor: colors.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border },
  editBtnText: { fontSize: 11, fontWeight: '700', color: colors.textMain },
  cardBody: { gap: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.borderLight },
  remarks: { fontSize: 12, color: colors.textMuted },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 11, color: colors.textLight },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', alignItems: 'center', padding: spacing.md },
  modalCard: { backgroundColor: colors.cardBg, borderRadius: borderRadius.lg, padding: spacing.lg, maxWidth: 420, width: '100%', gap: spacing.md, ...shadows.dropdown },
  modalTitle: { fontSize: 17, fontWeight: '800', color: colors.textMain },
  fieldGroup: { gap: 4 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.textMain },
  fieldInput: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: 12, height: 40, fontSize: 13, color: colors.textMain },
  envPills: { flexDirection: 'row', gap: 6 },
  envPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: borderRadius.sm, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  envPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  envPillText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  envPillTextActive: { color: '#FFFFFF', fontWeight: '700' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: spacing.xs },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.md, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  cancelBtnText: { color: colors.textMuted, fontWeight: '600', fontSize: 13 },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.md, backgroundColor: colors.primary },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});

