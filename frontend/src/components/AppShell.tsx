import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Modal } from 'react-native';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { Menu, X } from 'lucide-react-native';
import { colors } from '../constants/theme';

interface AppShellProps {
  children: React.ReactNode;
  currentScreen: string;
  onNavigate: (screen: string, params?: any) => void;
  onSearchChange?: (text: string) => void;
  searchValue?: string;
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
  onSelectTestRun?: (id: number) => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  currentScreen,
  onNavigate,
  onSearchChange,
  searchValue,
  selectedDate,
  onDateChange,
  onSelectTestRun,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileNavigate = (screen: string, params?: any) => {
    setMobileMenuOpen(false);
    onNavigate(screen, params);
  };

  const screenTitleMap: { [key: string]: string } = {
    DashboardTab: 'Dashboard',
    TestsTab: 'Tests',
    TestDetail: 'Checklist',
    ShopsTab: 'Shops',
    BuildsTab: 'Builds',
    UsersTab: 'Users',
    SettingsTab: 'Settings',
    NewTestRun: 'New Test Run',
  };

  if (!isDesktop) {
    // Mobile View
    return (
      <View style={styles.mobileContainer}>
        {/* Mobile Header Bar */}
        <View style={styles.mobileHeader}>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setMobileMenuOpen(true)}
            activeOpacity={0.7}
          >
            <Menu size={22} color={colors.textMain} />
          </TouchableOpacity>
          <Text style={styles.mobileTitle}>
            {screenTitleMap[currentScreen] || 'DEPLOYCHECK'}
          </Text>
        </View>

        {/* Top Header Search & Notifications for DashboardTab on mobile */}
        {currentScreen === 'DashboardTab' ? (
          <TopHeader
            onSearchChange={onSearchChange}
            searchValue={searchValue}
            selectedDate={selectedDate}
            onDateChange={onDateChange}
            onSelectTestRun={onSelectTestRun}
          />
        ) : null}

        {/* Main Content Area */}
        <View style={styles.contentArea}>{children}</View>

        {/* Mobile Sidebar Overlay Modal */}
        <Modal
          visible={mobileMenuOpen}
          animationType="fade"
          transparent
          onRequestClose={() => setMobileMenuOpen(false)}
        >
          <View style={styles.drawerOverlay}>
            <View style={styles.drawerContent}>
              <TouchableOpacity
                style={styles.closeDrawerBtn}
                onPress={() => setMobileMenuOpen(false)}
              >
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <Sidebar currentScreen={currentScreen} onNavigate={handleMobileNavigate} />
            </View>
            <TouchableOpacity
              style={styles.drawerBackdrop}
              onPress={() => setMobileMenuOpen(false)}
            />
          </View>
        </Modal>
      </View>
    );
  }

  // Desktop View (Sidebar + Top Header [Dashboard only] + Main Content)
  return (
    <View style={styles.desktopContainer}>
      <Sidebar currentScreen={currentScreen} onNavigate={onNavigate} />
      <View style={styles.mainWrapper}>
        {currentScreen === 'DashboardTab' ? (
          <TopHeader
            onSearchChange={onSearchChange}
            searchValue={searchValue}
            selectedDate={selectedDate}
            onDateChange={onDateChange}
            onSelectTestRun={onSelectTestRun}
          />
        ) : null}
        <View style={styles.contentArea}>{children}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mobileContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mobileHeader: {
    height: 52,
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 12,
    zIndex: 10,
  },
  menuBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mobileTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textMain,
  },
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  drawerContent: {
    width: 260,
    height: '100%',
    backgroundColor: colors.sidebarBg,
    position: 'relative',
  },
  closeDrawerBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 99,
    padding: 6,
  },
  drawerBackdrop: {
    flex: 1,
  },
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    height: '100%',
  },
  mainWrapper: {
    flex: 1,
    flexDirection: 'column',
    overflow: 'hidden',
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
