import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { User, LogOut } from 'lucide-react-native';

export const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Account Profile Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account Profile</Text>
        <View style={styles.itemRow}>
          <User size={20} color="#FF7A00" />
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>Logged-in User</Text>
            <Text style={styles.itemValue}>{user?.Name || 'User'}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <LogOut size={18} color="#EF4444" />
        <Text style={styles.logoutText}>Sign Out of Application</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  contentContainer: { padding: 24, paddingBottom: 40, gap: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', gap: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  itemTitle: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  itemValue: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEE2E2', paddingVertical: 14, borderRadius: 12 },
  logoutText: { color: '#EF4444', fontWeight: '800', fontSize: 14 },
});
