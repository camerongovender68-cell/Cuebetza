import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/use-session';
import type { Profile } from '@/models/profile';

type LobbyProfile = Pick<Profile, 'id' | 'username' | 'balance' | 'level' | 'status'>;

// Raw shape of a public.operating_tables row (snake_case, matching the DB
// columns) -- see supabase/schema.sql.
interface OperatingTableRow {
  id: string;
  type: 'standard' | 'tournament' | 'special';
  variant: '8_ball' | '9_ball' | 'classic';
  min_stake: number;
  max_stake: number;
  capacity: number;
  active_players: number;
}

export default function LobbyScreen() {
  const { session, signOut } = useSession();
  const [profile, setProfile] = useState<LobbyProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [tables, setTables] = useState<OperatingTableRow[]>([]);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [tablesError, setTablesError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, balance, level, status')
        .eq('id', session!.user.id)
        .single();

      if (cancelled) return;
      if (error) setProfileError(error.message);
      else setProfile(data);
      setProfileLoading(false);
    };

    const loadTables = async () => {
      const { data, error } = await supabase
        .from('operating_tables')
        .select('id, type, variant, min_stake, max_stake, capacity, active_players')
        .order('min_stake', { ascending: true });

      if (cancelled) return;
      if (error) setTablesError(error.message);
      else setTables(data ?? []);
      setTablesLoading(false);
    };

    loadProfile();
    loadTables();
    return () => {
      cancelled = true;
    };
  }, [session]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0B3D24', '#0A2A1A', '#08160F']} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.content}>
          {profileLoading && <ActivityIndicator color="#D4AF37" size="large" />}

          {!profileLoading && profileError && (
            <View style={styles.card}>
              <Text style={styles.errorText}>Couldn&apos;t load your profile: {profileError}</Text>
              <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          )}

          {!profileLoading && !profileError && profile && (
            <View style={styles.card}>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.username}>{profile.username}</Text>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>BALANCE</Text>
                  <Text style={styles.statValue}>R{profile.balance.toFixed(2)}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>LEVEL</Text>
                  <Text style={styles.statValue}>{profile.level}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.tablesSection}>
            <Text style={styles.sectionTitle}>Available Tables</Text>

            {tablesLoading && <ActivityIndicator color="#D4AF37" />}

            {!tablesLoading && tablesError && (
              <Text style={styles.errorText}>Couldn&apos;t load tables: {tablesError}</Text>
            )}

            {!tablesLoading && !tablesError && tables.length === 0 && (
              <Text style={styles.emptyText}>
                No tables are open right now. Run supabase/seed.sql to add some.
              </Text>
            )}

            {!tablesLoading &&
              !tablesError &&
              tables.map((table) => (
                <View key={table.id} style={styles.tableCard}>
                  <View style={styles.tableCardHeader}>
                    <Text style={styles.tableVariant}>{table.variant.replace('_', ' ')}</Text>
                    <Text style={styles.tableType}>{table.type}</Text>
                  </View>
                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>STAKE</Text>
                      <Text style={styles.statValue}>
                        R{table.min_stake}–R{table.max_stake}
                      </Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>PLAYERS</Text>
                      <Text style={styles.statValue}>
                        {table.active_players}/{table.capacity}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const GOLD = '#D4AF37';
const CARD_BG = '#0F2A1C';
const ERROR_RED = '#E5484D';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#08160F' },
  gradient: { flex: 1 },
  content: { flexGrow: 1, alignItems: 'center', padding: 24, gap: 24 },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1E4531',
  },
  greeting: { color: '#9BC4A9', fontSize: 14, fontWeight: '600' },
  username: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', marginTop: 4, marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statBox: {
    flex: 1,
    backgroundColor: '#08160F',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E4531',
  },
  statLabel: { color: '#6B8A76', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  statValue: { color: GOLD, fontSize: 20, fontWeight: '800', marginTop: 4, textTransform: 'capitalize' },
  signOutButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E4531',
    marginTop: 4,
  },
  signOutText: { color: '#9BC4A9', fontWeight: '700', fontSize: 14 },
  errorText: { color: ERROR_RED, fontSize: 14, marginBottom: 16, textAlign: 'center' },
  tablesSection: { width: '100%', maxWidth: 420, gap: 12 },
  sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  emptyText: { color: '#6B8A76', fontSize: 13, textAlign: 'center' },
  tableCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E4531',
  },
  tableCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tableVariant: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', textTransform: 'capitalize' },
  tableType: { color: '#6B8A76', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
});
