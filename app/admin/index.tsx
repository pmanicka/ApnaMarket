import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, SafeAreaView, RefreshControl,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { User, Community } from '../../types';

type PendingUser = User & { community?: Community };
type TabType = 'pending' | 'approved' | 'admins';

export default function AdminPanelScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('pending');

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true); else setIsLoading(true);

    let query = supabase
      .from('users')
      .select('*, community:communities(id, name, city, is_active, created_at)')
      .order('created_at', { ascending: false });

    if (activeTab === 'pending') query = query.eq('is_approved', false);
    else if (activeTab === 'approved') query = query.eq('is_approved', true).eq('is_admin', false);
    else if (activeTab === 'admins') query = query.eq('is_admin', true);

    const { data, error } = await query;
    if (!error && data) setUsers(data as PendingUser[]);
    setIsLoading(false);
    setIsRefreshing(false);
  }, [activeTab]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Guard: only admins can see this
  if (!profile?.is_admin) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>🚫 Admin access only.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleApprove = (user: PendingUser) => {
    Alert.alert('Approve User', `Allow ${user.name || user.mobile} to access the marketplace?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: '✓ Approve', onPress: async () => {
          const { error } = await supabase.from('users').update({ is_approved: true }).eq('id', user.id);
          if (error) { Alert.alert('Error', error.message); return; }
          fetchUsers();
        }
      }
    ]);
  };

  const handleRevoke = (user: PendingUser) => {
    Alert.alert('Revoke Access', `Remove marketplace access for ${user.name || user.mobile}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke', style: 'destructive', onPress: async () => {
          const { error } = await supabase.from('users').update({ is_approved: false }).eq('id', user.id);
          if (error) { Alert.alert('Error', error.message); return; }
          fetchUsers();
        }
      }
    ]);
  };

  const handleToggleAdmin = (user: PendingUser) => {
    const willPromote = !user.is_admin;
    Alert.alert(
      willPromote ? 'Make Admin' : 'Remove Admin',
      willPromote
        ? `Grant admin privileges to ${user.name || user.mobile}?\n\nThey will be able to approve and deny all users.`
        : `Remove admin privileges from ${user.name || user.mobile}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: willPromote ? '🛡️ Make Admin' : '🚫 Remove Admin',
          style: willPromote ? 'default' : 'destructive',
          onPress: async () => {
            // Cannot remove yourself as admin
            if (!willPromote && user.id === profile?.id) {
              Alert.alert('Not Allowed', 'You cannot remove your own admin access.');
              return;
            }
            const { error } = await supabase
              .from('users')
              .update({ is_admin: willPromote })
              .eq('id', user.id);
            if (error) { Alert.alert('Error', error.message); return; }
            fetchUsers();
          }
        }
      ]
    );
  };

  const renderUser = ({ item }: { item: PendingUser }) => (
    <View style={styles.userCard}>
      <View style={[styles.userAvatar, item.is_admin && styles.userAvatarAdmin]}>
        <Text style={[styles.userAvatarText, item.is_admin && styles.userAvatarTextAdmin]}>
          {item.name ? item.name.charAt(0).toUpperCase() : '?'}
        </Text>
      </View>

      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.userName}>{item.name || '(No name yet)'}</Text>
          {item.is_admin && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>🛡️ Admin</Text>
            </View>
          )}
        </View>
        <Text style={styles.userMobile}>{item.mobile}</Text>
        <Text style={styles.userMeta}>
          {item.community?.name || 'Unknown Community'}{'\n'}
          Block {item.block || '?'} • Flat {item.flat_number || '?'}
        </Text>
        <Text style={styles.userDate}>
          Joined {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>

        {/* Action buttons row at bottom */}
        <View style={styles.actionRow}>
          {activeTab === 'pending' && (
            <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item)}>
              <Text style={styles.approveBtnText}>✓ Approve</Text>
            </TouchableOpacity>
          )}
          {(activeTab === 'approved' || activeTab === 'admins') && (
            <>
              <TouchableOpacity style={styles.revokeBtn} onPress={() => handleRevoke(item)}>
                <Text style={styles.revokeBtnText}>✕ Revoke</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={item.is_admin ? styles.removeAdminBtn : styles.makeAdminBtn}
                onPress={() => handleToggleAdmin(item)}
              >
                <Text style={item.is_admin ? styles.removeAdminBtnText : styles.makeAdminBtnText}>
                  {item.is_admin ? '🚫 Remove Admin' : '🛡️ Make Admin'}
                </Text>
              </TouchableOpacity>
            </>
          )}
          {activeTab === 'pending' && (
            <TouchableOpacity
              style={item.is_admin ? styles.removeAdminBtn : styles.makeAdminBtn}
              onPress={() => handleToggleAdmin(item)}
            >
              <Text style={item.is_admin ? styles.removeAdminBtnText : styles.makeAdminBtnText}>
                {item.is_admin ? '🚫 Remove Admin' : '🛡️ Make Admin'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const tabs: { key: TabType; label: string }[] = [
    { key: 'pending', label: '⏳ Pending' },
    { key: 'approved', label: '✅ Approved' },
    { key: 'admins', label: '🛡️ Admins' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Text style={styles.iconTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats banner */}
      <View style={styles.statsBanner}>
        <Text style={styles.statsText}>
          Logged in as <Text style={styles.statsHighlight}>{profile.name || profile.mobile}</Text> · All admins can approve & deny
        </Text>
      </View>

      <View style={styles.tabRow}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchUsers(true)} tintColor="#FF6B35" />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>
                {activeTab === 'pending' ? '🎉' : activeTab === 'admins' ? '🛡️' : '📋'}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === 'pending' ? 'No pending approvals!' :
                  activeTab === 'admins' ? 'No other admins yet.' : 'No approved users yet.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const ORANGE = '#FF6B35';
const BG = '#0F0F1A';
const CARD_BG = '#1A1A2E';
const BORDER = '#2D2D44';
const PURPLE = '#7C3AED';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  container: { flex: 1, backgroundColor: BG },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  iconBtn: {
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
    backgroundColor: CARD_BG, borderRadius: 20, borderWidth: 1, borderColor: BORDER,
  },
  iconTxt: { fontSize: 16, color: '#FFF' },

  statsBanner: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)', borderBottomWidth: 1,
    borderBottomColor: 'rgba(124, 58, 237, 0.25)', paddingHorizontal: 16, paddingVertical: 10,
  },
  statsText: { color: '#9CA3AF', fontSize: 12, textAlign: 'center' },
  statsHighlight: { color: '#C4B5FD', fontWeight: '700' },

  tabRow: {
    flexDirection: 'row', borderBottomWidth: 1,
    borderBottomColor: BORDER, backgroundColor: CARD_BG,
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: ORANGE },
  tabText: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: ORANGE },

  list: { padding: 16 },
  userCard: {
    backgroundColor: CARD_BG, borderRadius: 16, borderWidth: 1,
    borderColor: BORDER, padding: 16, marginBottom: 12,
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
  },
  userAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#1E1428', borderWidth: 1.5, borderColor: ORANGE,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  userAvatarAdmin: { borderColor: PURPLE, backgroundColor: 'rgba(124,58,237,0.15)' },
  userAvatarText: { color: ORANGE, fontSize: 20, fontWeight: '800' },
  userAvatarTextAdmin: { color: '#C4B5FD' },
  userInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' },
  userName: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  adminBadge: {
    backgroundColor: 'rgba(124,58,237,0.15)', borderRadius: 6,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)',
    paddingHorizontal: 6, paddingVertical: 2,
  },
  adminBadgeText: { color: '#C4B5FD', fontSize: 11, fontWeight: '700' },
  userMobile: { color: '#9CA3AF', fontSize: 13, marginBottom: 4 },
  userMeta: { color: '#6B7280', fontSize: 12, marginBottom: 2, lineHeight: 18 },
  userDate: { color: '#4B5563', fontSize: 11, marginBottom: 10 },

  actionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  approveBtn: {
    backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1,
    borderColor: '#10B981', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7,
  },
  approveBtnText: { color: '#10B981', fontWeight: '700', fontSize: 12 },
  revokeBtn: {
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1,
    borderColor: '#EF4444', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7,
  },
  revokeBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 12 },
  makeAdminBtn: {
    backgroundColor: 'rgba(124,58,237,0.1)', borderWidth: 1,
    borderColor: PURPLE, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7,
  },
  makeAdminBtnText: { color: '#C4B5FD', fontWeight: '700', fontSize: 12 },
  removeAdminBtn: {
    backgroundColor: 'rgba(239,68,68,0.05)', borderWidth: 1,
    borderColor: '#6B7280', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7,
  },
  removeAdminBtnText: { color: '#9CA3AF', fontWeight: '700', fontSize: 12 },

  errorText: { color: '#EF4444', fontSize: 18, marginBottom: 16 },
  backBtn: {
    paddingHorizontal: 20, paddingVertical: 12, backgroundColor: CARD_BG,
    borderRadius: 10, borderWidth: 1, borderColor: BORDER,
  },
  backBtnText: { color: ORANGE, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: '#9CA3AF', fontSize: 16 },
});
