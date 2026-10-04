// Shared types and the few static lists the app still uses (categories, welcome slides, status colours).

export type Status = 'Active' | 'Resolved' | 'Reunited' | 'Flagged';
export type Kind = 'Lost' | 'Found';

export interface Item {
  id: string; title: string; location: string; date: string;
  status: Status; kind: Kind; icon: string; by: string; desc: string;
  coords?: string | null;
  /** The real `items.id` uuid + reporter uuid, needed for
   *  update/delete/claim calls (the display `id` above is `items.display_id`,
   *  a human-readable string, not the primary key). */
  dbId?: string;
  reporterId?: string;
  /** Public URL of the post's first photo (list rows show it instead of the category icon). */
  photo?: string;
}
export interface Campaign {
  key: string; campaign: string; advertiser: string; icon: string; rate: string; cpm: number;
}
export interface Ad {
  id: string; screen: string; slot: string; format: string; size: string;
  campaignKey: string; campaign: string; advertiser: string; icon: string;
  days: number; daysLeft: number; revenue: number; impressions: number;
  ctr: number; live: boolean;
}
export interface Slide { img: string; tint: string; kicker: string; title: string; body: string }
export interface ChatMsg { from: 'me' | 'them' | 'bot'; text: string; time: string }
export interface Convo {
  id: string;
  itemId: string; with: string; item: string; icon: string;
  unread: number; time: string; msgs: ChatMsg[];
}

export const SCREEN_ICON: Record<string,string> = {Home:"space_dashboard", Registry:"travel_explore", Forum:"forum", "Report success":"task_alt"};

export const CATS: string[] = ["Electronics","Wallets","Keys","Bags","Documents","Pets","Other"];

export const STATUS: Record<string,string> = {Active:"#6B7280", Resolved:"#0F7B3D", Reunited:"#0F7B3D", Flagged:"#B42318", Sighting:"#0B6BCB", Question:"#6B7280"};

export const SLIDES: Slide[] = [
  {img:"HomePage1.webp", tint:"#E2ECF7", kicker:"Welcome to Lost Items Community",
   title:"Lost Something? We'll Help You Find It!",
   body:"Join thousands of people reuniting with their lost belongings every day. Report what you've found, search for what you've lost, and be part of a caring community."},
  {img:"illustration-exchange-item.webp", tint:"#EAF1E7", kicker:"How it works",
   title:"Simple, Fast & Effective",
   body:"Report found items in 30 seconds. Search our registry by category, location and date. Get instant notifications when a matching item is reported."},
  {img:"illustration-treasure-chest.webp", tint:"#F5EDE2", kicker:"Why choose us",
   title:"Join 10,000+ Community Members!",
   body:"100% free forever, instant notifications, and a trusted community with verified users, secure messaging and safe meetup guidelines."}
];

export const SUPPORT_GREETING =
  "Hi! I'm the Community Assistant. Ask me anything about reporting, claiming or staying safe — or pick a question below.";

