import React from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Modal } from 'react-native';
import { colors, borderRadius, spacing, shadows } from '../constants/theme';
import { getAvatarInitials } from '../utils/avatarUtils';

interface AdminDropdownProps {
  visible: boolean;
  onClose: () => void;
  userName: string;
  userRole?: string;
}

export const AdminDropdown: React.FC<AdminDropdownProps> = ({
  visible,
  onClose,
  userName,
  userRole = '',
}) => {
  if (!visible) return null;

  const userInitials = getAvatarInitials(userName);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <View style={styles.dropdownCard}>
            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{userInitials}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{userName}</Text>
                {!!userRole && <Text style={styles.role}>{userRole}</Text>}
              </View>
            </View>
          </View>
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
  dropdownCard: {
    position: 'absolute',
    top: 64,
    right: 20,
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minWidth: 200,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.dropdown,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMain,
  },
  role: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
});


