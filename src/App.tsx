import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { screenIn } from './ui/motion';
import { useVals } from './StoreProvider';
import { Shell } from './ui/Shell';
import { InstallBanner } from './ui/InstallBanner';
import { BottomNav, Header, Toast } from './ui/Chrome';
import { Welcome } from './screens/Welcome';
import { Login } from './screens/Login';
import { Signup } from './screens/Signup';
import { Forgot } from './screens/Forgot';
import { AdminDash, FreshDash, UserDash } from './screens/Dashboards';
import { Registry } from './screens/Registry';
import { Forum } from './screens/Forum';
import { Ads, Analysis, Members, Messages, Moderation, SupportInbox } from './screens/Admin';
import { DetailSheet } from './sheets/Detail';
import { ReportSheet, SentSheet } from './sheets/Report';
import { ChatSheet, SupportReplySheet, SupportSheet, ThreadSheet } from './sheets/Chat';
import { AdSheet, GuidelinesSheet, NewThreadSheet, NotificationsSheet, ProfileSheet } from './sheets/Misc';

/** The active screen's name and element. */
function pick(v: ReturnType<typeof useVals>): [string, React.ReactNode] {
  if (v.isWelcome) return ['welcome', <Welcome />];
  if (v.isLogin) return ['login', <Login />];
  if (v.isSignup) return ['signup', <Signup />];
  if (v.isForgot) return ['forgot', <Forgot />];
  if (v.isUserDash) return ['userDash', <UserDash />];
  if (v.isFreshDash) return ['freshDash', <FreshDash />];
  if (v.isAdminDash) return ['adminDash', <AdminDash />];
  if (v.isRegistry) return ['registry', <Registry />];
  if (v.isForum) return ['forum', <Forum />];
  if (v.isModeration) return ['moderation', <Moderation />];
  if (v.isSupportInbox) return ['supportInbox', <SupportInbox />];
  if (v.isAnalysis) return ['analysis', <Analysis />];
  if (v.isMembers) return ['members', <Members />];
  if (v.isAds) return ['ads', <Ads />];
  if (v.isMessages) return ['messages', <Messages />];
  return ['none', null];
}

/** Keyed by screen name so each navigation fades the new screen in instead of cutting to it. */
function Screen() {
  const [name, node] = pick(useVals());
  if (!node) return null;
  return <Animated.View key={name} entering={screenIn} style={{ flex: 1 }}>{node}</Animated.View>;
}

function Sheets() {
  const v = useVals();
  if (v.sheetDetail) return <DetailSheet />;
  if (v.sheetReport) return <ReportSheet />;
  if (v.sheetSent) return <SentSheet />;
  if (v.sheetChat) return <ChatSheet />;
  if (v.sheetThread) return <ThreadSheet />;
  if (v.sheetNewThread) return <NewThreadSheet />;
  if (v.sheetSupport) return <SupportSheet />;
  if (v.sheetSupportReply) return <SupportReplySheet />;
  if (v.sheetProfile) return <ProfileSheet />;
  if (v.sheetNotifications) return <NotificationsSheet />;
  if (v.sheetGuidelines) return <GuidelinesSheet />;
  if (v.sheetAd) return <AdSheet />;
  return null;
}

export function App() {
  return (
    <Shell>
      {/* No overflow clipping here: backdrops and sheet scrims reach up under the status bar (see useTopInset). */}
      <View style={{ flex: 1 }}>
        <InstallBanner />
        <Header />
        <View style={{ flex: 1, minHeight: 0 }}>
          <Screen />
        </View>
        <BottomNav />
        <Toast />
        <Sheets />
      </View>
    </Shell>
  );
}
