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
import { userService } from '../services/userService';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { useToast } from '../context/ToastContext';
import { Search, Plus, Power } from 'lucide-react-native';
import { colors, borderRadius, spacing, shadows } from '../constants/theme';

interface UsersScreenProps {
  headerSearchQuery?: string;
  onClearHeaderSearch?: () => void;
}

export const UsersScreen: React.FC<UsersScreenProps> = ({
  headerSearchQuery = '',
  onClearHeaderSearch,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState(headerSearchQuery);

  useEffect(() => {
    setSearchQuery(headerSearchQuery);
  }, [headerSearchQuery]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setError('');
      const res: any = await userService.getUsers();
      if (res && res.success) {
        setUsers(res.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setName('');
    setPassword('');
    setModalVisible(true);
  };

  const handleOpenEdit = (usr: any) => {
    setEditingUser(usr);
    setName(usr.Name || '');
    setPassword('');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Name is required', 'error');
      return;
    }

    if (!editingUser && !password.trim()) {
      showToast('Password is required for new users', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingUser) {
        await userService.updateUser(editingUser.UserId, { Name: name, Password: password });
        showToast('User updated successfully', 'success');
      } else {
        await userService.createUser({ Name: name, Password: password });
        showToast('User created successfully', 'success');
      }
      setModalVisible(false);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to save user', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (usr: any) => {
    const newStatus = usr.IsActive === false ? true : false;
    try {
      await userService.updateUserStatus(usr.UserId, newStatus);
      showToast(`User ${newStatus ? 'activated' : 'deactivated'}`, 'info');
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to update user status', 'error');
    }
  };

  const filteredUsers = users.filter((u) =>
    (u.Name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !refreshing) {
    return <LoadingState message="Loading system users..." />;
  }

  if (error && !refreshing) {
    return <ErrorState message={error} onRetry={fetchUsers} />;
  }

  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Name..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd}>
          <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.addBtnText}>Create User</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {filteredUsers.length === 0 ? (
        <EmptyState title="No Users Found" message="No user records match your query." />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.UserId.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          renderItem={({ item }) => {
            const userInitials = item.Name
              ? item.Name.trim()
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()
              : 'U';

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.userMeta}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{userInitials}</Text>
                    </View>
                    <View>
                      <Text style={styles.name}>{item.Name}</Text>
                    </View>
                  </View>
                  <StatusBadge status={item.IsActive !== false ? 'Active' : 'Inactive'} />
                </View>

                <View style={styles.cardBody}>
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
            );
          }}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingUser ? 'Edit User' : 'Create New User'}</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Name *</Text>
              <TextInput style={styles.fieldInput} value={name} onChangeText={setName} placeholder="e.g. John Doe" placeholderTextColor={colors.textLight} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{editingUser ? 'New Password (Optional)' : 'Password *'}</Text>
              <TextInput style={styles.fieldInput} secureTextEntry value={password} onChangeText={setPassword} placeholder="Enter password" placeholderTextColor={colors.textLight} />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.saveBtnText}>Save User</Text>}
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
  userMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  name: { fontSize: 15, fontWeight: '800', color: colors.textMain },
  email: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  cardBody: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.borderLight },
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

