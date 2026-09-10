import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
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

export default function LobbyScreen() {
  const { session, signOut } = useSession();
  const [profile, setProfile] = useState<LobbyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, username, balance, level, status')
        .eq('id', session!.user.id)
        .single();

      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [session]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0B3D24', '#0A2A1A', '#08160F']} style={styles.gradient}>
        <View style={styles.content}>
          {loading && <ActivityIndicator color="#D4AF37" size="large" />}

          {!loading && error && (
            <View style={styles.card}>
              <Text style={styles.errorText}>Couldn&apos;t load your profile: {error}</Text>
              <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && !error && profile && (
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
        </View>
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
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
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
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
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
  },
  signOutText: { color: '#9BC4A9', fontWeight: '700', fontSize: 14 },
  errorText: { color: ERROR_RED, fontSize: 14, marginBottom: 16, textAlign: 'center' },
});
