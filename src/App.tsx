import { View } from 'react-native';
import { useVals } from './StoreProvider';
import { Shell, StatusChrome } from './ui/Shell';
import { BottomNav, Header, Toast } from './ui/Chrome';
import { Welcome } from './screens/Welcome';
import { Login } from './screens/Login';
import { Signup } from './screens/Signup';
import { Forgot } from './screens/Forgot';
import { AdminDash, FreshDash, UserDash } from './screens/Dashboards';
import { Registry } from './screens/Registry';
import { Forum } from './screens/Forum';
import { Ads, Analysis, Members, Messages, Moderation } from './screens/Admin';
import { DetailSheet } from './sheets/Detail';
import { ReportSheet, SentSheet } from './sheets/Report';
import { ChatSheet, SupportSheet, ThreadSheet } from './sheets/Chat';
import { AdSheet, GuidelinesSheet, NewThreadSheet, ProfileSheet } from './sheets/Misc';

function Screen() {
  const v = useVals();
  if (v.isWelcome) return <Welcome />;
  if (v.isLogin) return <Login />;
  if (v.isSignup) return <Signup />;
  if (v.isForgot) return <Forgot />;
  if (v.isUserDash) return <UserDash />;
  if (v.isFreshDash) return <FreshDash />;
  if (v.isAdminDash) return <AdminDash />;
  if (v.isRegistry) return <Registry />;
  if (v.isForum) return <Forum />;
  if (v.isModeration) return <Moderation />;
  if (v.isAnalysis) return <Analysis />;
  if (v.isMembers) return <Members />;
  if (v.isAds) return <Ads />;
  if (v.isMessages) return <Messages />;
  return null;
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
  if (v.sheetProfile) return <ProfileSheet />;
  if (v.sheetGuidelines) return <GuidelinesSheet />;
  if (v.sheetAd) return <AdSheet />;
  return null;
}

export function App() {
  return (
    <Shell>
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <StatusChrome />
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
