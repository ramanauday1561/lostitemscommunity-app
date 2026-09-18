import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader, SectionHeader } from '@/components/layout';
import { Box, Card, Text } from '@/components/primitives';
import { EmptyState, ErrorState, Loading, Pill } from '@/components/ui';
import { fetchStats, type AdminStats } from '@/lib/admin';
import { supabase } from '@/lib/supabase';
import { money } from '@/lib/format';
import { colors } from '@/theme/tokens';

type Campaign = {
  id: string;
  short_code: string;
  advertiser_name: string;
  campaign_name: string;
  screen_slot: string;
  format: string | null;
  is_live: boolean;
  start_date: string | null;
  end_date: string | null;
};

type Totals = { impressions: number; clicks: number; revenue: number };

export default function Ads() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [totals, setTotals] = useState<Record<string, Totals>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [st, camp, statRows] = await Promise.all([
        fetchStats(),
        supabase
          .from('ad_campaigns')
          .select('id,short_code,advertiser_name,campaign_name,screen_slot,format,is_live,start_date,end_date')
          .order('created_at', { ascending: false }),
        supabase.from('ad_stats').select('campaign_id,impressions,clicks,revenue'),
      ]);

      if (camp.error) throw camp.error;
      setStats(st);
      setCampaigns((camp.data ?? []) as Campaign[]);

      // Roll daily rows up per campaign here rather than adding a view.
      const agg: Record<string, Totals> = {};
      for (const r of (statRows.data ?? []) as { campaign_id: string; impressions: number; clicks: number; revenue: number }[]) {
        const t = agg[r.campaign_id] ?? { impressions: 0, clicks: 0, revenue: 0 };
        t.impressions += r.impressions;
        t.clicks += r.clicks;
        t.revenue += Number(r.revenue);
        agg[r.campaign_id] = t;
      }
      setTotals(agg);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load campaigns.');
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (loading) return <Loading label="Loading placements…" />;
  if (error || !stats) return <ErrorState message={error ?? 'No data'} onRetry={() => void onRefresh()} />;

  const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n));
  const ctr = stats.impressions_month > 0 ? ((stats.clicks_month / stats.impressions_month) * 100).toFixed(1) : '0.0';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 130 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <ScreenHeader kicker="Monetization" title="Ad placements" />

        <Box paddingHorizontal="xl" marginTop="xl">
          <Card variant="row">
            <Text variant="kickerMuted">REVENUE THIS MONTH</Text>
            <Text variant="h1" marginTop="xs">
              {money(stats.revenue_month)}
            </Text>
            <Box flexDirection="row" gap="xxl" marginTop="lg">
              <Box>
                <Text variant="h2" style={{ fontSize: 18 }}>
                  {compact(stats.impressions_month)}
                </Text>
                <Text variant="meta">IMPRESSIONS</Text>
              </Box>
              <Box>
                <Text variant="h2" style={{ fontSize: 18 }}>
                  {stats.campaigns_live}
                </Text>
                <Text variant="meta">SLOTS LIVE</Text>
              </Box>
              <Box>
                <Text variant="h2" style={{ fontSize: 18 }}>
                  {ctr}%
                </Text>
                <Text variant="meta">AVG CTR</Text>
              </Box>
            </Box>
          </Card>
        </Box>

        <SectionHeader title="Placements" />

        {campaigns.length === 0 ? (
          <Box paddingHorizontal="xl" height={220}>
            <EmptyState title="No campaigns yet" body="Sponsored placements you sell will appear here." />
          </Box>
        ) : (
          campaigns.map((c) => {
            const t = totals[c.id] ?? { impressions: 0, clicks: 0, revenue: 0 };
            const rowCtr = t.impressions > 0 ? ((t.clicks / t.impressions) * 100).toFixed(1) : '0.0';
            return (
              <Box key={c.id} paddingHorizontal="xl" marginBottom="md">
                <Card variant="row">
                  <Box flexDirection="row" alignItems="center" justifyContent="space-between">
                    <Text variant="meta">
                      {c.short_code} · {(c.format ?? c.screen_slot).toUpperCase()}
                    </Text>
                    <Pill text={c.is_live ? 'Live' : 'Paused'} tone={c.is_live ? 'found' : 'neutral'} />
                  </Box>

                  <Text variant="cardTitle" marginTop="sm">
                    {c.campaign_name}
                  </Text>
                  <Text variant="small" marginTop="xs">
                    {c.advertiser_name} · {c.screen_slot.replace('_', ' ')}
                  </Text>

                  <Box flexDirection="row" gap="xxl" marginTop="lg">
                    <Box>
                      <Text variant="cardTitle">{money(t.revenue)}</Text>
                      <Text variant="meta">REVENUE</Text>
                    </Box>
                    <Box>
                      <Text variant="cardTitle">{compact(t.impressions)}</Text>
                      <Text variant="meta">IMPRESSIONS</Text>
                    </Box>
                    <Box>
                      <Text variant="cardTitle">{rowCtr}%</Text>
                      <Text variant="meta">CTR</Text>
                    </Box>
                  </Box>
                </Card>
              </Box>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.bg } });
