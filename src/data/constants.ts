// Datasets transcribed verbatim from prototype/Lost Items App v3 (native).dc.html
// (lines 1267-1401). Extracted mechanically, not retyped -- do not hand-edit values.

export type Status = 'Active' | 'Resolved' | 'Reunited' | 'Flagged';
export type Kind = 'Lost' | 'Found';

export interface Item {
  id: string; title: string; location: string; date: string;
  status: Status; kind: Kind; icon: string; by: string; desc: string;
  coords?: string | null;
}
export interface FlaggedRecord {
  id: string; title: string; author: string; category: string; reason: string; date: string;
}
export interface Reply { user: string; ini: string; time: string; text: string }
export interface Thread {
  id: number; user: string; ini: string; meta: string; tag: string;
  status: string; title: string; text: string; replies: Reply[]; mine?: boolean;
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
export interface Member {
  id: number; ini: string; name: string; handle: string;
  posts: number; joined: string; suspended: boolean;
}
export interface Slide { img: string; tint: string; kicker: string; title: string; body: string }
export interface ChatMsg { from: 'me' | 'them' | 'bot'; text: string; time: string }
export interface Convo {
  itemId: string; with: string; item: string; icon: string;
  unread: number; time: string; msgs: ChatMsg[];
}
export interface FaqEntry { q: string; keys: string[]; a: string }

export const FLAGGED: FlaggedRecord[] = [
  {id:"LOST-1031", title:"Samsung Galaxy S24", author:"alex.j", category:"Electronics", reason:"Unverified ownership claim", date:"2024-06-05"},
  {id:"FOUND-2009", title:"iPhone 15", author:"subway.finder", category:"Electronics", reason:"Suspicious contact info", date:"2024-06-06"},
  {id:"POST-091", title:"Lost: Vintage Polaroid Camera", author:"emily.c", category:"Forum", reason:"Spam / Repeated links", date:"2024-06-07"}
];

export const FOUND: Item[] = [
  {id:"FOUND-2018", title:"Black Wallet", location:"Riverside Park bench", date:"11 Jun 2024", status:"Active", kind:"Found", icon:"account_balance_wallet", by:"j.rivera", desc:"Handed in at the park office. Cards inside, no cash. Owner name partially legible."},
  {id:"FOUND-2015", title:"Silver Watch", location:"Coffee shop on 5th Ave", date:"09 Jun 2024", status:"Active", kind:"Found", icon:"watch", by:"cafe.5th", desc:"Left on a window table. Metal strap, small scratch on the clasp."},
  {id:"FOUND-2009", title:"iPhone 15", location:"Union Square subway station", date:"06 Jun 2024", status:"Active", kind:"Found", icon:"smartphone", by:"subway.finder", desc:"Locked screen, blue case. Held at the station desk pending verification."},
  {id:"FOUND-1998", title:"Car Keys with Fob", location:"Parking lot B", date:"31 May 2024", status:"Resolved", kind:"Found", icon:"key", by:"lotb.security", desc:"Returned to owner after fob serial matched the report."},
  {id:"FOUND-1990", title:"Student ID Card", location:"City College cafeteria", date:"28 May 2024", status:"Active", kind:"Found", icon:"badge", by:"campus.desk", desc:"Card is intact. Waiting for the registered student to claim it."}
];

export const LOST: Item[] = [
  {id:"LOST-1031", title:"Samsung Galaxy S24", location:"Bus 14, evening route", date:"05 Jun 2024", status:"Flagged", kind:"Lost", icon:"smartphone", by:"alex.j", desc:"Left on the rack above the seat. Black case, cracked corner."},
  {id:"LOST-1029", title:"Prescription glasses", location:"City library, 2nd floor", date:"04 Jun 2024", status:"Active", kind:"Lost", icon:"visibility", by:"m.okafor", desc:"Tortoise frames in a hard black case."},
  {id:"LOST-1024", title:"Blue Jansport backpack", location:"Central Station platform 3", date:"02 Jun 2024", status:"Active", kind:"Lost", icon:"backpack", by:"simple.user", desc:"Notebook and a grey hoodie inside."},
  {id:"LOST-1018", title:"Grey tabby cat, no collar", location:"Oak Street", date:"29 May 2024", status:"Reunited", kind:"Lost", icon:"pets", by:"d.pham", desc:"Answers to Miso. Found by a neighbour two streets away."}
];

export const THREADS: Thread[] = [
  {id:1, user:"Joyce", ini:"JO", meta:"09:00 AM · Central district", tag:"Sighting", status:"live",
   title:"Rolex Submariner — possible match at Central Station",
   text:"Great news! I think I saw this matching description at the Central Station desk. Worth calling before you travel over.",
   replies:[
     {user:"Marcus", ini:"MA", time:"09:14 AM", text:"I was there this morning — the desk does hold watches in a sealed bag. Ask for the lost property window, not the ticket office."},
     {user:"Joyce", ini:"JO", time:"09:22 AM", text:"Exactly. Bring ID and anything with the serial on it, they check before handing anything over."},
     {user:"Priya", ini:"PR", time:"10:03 AM", text:"Called them, they still have it. Owner has been notified through the app."}
   ]},
  {id:2, user:"Gladyce", ini:"GL", meta:"08:45 AM · Verified", tag:"Reunited", status:"live",
   title:"MacBook Pro 16 returned to its owner",
   text:"Verified ownership serial number matches. Owner contacted successfully and collected it this morning.",
   replies:[
     {user:"Elbert", ini:"EL", time:"09:02 AM", text:"This is the third laptop reunited this month. The serial check makes it so much easier."},
     {user:"Owner", ini:"DA", time:"11:20 AM", text:"That was mine — thank you all. Two years of work on that drive."}
   ]},
  {id:3, user:"Elbert", ini:"EL", meta:"Yesterday · Riverside", tag:"Question", status:"live",
   title:"How long does the desk hold handed-in items?",
   text:"Dropped a wallet at the park office last week and it is still showing Active. Does the holding period reset after a claim?",
   replies:[
     {user:"Sara", ini:"SV", time:"Yesterday", text:"Most desks hold items 90 days. The status only flips to Resolved once a claim is verified by a moderator."}
   ]}
];

export const SCREEN_ICON: Record<string,string> = {Home:"space_dashboard", Registry:"travel_explore", Forum:"forum", "Report success":"task_alt"};

export const CAMPAIGNS: Campaign[] = [
  {key:"keysmart", campaign:"KeySmart tags — 20% off", advertiser:"KeySmart", icon:"key", rate:"$14 CPM", cpm:14},
  {key:"citylock", campaign:"CityLock 24h locksmith", advertiser:"CityLock", icon:"lock", rate:"$22 CPM", cpm:22},
  {key:"phonemedic", campaign:"PhoneMedic screen repair", advertiser:"PhoneMedic", icon:"smartphone", rate:"$18 CPM", cpm:18},
  {key:"trackr", campaign:"Trackr bag tracker bundle", advertiser:"Trackr", icon:"my_location", rate:"$26 CPM", cpm:26}
];

export const ADS: Ad[] = [
  {id:"AD-01", screen:"Home", slot:"Below community activity", format:"Native strip", size:"320 × 104", campaignKey:"keysmart", campaign:"KeySmart tags — 20% off", advertiser:"KeySmart", icon:"key", days:30, daysLeft:18, revenue:1240, impressions:41200, ctr:2.4, live:true},
  {id:"AD-02", screen:"Registry", slot:"In-feed, after 4th listing", format:"In-feed card", size:"In-feed", campaignKey:"citylock", campaign:"CityLock 24h locksmith", advertiser:"CityLock", icon:"lock", days:14, daysLeft:6, revenue:2860, impressions:88400, ctr:3.1, live:true},
  {id:"AD-03", screen:"Forum", slot:"Above the first thread", format:"In-feed card", size:"In-feed", campaignKey:"phonemedic", campaign:"PhoneMedic screen repair", advertiser:"PhoneMedic", icon:"smartphone", days:7, daysLeft:0, revenue:430, impressions:12900, ctr:1.2, live:false},
  {id:"AD-04", screen:"Report success", slot:"Confirmation sheet", format:"Single offer", size:"320 × 88", campaignKey:"trackr", campaign:"Trackr bag tracker bundle", advertiser:"Trackr", icon:"my_location", days:30, daysLeft:24, revenue:1980, impressions:9400, ctr:5.6, live:true}
];

export const SCOUTS: {ini:string}[] = [{ini:"GL"},{ini:"EB"},{ini:"DA"},{ini:"JO"},{ini:"MA"}];

export const MEMBERS: Member[] = [
  {id:1, ini:"AJ", name:"Alex Jordan", handle:"alex.j", posts:11, joined:"Mar 2024", suspended:false},
  {id:2, ini:"SF", name:"Subway Finder", handle:"subway.finder", posts:34, joined:"Jan 2024", suspended:true},
  {id:3, ini:"EC", name:"Emily Chen", handle:"emily.c", posts:6, joined:"May 2024", suspended:false},
  {id:4, ini:"SU", name:"Simple User", handle:"user", posts:4, joined:"Feb 2024", suspended:false},
  {id:5, ini:"MO", name:"Marina Okafor", handle:"m.okafor", posts:2, joined:"Jun 2024", suspended:false}
];

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

export const CHAT_SEED: ChatMsg[] = [
  {from:"them", text:"Hi! I'm the one who handed this in. Can you describe anything unique about it so I can verify?", time:"09:12"},
  {from:"me", text:"Sure — there's a small scratch on the clasp and a folded metro ticket tucked inside.", time:"09:14"},
  {from:"them", text:"That matches. Happy to hand it over. Would you rather meet up or should I post it?", time:"09:15"}
];

export const FAQ: FaqEntry[] = [
  {q:"How do I report an item?", keys:["report","post","upload","submit"],
   a:"Super easy! Tap the + button, upload a photo, add a description (colour, brand, location found), and submit. You'll get notifications when potential owners reach out. The whole process takes less than 2 minutes!"},
  {q:"How can I claim an item?", keys:["claim","mine","owner","collect"],
   a:"Found your lost item? Open the item and use our secure messaging to contact the finder. Verify ownership by describing unique features only you would know, then arrange a safe meetup in a public place to collect it."},
  {q:"What if I can't find my lost item?", keys:["can't find","cannot find","no match","nothing","missing"],
   a:"Don't give up! Create a lost item post with detailed descriptions, photos and location. Enable notifications to get instant alerts when matching items are reported, and check back regularly — new items are added daily."},
  {q:"Is the platform free?", keys:["free","cost","price","pay","fee","premium"],
   a:"Absolutely! Lost Items Community is 100% free forever. No hidden fees, no premium plans, no catch. Create unlimited posts, search the entire registry, and message other users completely free."},
  {q:"Is meeting a stranger safe?", keys:["safe","safety","meet","stranger","scam"],
   a:"Always meet in a busy public place during daylight, bring someone with you if you can, and never send money upfront. Verify ownership in chat first — and report anything suspicious so a moderator can review it."}
];

export const SUPPORT_SEED: ChatMsg[] = [
  {from:"bot", text:"Hi! I'm the Community Assistant. Ask me anything about reporting, claiming or staying safe — or pick a question below.", time:"09:00"}
];

export const CONVOS: Convo[] = [
  {itemId:"FOUND-2015", with:"cafe.5th", item:"Silver Watch", icon:"watch", unread:2, time:"09:15", msgs:[
    {from:"me", text:"Hi, I think the watch you handed in is mine. Lost it near 5th Ave on Sunday.", time:"09:02"},
    {from:"them", text:"Could be! Can you tell me what's engraved on the back?", time:"09:11"},
    {from:"them", text:"I'm at the café until 6 today if you want to collect it.", time:"09:15"}
  ]},
  {itemId:"FOUND-1990", with:"campus.desk", item:"Student ID Card", icon:"badge", unread:0, time:"Yesterday", msgs:[
    {from:"them", text:"Your ID is at the cafeteria desk. Bring any second ID and it's yours.", time:"16:40"},
    {from:"me", text:"Perfect, I'll come by tomorrow morning. Thank you!", time:"17:02"}
  ]}
];

export const IMG_FIT: number[] = [1, 1.16, 1.04];
