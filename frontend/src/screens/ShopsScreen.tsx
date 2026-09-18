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
import { shopService } from '../services/shopService';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { useToast } from '../context/ToastContext';
import { Search, Plus, Store, MapPin, Power } from 'lucide-react-native';
import { colors, borderRadius, spacing, shadows } from '../constants/theme';

interface ShopsScreenProps {
  headerSearchQuery?: string;
  onClearHeaderSearch?: () => void;
}

export const ShopsScreen: React.FC<ShopsScreenProps> = ({
  headerSearchQuery = '',
  onClearHeaderSearch,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [shops, setShops] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState(headerSearchQuery);

  useEffect(() => {
    setSearchQuery(headerSearchQuery);
  }, [headerSearchQuery]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingShop, setEditingShop] = useState<any>(null);
  const [shopCode, setShopCode] = useState('');
  const [shopName, setShopName] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchShops = useCallback(async () => {
    try {
      setError('');
      const res: any = await shopService.getShops();
      if (res && res.success) {
        setShops(res.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch shops.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchShops();
  };

  const handleOpenAdd = () => {
    setEditingShop(null);
    setShopCode('');
    setShopName('');
    setLocation('');
    setModalVisible(true);
  };

  const handleOpenEdit = (shop: any) => {
    setEditingShop(shop);
    setShopCode(shop.ShopCode || '');
    setShopName(shop.ShopName || '');
    setLocation(shop.Location || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!shopCode.trim() || !shopName.trim()) {
      showToast('Shop Code and Shop Name are required', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingShop) {
        await shopService.updateShop(editingShop.ShopId, { ShopCode: shopCode, ShopName: shopName, Location: location });
        showToast('Shop updated successfully', 'success');
      } else {
        await shopService.createShop({ ShopCode: shopCode, ShopName: shopName, Location: location });
        showToast('Shop created successfully', 'success');
      }
      setModalVisible(false);
      fetchShops();
    } catch (err: any) {
      showToast(err.message || 'Failed to save shop', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (shop: any) => {
    const newStatus = shop.IsActive === false ? true : false;
    try {
      await shopService.updateShopStatus(shop.ShopId, newStatus);
      showToast(`Shop ${newStatus ? 'activated' : 'deactivated'}`, 'info');
      fetchShops();
    } catch (err: any) {
      showToast(err.message || 'Failed to update shop status', 'error');
    }
  };

  const filteredShops = shops.filter((s) =>
    (s.ShopCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.ShopName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.Location || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !refreshing) {
    return <LoadingState message="Loading registered shops..." />;
  }

  if (error && !refreshing) {
    return <ErrorState message={error} onRetry={fetchShops} />;
  }

  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Shop Code, Name, Location..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd}>
          <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.addBtnText}>Add Shop</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {filteredShops.length === 0 ? (
        <EmptyState title="No Shops Found" message="No shop records match your query." />
      ) : (
        <FlatList
          data={filteredShops}
          keyExtractor={(item) => item.ShopId.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.shopMeta}>
                  <Store size={18} color={colors.primary} />
                  <View>
                    <Text style={styles.shopName}>{item.ShopName}</Text>
                    <Text style={styles.shopCode}>{item.ShopCode}</Text>
                  </View>
                </View>
                <StatusBadge status={item.IsActive !== false ? 'Active' : 'Inactive'} />
              </View>

              <View style={styles.cardBody}>
                <View style={styles.locRow}>
                  <MapPin size={14} color={colors.textMuted} />
                  <Text style={styles.locText}>{item.Location || 'Not Specified'}</Text>
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => handleOpenEdit(item)}>
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.statusToggleBtn, item.IsActive === false && styles.statusToggleBtnActive]}
                    onPress={() => handleToggleStatus(item)}
                  >
                    <Power size={13} color={item.IsActive === false ? colors.success : colors.error} />
                    <Text style={[styles.statusToggleText, item.IsActive === false && styles.statusToggleTextActive]}>
                      {item.IsActive === false ? 'Activate' : 'Deactivate'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingShop ? 'Edit Shop' : 'Add New Shop'}</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Shop Code *</Text>
              <TextInput style={styles.fieldInput} value={shopCode} onChangeText={setShopCode} placeholder="e.g. KINDEE" placeholderTextColor={colors.textLight} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Shop Name *</Text>
              <TextInput style={styles.fieldInput} value={shopName} onChangeText={setShopName} placeholder="e.g. Kindee Retail Outlet" placeholderTextColor={colors.textLight} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Location</Text>
              <TextInput style={styles.fieldInput} value={location} onChangeText={setLocation} placeholder="e.g. Singapore" placeholderTextColor={colors.textLight} />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.saveBtnText}>Save Shop</Text>}
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
  toolbar: {
    padding: spacing.md,
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  searchBox: {
    flex: 1,
    minWidth: 220,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: ({ flex: 1, fontSize: 13, color: colors.textMain, outlineStyle: 'none' } as any),
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  listContent: { padding: spacing.md, gap: spacing.sm },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
    ...shadows.card,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shopMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shopName: { fontSize: 15, fontWeight: '800', color: colors.textMain },
  shopCode: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.borderLight },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locText: { fontSize: 12, color: colors.textMuted },
  actionsRow: { flexDirection: 'row', gap: 8 },
  editBtn: { backgroundColor: colors.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border },
  editBtnText: { fontSize: 11, fontWeight: '700', color: colors.textMain },
  statusToggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.errorBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: borderRadius.sm },
  statusToggleBtnActive: { backgroundColor: colors.successBg },
  statusToggleText: { fontSize: 11, fontWeight: '700', color: colors.error },
  statusToggleTextActive: { color: colors.success },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', alignItems: 'center', padding: spacing.md },
  modalCard: { backgroundColor: colors.cardBg, borderRadius: borderRadius.lg, padding: spacing.lg, maxWidth: 420, width: '100%', gap: spacing.md, ...shadows.dropdown },
  modalTitle: { fontSize: 17, fontWeight: '800', color: colors.textMain },
  fieldGroup: { gap: 4 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.textMain },
  fieldInput: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: 12, height: 40, fontSize: 13, color: colors.textMain },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: spacing.xs },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.md, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  cancelBtnText: { color: colors.textMuted, fontWeight: '600', fontSize: 13 },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.md, backgroundColor: colors.primary },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});

