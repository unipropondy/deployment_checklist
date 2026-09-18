import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import {
  LayoutDashboard,
  CheckSquare,
  ListTodo,
  Store,
  Package,
  Users,
  Settings,
  LogOut,
  ShieldCheck,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { colors, borderRadius, spacing } from '../constants/theme';
import { getAvatarInitials } from '../utils/avatarUtils';

interface SidebarProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentScreen, onNavigate }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'DashboardTab', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'TestsTab', label: 'Tests', icon: CheckSquare },
    { id: 'TestDetail', label: 'Checklist', icon: ListTodo },
    { id: 'ShopsTab', label: 'Shops', icon: Store },
    { id: 'BuildsTab', label: 'Builds', icon: Package },
    { id: 'UsersTab', label: 'Users', icon: Users },
    { id: 'SettingsTab', label: 'Settings', icon: Settings },
  ];

  const userInitials = getAvatarInitials(user?.Name);
  const userRole = (user as any)?.Role || (user as any)?.RoleName || '';

  return (
    <View style={styles.sidebar}>
      {/* Brand Header */}
      <View style={styles.brandContainer}>
        <View style={styles.logoBadge}>
          <ShieldCheck size={22} color={colors.primary} strokeWidth={2.5} />
        </View>
        <View>
          <Text style={styles.brandTitle}>DEPLOYCHECK</Text>
          <Text style={styles.brandSubtitle}>System Checklist</Text>
        </View>
      </View>

      {/* Navigation Links */}
      <ScrollView style={styles.navContainer} showsVerticalScrollIndicator={false}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.navItem, isActive && styles.activeNavItem]}
              onPress={() => onNavigate(item.id)}
              activeOpacity={0.7}
            >
              <Icon
                size={18}
                color={isActive ? '#FFFFFF' : colors.sidebarText}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <Text style={[styles.navLabel, isActive && styles.activeNavLabel]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* User Footer */}
      <View style={styles.userFooter}>
        <View style={styles.userInfoRow}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.Name}
            </Text>
            {!!userRole && <Text style={styles.userRole}>{userRole}</Text>}
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <LogOut size={16} color={colors.sidebarText} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 240,
    backgroundColor: colors.sidebarBg,
    height: '100%',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    justifyContent: 'space-between',
    borderRightWidth: 1,
    borderRightColor: '#1E293B',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xs,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 122, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 17,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    color: colors.sidebarText,
    fontSize: 11,
    fontWeight: '600',
  },
  navContainer: {
    flex: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    marginBottom: 4,
  },
  activeNavItem: {
    backgroundColor: colors.primary,
  },
  navLabel: {
    color: colors.sidebarText,
    fontSize: 13,
    fontWeight: '600',
  },
  activeNavLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  userFooter: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userAvatar: {
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
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  userRole: {
    color: colors.sidebarText,
    fontSize: 11,
  },
  logoutBtn: {
    padding: 6,
  },
});


