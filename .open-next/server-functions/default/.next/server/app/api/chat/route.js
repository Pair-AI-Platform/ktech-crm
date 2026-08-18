(()=>{var a={};a.id=276,a.ids=[276],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},8128:a=>{"use strict";a.exports=require("next/dist/server/runtime-reacts.external.js")},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},14757:(a,b,c)=>{"use strict";c.r(b),c.d(b,{POST:()=>k,maxDuration:()=>i});var d=c(98797),e=c(44014),f=c(31495),g=c(18507);let h=["new","contacted","visit","test","application","applicant","enrolled"],i=30,j=!process.env.OPENAI_API_KEY,k=(0,d.N)({context:"ai-chat"},async({req:a,supabase:b,user:d,profile:i,logger:k})=>{if(!(await (0,e.i)(`ai-chat:${d.id}`,e.c["ai-chat"])).success)return Response.json({error:"Too many requests. Please wait a moment."},{status:429});let{messages:n,conversationId:o}=await a.json();if(!n||!Array.isArray(n))return Response.json({error:"Messages are required"},{status:400});let{data:p}=await b.from("profiles").select("full_name").eq("id",d.id).single(),q=p?.full_name||d.email||"User",r=i.role,s=o;if(!s){let{data:a,error:c}=await b.from("ai_conversations").insert({user_id:d.id,title:"New conversation"}).select("id").single();if(c)return k.error("Failed to create conversation",{error:c.message}),Response.json({error:"Failed to create conversation"},{status:500});s=a.id}let t=n[n.length-1],u="";if(t?.role==="user"&&(u=t.parts?.filter(a=>"text"===a.type).map(a=>a.text).join("")||"",await b.from("ai_messages").insert({conversation_id:s,role:"user",content:u}),1===n.filter(a=>"user"===a.role).length)){let a=u.slice(0,100);await b.from("ai_conversations").update({title:a}).eq("id",s)}if(j){let a=function(a){let b=a.toLowerCase();for(let a of l)if(a.keywords.some(a=>(function(a,b){let c=b.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return RegExp(`\\b${c}\\b`).test(a)})(b,a)))return a.response;return`Great question! Here's what I can help you with:

- 📊 **"Show me the pipeline"**: lead distribution by stage
- 👥 **"Compare agent performance"**: leaderboard & conversion rates
- 📈 **"What's the conversion funnel?"**: stage-by-stage drop-off
- 🎓 **"How many students enrolled?"**: enrollment breakdown
- 💰 **"What's our revenue?"**: payment summary
- 🕐 **"What happened today?"**: recent activity feed
- 📣 **"Where are leads coming from?"**: source analysis
- ❌ **"Why are we losing leads?"**: lost lead reasons
- 📅 **"Show appointments"**: calendar overview

Just ask in your own words. I'll figure it out!`}(u);return await b.from("ai_messages").insert({conversation_id:s,role:"assistant",content:a}),m(a,s??"")}let{streamText:v,convertToModelMessages:w,stepCountIs:x}=await c.e(8497).then(c.bind(c,78497)),{getSystemPrompt:y}=await c.e(7953).then(c.bind(c,27953)),z={getPipelineSummary:(0,f.z6)({description:"Get lead counts grouped by pipeline stage. Use this to understand the current pipeline distribution.",inputSchema:g.Ik({dateFrom:g.Yj().optional().describe("Start date filter (ISO format, e.g. 2025-01-01)"),dateTo:g.Yj().optional().describe("End date filter (ISO format)")}),execute:async({dateFrom:a,dateTo:c})=>{let e=b.from("leads").select("pipeline_stage");"agent"===r&&(e=e.eq("assigned_to",d.id)),a&&(e=e.gte("created_at",a)),c&&(e=e.lte("created_at",c));let{data:f,error:g}=await e;if(g)return{error:g.message};if(!f||0===f.length)return{summary:[],total:0};let h={};for(let a of f){let b=a.pipeline_stage||"unknown";h[b]=(h[b]||0)+1}return{summary:Object.entries(h).map(([a,b])=>({stage:a,count:b})).sort((a,b)=>b.count-a.count),total:f.length}}}),getLeadStats:(0,f.z6)({description:"Get lead statistics grouped by a chosen dimension: status, source, source_category, or pipeline_stage. Useful for understanding lead distribution.",inputSchema:g.Ik({groupBy:g.k5(["contact_status","source","source_category","pipeline_stage"]).describe("Dimension to group leads by"),dateFrom:g.Yj().optional().describe("Start date filter (ISO format)"),dateTo:g.Yj().optional().describe("End date filter (ISO format)"),pipelineStage:g.Yj().optional().describe("Filter by specific pipeline stage")}),execute:async({groupBy:a,dateFrom:c,dateTo:e,pipelineStage:f})=>{let g=b.from("leads").select(a);"agent"===r&&(g=g.eq("assigned_to",d.id)),c&&(g=g.gte("created_at",c)),e&&(g=g.lte("created_at",e)),f&&(g=g.eq("pipeline_stage",f));let{data:h,error:i}=await g;if(i)return{error:i.message};if(!h||0===h.length)return{stats:[],total:0};let j={};for(let b of h){let c=b[a]||"unknown";j[c]=(j[c]||0)+1}return{stats:Object.entries(j).map(([b,c])=>({[a]:b,count:c})).sort((a,b)=>b.count-a.count),total:h.length,groupedBy:a}}}),getAgentPerformance:(0,f.z6)({description:"Get agent performance metrics: total leads, enrolled count, conversion rate, and contact rate. Admin-only: shows all agents. Agents: shows only their own stats.",inputSchema:g.Ik({dateFrom:g.Yj().optional().describe("Start date filter (ISO format)"),dateTo:g.Yj().optional().describe("End date filter (ISO format)"),limit:g.ai().optional().default(10).describe("Max number of agents to return")}),execute:async({dateFrom:a,dateTo:c,limit:e})=>{let f=b.from("leads").select("assigned_to, pipeline_stage, contact_status, created_at");"agent"===r&&(f=f.eq("assigned_to",d.id)),a&&(f=f.gte("created_at",a)),c&&(f=f.lte("created_at",c));let{data:g,error:h}=await f;if(h)return{error:h.message};if(!g||0===g.length)return{agents:[],message:"No leads found for this period"};let i=[...new Set(g.map(a=>a.assigned_to).filter(Boolean))],{data:j}=await b.from("profiles").select("id, full_name").in("id",i),k=new Map(j?.map(a=>[a.id,a.full_name])||[]),l={};for(let a of g){let b=a.assigned_to;b&&(l[b]||(l[b]={total:0,enrolled:0,contacted:0}),l[b].total++,"enrolled"===a.pipeline_stage&&l[b].enrolled++,"uncontacted"!==a.contact_status&&l[b].contacted++)}return{agents:Object.entries(l).map(([a,b])=>({agentName:k.get(a)||"Unknown",totalLeads:b.total,enrolled:b.enrolled,conversionRate:b.total>0?Math.round(b.enrolled/b.total*100):0,contactRate:b.total>0?Math.round(b.contacted/b.total*100):0})).sort((a,b)=>b.enrolled-a.enrolled).slice(0,e)}}}),getConversionRates:(0,f.z6)({description:"Get funnel conversion rates showing how leads progress through pipeline stages. Shows the count and percentage at each stage.",inputSchema:g.Ik({dateFrom:g.Yj().optional().describe("Start date filter (ISO format)"),dateTo:g.Yj().optional().describe("End date filter (ISO format)")}),execute:async({dateFrom:a,dateTo:c})=>{let e=b.from("leads").select("pipeline_stage, completed_stages");"agent"===r&&(e=e.eq("assigned_to",d.id)),a&&(e=e.gte("created_at",a)),c&&(e=e.lte("created_at",c));let{data:f,error:g}=await e;if(g)return{error:g.message};if(!f||0===f.length)return{funnel:[],total:0};let i=f.length,j={};for(let a of h)j[a]=0;for(let a of f){let b=a.completed_stages||[],c=a.pipeline_stage;for(let a of h)(b.includes(a)||c===a)&&j[a]++}return{funnel:h.map((a,b)=>({stage:a,count:j[a],percentOfTotal:i>0?Math.round(j[a]/i*100):0,dropoffFromPrevious:b>0&&j[h[b-1]]>0?Math.round((j[h[b-1]]-j[a])/j[h[b-1]]*100):0})),total:i}}}),getEnrollmentStats:(0,f.z6)({description:"Get enrollment statistics from the students table. Can group by agent, funding type, or gender.",inputSchema:g.Ik({groupBy:g.k5(["assigned_agent","funding_type","gender"]).optional().describe("Dimension to group enrollments by"),dateFrom:g.Yj().optional().describe("Start date filter (ISO format)"),dateTo:g.Yj().optional().describe("End date filter (ISO format)")}),execute:async({groupBy:a,dateFrom:c,dateTo:e})=>{let f=b.from("students").select("id, assigned_agent, funding_type, gender, created_at");"agent"===r&&(f=f.eq("assigned_agent",d.id)),c&&(f=f.gte("created_at",c)),e&&(f=f.lte("created_at",e));let{data:g,error:h}=await f;if(h)return{error:h.message};if(!g||0===g.length)return{stats:[],total:0};if(!a)return{total:g.length};let i={};for(let b of g){let c=b[a]||"unknown";i[c]=(i[c]||0)+1}if("assigned_agent"===a){let c=Object.keys(i).filter(a=>"unknown"!==a),{data:d}=await b.from("profiles").select("id, full_name").in("id",c),e=new Map(d?.map(a=>[a.id,a.full_name])||[]);return{stats:Object.entries(i).map(([a,b])=>({agent:e.get(a)||a,count:b})).sort((a,b)=>b.count-a.count),total:g.length,groupedBy:a}}return{stats:Object.entries(i).map(([b,c])=>({[a]:b,count:c})).sort((a,b)=>b.count-a.count),total:g.length,groupedBy:a}}}),getPaymentSummary:(0,f.z6)({description:"Get payment/revenue summary from payment_transactions table. Shows total revenue, payment counts by status, and average transaction amount.",inputSchema:g.Ik({dateFrom:g.Yj().optional().describe("Start date filter (ISO format)"),dateTo:g.Yj().optional().describe("End date filter (ISO format)"),status:g.Yj().optional().describe("Filter by payment status")}),execute:async({dateFrom:a,dateTo:c,status:e})=>{let f=b.from("payment_transactions").select("id, amount, status, payment_method, created_at, lead_id");if("agent"===r){let{data:a,error:c}=await b.from("leads").select("id").eq("assigned_to",d.id);if(c)return{error:c.message};let e=(a??[]).map(a=>a.id);if(0===e.length)return{totalRevenue:0,count:0,averageAmount:0,statusBreakdown:[]};f=f.in("lead_id",e)}a&&(f=f.gte("created_at",a)),c&&(f=f.lte("created_at",c)),e&&(f=f.eq("status",e));let{data:g,error:h}=await f;if(h)return{error:h.message};if(!g||0===g.length)return{totalRevenue:0,count:0,averageAmount:0,statusBreakdown:[]};let i=g.reduce((a,b)=>a+(b.amount||0),0),j={};for(let a of g){let b=a.status||"unknown";j[b]||(j[b]={count:0,amount:0}),j[b].count++,j[b].amount+=a.amount||0}let k=Object.entries(j).map(([a,b])=>({status:a,...b}));return{totalRevenue:Math.round(100*i)/100,count:g.length,averageAmount:g.length>0?Math.round(i/g.length*100)/100:0,statusBreakdown:k}}}),getRecentActivity:(0,f.z6)({description:"Get recently updated leads to see recent CRM activity. Returns the most recently modified leads with their current stage and status.",inputSchema:g.Ik({limit:g.ai().optional().default(10).describe("Number of recent leads to return (max 20)"),pipelineStage:g.Yj().optional().describe("Filter by pipeline stage")}),execute:async({limit:a,pipelineStage:c})=>{let e=Math.min(a,20),f=b.from("leads").select("id, full_name, pipeline_stage, contact_status, source, updated_at, assigned_to").order("updated_at",{ascending:!1}).limit(e);"agent"===r&&(f=f.eq("assigned_to",d.id)),c&&(f=f.eq("pipeline_stage",c));let{data:g,error:h}=await f;if(h)return{error:h.message};if(!g||0===g.length)return{leads:[],message:"No recent activity found"};let i=new Map;if("admin"===r){let a=[...new Set(g.map(a=>a.assigned_to).filter(Boolean))];if(a.length>0){let{data:c}=await b.from("profiles").select("id, full_name").in("id",a);i=new Map(c?.map(a=>[a.id,a.full_name])||[])}}return{leads:g.map(a=>({name:a.full_name,stage:a.pipeline_stage,status:a.contact_status,source:a.source,updatedAt:a.updated_at,..."admin"===r&&a.assigned_to?{agent:i.get(a.assigned_to)||"Unassigned"}:{}}))}}})},A=v({model:"openai/gpt-4o-mini",system:y({role:r,userName:q}),messages:await w(n),tools:z,stopWhen:x(5)});return A.consumeStream(),A.toUIMessageStreamResponse({originalMessages:n,onFinish:async({responseMessage:a})=>{let c=a.parts?.filter(a=>"text"===a.type).map(a=>a.text).join("")||"";c&&await b.from("ai_messages").insert({conversation_id:s,role:"assistant",content:c})},headers:new Headers({"X-Conversation-Id":s??""})})}),l=[{keywords:["hello","hi","hey","marhaba","hala"],response:`Hey! 👋 I'm **Kadi**, your CRM assistant. I can help you with:

- **Pipeline stats**: "How many leads do we have?"
- **Agent performance**: "Compare top agents"
- **Conversions**: "Show me the funnel"
- **Enrollments**: "How many students enrolled?"
- **Payments**: "What's our revenue?"
- **Recent activity**: "What happened today?"

What would you like to know?`},{keywords:["pipeline","breakdown","stages","stage"],response:`Here's your current pipeline breakdown (**1,247 total leads**):

| Stage | Count | % |
|-------|-------|---|
| New | 312 | 25% |
| Contacted | 287 | 23% |
| Visit | 184 | 15% |
| Test | 142 | 11% |
| Application | 98 | 8% |
| Applicant | 76 | 6% |
| Enrolled | 63 | 5% |
| Lost | 72 | 6% |
| Withdraw | 13 | 1% |

The biggest drop-off is between **Contacted → Visit** (36%). Would you like me to drill into a specific stage?`},{keywords:["how many","total","count","leads"],response:`Here's a quick snapshot of your leads:

- **Total leads**: 1,247
- **This month**: 186 new leads (+12% vs last month)
- **Uncontacted**: 94 leads waiting for first contact
- **Hot leads** (interested): 213

| Source | Count |
|--------|-------|
| Website | 412 |
| Instagram | 298 |
| Referral | 187 |
| Walk-in | 156 |
| Karnival | 112 |
| Other | 82 |

Want me to break this down by agent or time period?`},{keywords:["agent","performance","compare","top","leaderboard","ranking"],response:`Here's the **agent performance** leaderboard for this month:

| Rank | Agent | Leads | Enrolled | Conv. Rate | Contact Rate |
|------|-------|-------|----------|------------|-------------|
| 🥇 | Aldana | 87 | 14 | 16% | 94% |
| 🥈 | Fatima | 76 | 11 | 14% | 91% |
| 🥉 | Nasser | 68 | 9 | 13% | 88% |
| 4 | Sara | 72 | 8 | 11% | 85% |
| 5 | Ahmad | 61 | 7 | 11% | 82% |

**Aldana** is leading in both volume and conversion. **Fatima** has the most consistent contact rate. Want me to compare specific agents?`},{keywords:["conversion","funnel","rate","drop"],response:`Here's the **conversion funnel** (1,247 total leads):

| Stage | Reached | % of Total | Drop-off |
|-------|---------|------------|----------|
| New | 1,247 | 100% | - |
| Contacted | 935 | 75% | 25% |
| Visit | 598 | 48% | 36% |
| Test | 412 | 33% | 31% |
| Application | 287 | 23% | 30% |
| Applicant | 198 | 16% | 31% |
| Enrolled | 63 | 5% | 68% |

**Key insight**: The biggest drop-off is at the **Applicant → Enrolled** stage (68%). This suggests follow-up during the enrollment process needs improvement.

Would you like time-trend analysis or per-agent conversion rates?`},{keywords:["enrol","student","enrollment"],response:`We have **63 enrolled students** this cycle:

| Funding Type | Count | % |
|-------------|-------|---|
| Self-funded | 41 | 65% |
| PUC | 22 | 35% |

| Gender | Count | % |
|--------|-------|---|
| Male | 36 | 57% |
| Female | 27 | 43% |

**Top enrolling agents:**
1. Aldana: 14 students
2. Fatima: 11 students
3. Nasser: 9 students

Enrollment is up **18%** compared to the same period last cycle. Want a breakdown by major or placement level?`},{keywords:["payment","revenue","money","income","paid"],response:`Here's the **payment summary** (156 transactions):

| Status | Count | Amount |
|--------|-------|--------|
| Completed | 98 | 47,320.000 KWD |
| Pending | 34 | 16,400.000 KWD |
| Seat Reserved | 24 | 11,520.000 KWD |

**Total revenue**: **75,240.000 KWD**
**Average transaction**: 482.308 KWD

| Payment Method | Count |
|---------------|-------|
| MyFatoorah | 87 |
| Bank Transfer | 42 |
| Cash | 27 |

Revenue is trending **+22%** vs last month. Need a per-agent breakdown?`},{keywords:["recent","activity","today","latest","update","happened"],response:`Here's the latest CRM activity:

| Time | Lead | Action | Agent |
|------|------|--------|-------|
| 10 min ago | Mohammed A. | Moved to **Test** | Aldana |
| 25 min ago | Noura K. | Marked **Interested** | Fatima |
| 1 hr ago | Abdullah S. | Scheduled visit for Mar 18 | Nasser |
| 1 hr ago | Dana M. | **Enrolled** 🎉 | Sara |
| 2 hrs ago | Khaled R. | Payment received (250 KWD) | Ahmad |
| 2 hrs ago | Reem H. | Moved to **Application** | Fatima |
| 3 hrs ago | Yousef B. | First contact: Interested | Aldana |

**Today's highlights**: 3 stage changes, 1 enrollment, 1 payment, 12 calls made.

Want me to filter by a specific agent or stage?`},{keywords:["source","where","marketing","channel","campaign"],response:`Here's a breakdown of lead sources this month:

| Source | Leads | Enrolled | Conv. Rate |
|--------|-------|----------|------------|
| Website | 62 | 9 | 14.5% |
| Instagram | 48 | 6 | 12.5% |
| Referral | 31 | 7 | 22.6% |
| Walk-in | 24 | 5 | 20.8% |
| Karnival | 14 | 2 | 14.3% |
| WhatsApp | 7 | 1 | 14.3% |

**Best converting source**: **Referrals** at 22.6%. Word of mouth is strong!
**Highest volume**: **Website** with 62 leads.

Want me to compare this to previous months?`},{keywords:["lost","why","reason","losing"],response:`Here are the **lost lead reasons** (72 lost leads):

| Reason | Count | % |
|--------|-------|---|
| Not interested after follow-up | 21 | 29% |
| Chose competitor (AUM) | 14 | 19% |
| Chose competitor (GUST) | 9 | 13% |
| Financial constraints | 11 | 15% |
| No response after 5+ attempts | 8 | 11% |
| Academic requirements not met | 5 | 7% |
| Other | 4 | 6% |

**Key insight**: **32%** of losses are to competitors (AUM + GUST). The team could benefit from a competitive comparison sheet for follow-ups.

Want me to show which stage leads are most commonly lost at?`},{keywords:["appointment","calendar","schedule","visit","meeting"],response:`Here's the **appointment overview** for this week:

| Day | Scheduled | Completed | No-show |
|-----|-----------|-----------|--------|
| Sunday | 8 | 6 | 2 |
| Monday | 12 | 10 | 2 |
| Tuesday | 9 | 7 | 2 |
| Wednesday | 11 | - | - |
| Thursday | 6 | - | - |

**This week**: 46 appointments scheduled, 23 completed so far
**Show rate**: 77% (above 75% target ✅)

| Type | Count |
|------|-------|
| Campus Visit | 28 |
| Placement Test | 12 |
| Online Consultation | 6 |

Want me to show per-agent appointment stats?`}];async function m(a,b){let{createUIMessageStream:d,createUIMessageStreamResponse:e}=await c.e(8497).then(c.bind(c,78497)),f=crypto.randomUUID();return e({headers:{"X-Conversation-Id":b},stream:d({async execute({writer:b}){b.write({type:"text-start",id:f});for(let c=0;c<a.length;c+=12)b.write({type:"text-delta",id:f,delta:a.slice(c,c+12)});b.write({type:"text-end",id:f})}})})}},19121:a=>{"use strict";a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},19225:(a,b,c)=>{"use strict";a.exports=c(44870)},21820:a=>{"use strict";a.exports=require("os")},26151:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>z,patchFetch:()=>y,routeModule:()=>u,serverHooks:()=>x,workAsyncStorage:()=>v,workUnitAsyncStorage:()=>w});var d=c(19225),e=c(84006),f=c(8317),g=c(99373),h=c(34775),i=c(24235),j=c(261),k=c(54365),l=c(90771),m=c(73461),n=c(67798),o=c(92280),p=c(62018),q=c(45696),r=c(47929),s=c(86439),t=c(37527);let u=new d.AppRouteRouteModule({definition:{kind:e.RouteKind.APP_ROUTE,page:"/api/chat/route",pathname:"/api/chat",filename:"route",bundlePath:"app/api/chat/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"/home/taha/Desktop/ourprojects/frontend/app/api/chat/route.ts",nextConfigOutput:"standalone",userland:()=>c(14757),...{}}),{workAsyncStorage:v,workUnitAsyncStorage:w,serverHooks:x}=u;function y(){return(0,f.patchFetch)({workAsyncStorage:v,workUnitAsyncStorage:w})}async function z(a,b,c){c.requestMeta&&(0,g.setRequestMeta)(a,c.requestMeta),u.isDev&&(0,g.addRequestMeta)(a,"devRequestTimingInternalsEnd",process.hrtime.bigint());let d="/api/chat/route";"/index"===d&&(d="/");let f=await u.prepare(a,b,{srcPage:d,multiZoneDraftMode:!1});if(!f)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:v,deploymentId:w,params:x,nextConfig:y,parsedUrl:z,isDraftMode:A,prerenderManifest:B,routerServerContext:C,isOnDemandRevalidate:D,revalidateOnlyGenerated:E,resolvedPathname:F,clientReferenceManifest:G,serverActionsManifest:H}=f,I=(0,j.normalizeAppPath)(d),J=!!(B.dynamicRoutes[I]||B.routes[F]),K=async()=>((null==C?void 0:C.render404)?await C.render404(a,b,z,!1):b.end("This page could not be found"),null);if(J&&!A){let a=!!B.routes[F],b=B.dynamicRoutes[I];if(b&&!1===b.fallback&&!a){if(y.adapterPath)return await K();throw new s.NoFallbackError}}let L=null;!J||u.isDev||A||(L="/index"===(L=F)?"/":L);let M=!0===u.isDev||!J,N=J&&!M;H&&G&&(0,i.setManifestsSingleton)({page:d,clientReferenceManifest:G,serverActionsManifest:H});let O=a.method||"GET",P=(0,h.getTracer)(),Q=P.getActiveScopeSpan(),R=!!(null==C?void 0:C.isWrappedByNextServer),S=!!(0,g.getRequestMeta)(a,"minimalMode"),T=(0,g.getRequestMeta)(a,"incrementalCache")||await u.getIncrementalCache(a,y,B,S);null==T||T.resetRequestCache(),globalThis.__incrementalCache=T;let U={params:x,previewProps:B.preview,renderOpts:{experimental:{authInterrupts:!!y.experimental.authInterrupts,useCacheTimeout:y.experimental.useCacheTimeout},cacheComponents:!!y.cacheComponents,validationLevel:y.experimental.instantInsights.validationLevel,supportsDynamicResponse:M,incrementalCache:T,hmrRefreshHash:(0,g.getRequestMeta)(a,"hmrRefreshHash"),cacheLifeProfiles:y.cacheLife,staticPageGenerationTimeout:y.staticPageGenerationTimeout,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d,e)=>u.onRequestError(a,b,d,e,C)},sharedContext:{buildId:v,deploymentId:w}},V=new k.NodeNextRequest(a),W=new k.NodeNextResponse(b),X=l.NextRequestAdapter.fromNodeNextRequest(V,(0,l.signalFromNodeResponse)(b)),Y=async({previousCacheEntry:e})=>{try{if(!S&&D&&E&&!e)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let d=await u.handle(X,U);a.fetchMetrics=U.renderOpts.fetchMetrics;let f=U.renderOpts.pendingWaitUntil;f&&c.waitUntil&&(c.waitUntil(f),f=void 0);let g=U.renderOpts.collectedTags;if(!J)return await (0,o.I)(V,W,d,f),null;{let a=await d.blob(),b=(0,p.toNodeOutgoingHttpHeaders)(d.headers);g&&(b[r.NEXT_CACHE_TAGS_HEADER]=g),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==U.renderOpts.collectedRevalidate&&!(U.renderOpts.collectedRevalidate>=r.INFINITE_CACHE)&&U.renderOpts.collectedRevalidate,e=void 0===U.renderOpts.collectedExpire||U.renderOpts.collectedExpire>=r.INFINITE_CACHE?!1!==c&&c>0?y.expireTime:void 0:U.renderOpts.collectedExpire;return{value:{kind:t.CachedRouteKind.APP_ROUTE,status:d.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:e}}}}catch(b){throw(null==e?void 0:e.isStale)&&await u.onRequestError(a,b,{routerKind:"App Router",routePath:d,routeType:"route",revalidateReason:(0,n.getRevalidateReason)({isStaticGeneration:N,isOnDemandRevalidate:D})},!1,C),b}},Z=async(d,f)=>{try{var g,i;let d=await u.handleResponse({req:a,nextConfig:y,cacheKey:L,routeKind:e.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:B,isRoutePPREnabled:!1,isOnDemandRevalidate:D,revalidateOnlyGenerated:E,responseGenerator:Y,waitUntil:c.waitUntil,isMinimalMode:S});if(!J)return;if((null==d||null==(g=d.value)?void 0:g.kind)!==t.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(i=d.value)?void 0:i.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});S||b.setHeader("x-nextjs-cache",D?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),A&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let f=(0,p.fromNodeOutgoingHttpHeaders)(d.value.headers);S&&J||f.delete(r.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||b.getHeader("Cache-Control")||f.get("Cache-Control")||f.set("Cache-Control",(0,q.getCacheControlHeader)(d.cacheControl)),await (0,o.I)(V,W,new Response(d.value.body,{headers:f,status:d.value.status||200}));return}catch(b){if(b instanceof s.NoFallbackError||await u.onRequestError(a,b,{routerKind:"App Router",routePath:I,routeType:"route",revalidateReason:(0,n.getRevalidateReason)({isStaticGeneration:N,isOnDemandRevalidate:D})},!1,C),J)throw b;await (0,o.I)(V,W,new Response(null,{status:500}));return}finally{(()=>{if(!d)return;let a=b.statusCode;d.setAttributes({"http.status_code":a,"next.rsc":!1}),a&&a>=500&&(d.setStatus({code:h.SpanStatusCode.ERROR}),d.setAttribute("error.type",a.toString()));let c=P.getRootSpanAttributes();if(!c)return;if(c.get("next.span_type")!==m.BaseServerSpan.handleRequest)return console.warn(`Unexpected root span type '${c.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=c.get("next.route")||I,g=`${O} ${e}`;d.setAttributes({"next.route":e,"http.route":e,"next.span_name":g}),d.updateName(g),f&&f!==d&&(f.setAttribute("http.route",e),f.updateName(g))})()}};if(R&&Q)await Z(Q,void 0);else{let b=P.getActiveScopeSpan();await P.withPropagatedContext(a.headers,()=>P.trace(m.BaseServerSpan.handleRequest,{spanName:`${O} ${d}`,kind:h.SpanKind.SERVER,attributes:{"http.method":O,"http.target":a.url}},a=>Z(a,b)),void 0,!R)}}},29021:a=>{"use strict";a.exports=require("fs")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},33873:a=>{"use strict";a.exports=require("path")},44014:(a,b,c)=>{"use strict";c.d(b,{c:()=>h,i:()=>g});var d=c(49827),e=c(88617);let f=new Map;async function g(a,b){let c,g=(c=`${b.interval}:${b.limit}`,f.has(c)||f.set(c,function(a){let b=process.env.UPSTASH_REDIS_REST_URL,c=process.env.UPSTASH_REDIS_REST_TOKEN;if(!b||!c)return null;let f=new e.Qd({url:b,token:c}),g=Math.round(a.interval/1e3),h=g>=60?`${Math.round(g/60)} m`:`${g} s`;return new d.Ratelimit({redis:f,limiter:d.Ratelimit.slidingWindow(a.limit,h),analytics:!0,prefix:"ktech-rl"})}(b)),f.get(c));if(!g)return console.error("[Rate Limit] Upstash not configured in production — denying request (fail closed)"),{success:!1,remaining:0,resetIn:b.interval};let h=await g.limit(a);return{success:h.success,remaining:h.remaining,resetIn:Math.max(0,h.reset-Date.now())}}let h={whatsapp:{interval:6e4,limit:10},payment:{interval:6e4,limit:5},import:{interval:3e5,limit:3},"ministry-import":{interval:3e5,limit:120},"enroll-from-list":{interval:3e5,limit:3},export:{interval:6e4,limit:5},"ai-transfer":{interval:6e4,limit:30},"ai-chat":{interval:6e4,limit:20},api:{interval:6e4,limit:60},"civil-id-extract":{interval:6e4,limit:10},"psp-self-service":{interval:6e4,limit:30},"lms-sync":{interval:6e4,limit:10}}},44870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},72880:(a,b,c)=>{"use strict";c.d(b,{HK:()=>j,VM:()=>i,zw:()=>g});var d=c(74968),e=c(59287),f=c(65573);async function g(){let a=await (0,f.UL)();return(0,d.createServerClient)(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll:()=>a.getAll(),setAll(b){try{b.forEach(({name:b,value:c,options:d})=>a.set(b,c,d))}catch{}}}})}let h=(0,c(16949).unstable_cache)(async a=>{let b=j(),{data:c}=await b.from("profiles").select("id, email, full_name, full_name_ar, role, avatar_url, phone, is_active, monthly_target, created_at, updated_at").eq("id",a).single();return c??null},["user-profile"],{revalidate:300});async function i(){try{let a=await g(),{data:b,error:c}=await a.auth.getClaims(),d=b?.claims?.sub;if(c||!d)return null;try{let a=await h(d);if(a)return a}catch{}let{data:e}=await a.from("profiles").select("id, email, full_name, full_name_ar, role, avatar_url, phone, is_active, monthly_target, created_at, updated_at").eq("id",d).single();return e}catch(a){return console.error("Failed to get user profile:",a),null}}function j(){let a=process.env.NEXT_PUBLIC_SUPABASE_URL,b=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!a||!b)throw Error("Missing Supabase service role configuration");return(0,e.UU)(a,b,{auth:{autoRefreshToken:!1,persistSession:!1}})}},77598:a=>{"use strict";a.exports=require("node:crypto")},78335:()=>{},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},92280:(a,b,c)=>{"use strict";Object.defineProperty(b,"I",{enumerable:!0,get:function(){return g}});let d=c(28208),e=c(47617),f=c(62018);async function g(a,b,c,g){if((0,d.isNodeNextResponse)(b)){var h;b.statusCode=c.status,b.statusMessage=c.statusText;let d=["set-cookie","www-authenticate","proxy-authenticate","vary"];null==(h=c.headers)||h.forEach((a,c)=>{if("x-middleware-set-cookie"!==c.toLowerCase())if("set-cookie"===c.toLowerCase())for(let d of(0,f.splitCookiesString)(a))b.appendHeader(c,d);else{let e=void 0!==b.getHeader(c);(d.includes(c.toLowerCase())||!e)&&b.appendHeader(c,a)}});let{originalResponse:i}=b;c.body&&"HEAD"!==a.method?await (0,e.pipeToNodeResponse)(c.body,i,g):i.end()}}},92612:(a,b,c)=>{"use strict";c.d(b,{h:()=>e,y:()=>f});let d=new Set(["phone","phone_number","phonenumber","mobile","email","civil_id","civilid","national_id","nationalid","passport","card_number","cardnumber","card_cvv","cvv","password","token","access_token","refresh_token","authorization","cookie","set-cookie","api_key","apikey","secret","client_secret","webhook_secret"]);function e(a,b){let c=b||crypto.randomUUID().slice(0,8);function e(b,e,f){let g=JSON.stringify({level:b,context:a,message:e,requestId:c,data:f?function a(b){let c={};for(let[e,f]of Object.entries(b))c[e]=function b(c,e){if(d.has(c.toLowerCase()))return"[REDACTED]";if(null==e)return e;if(Array.isArray(e))return e.map(a=>b("",a));if("object"==typeof e){let b=Object.getPrototypeOf(e);if(b===Object.prototype||null===b)return a(e);if(e instanceof Error)return{name:e.name,message:e.message,stack:e.stack}}return e}(e,f);return c}(f):f,timestamp:new Date().toISOString()});switch(b){case"debug":break;case"info":console.log(g);break;case"warn":console.warn(g);break;case"error":console.error(g)}}return{debug:(a,b)=>e("debug",a,b),info:(a,b)=>e("info",a,b),warn:(a,b)=>e("warn",a,b),error:(a,b)=>e("error",a,b),requestId:c}}function f(a,b,c){return Response.json({error:a,requestId:c.requestId},{status:b})}},96487:()=>{},98797:(a,b,c)=>{"use strict";c.d(b,{N:()=>g});var d=c(72880),e=c(92612);function f(a,b){let c;if("GET"===a.method||"HEAD"===a.method||"OPTIONS"===a.method)return null;let d=a.headers.get("origin"),f=a.headers.get("referer"),g=d||f;if(!g)return b.warn("Blocked: missing Origin and Referer on state-changing request",{method:a.method,pathname:a.nextUrl.pathname}),(0,e.y)("Forbidden: missing Origin",403,b);try{c=new URL(g).host}catch{return(0,e.y)("Forbidden: malformed Origin",403,b)}let h=a.nextUrl.host;if(c===h)return null;let i=process.env.NEXT_PUBLIC_APP_URL;if(i)try{if(c===new URL(i).host)return null}catch{}let j=process.env.ALLOWED_ORIGIN_HOSTS;return j&&j.split(",").map(a=>a.trim()).filter(Boolean).includes(c)?null:(b.warn("Blocked: cross-origin state-changing request",{method:a.method,pathname:a.nextUrl.pathname,sourceHost:c,requestHost:h}),(0,e.y)("Forbidden: cross-origin",403,b))}function g(a,b){return async c=>{let g=(0,e.h)(a.context),h=Date.now();g.info("Request received",{method:c.method,url:c.nextUrl.pathname});try{if(!1===a.requireAuth){if(!a.skipOriginCheck){let a=f(c,g);if(a)return a}let d=await b({req:c,logger:g});return g.info("Request completed",{status:d.status,durationMs:Date.now()-h}),d}let i=f(c,g);if(i)return i;let j=await (0,d.zw)(),{data:{user:k},error:l}=await j.auth.getUser();if(l||!k)return g.warn("Unauthorized request"),(0,e.y)("Unauthorized",401,g);let{data:m}=await j.from("profiles").select("role, is_active").eq("id",k.id).single();if(m?.is_active===!1)return g.warn("Forbidden: deactivated account",{userId:k.id}),(0,e.y)("Account deactivated",403,g);let n={role:m?.role??"agent",is_active:m?.is_active??null};if("roles"in a&&a.roles&&a.roles.length>0&&!a.roles.includes(n.role))return g.warn("Forbidden: insufficient role",{userId:k.id,role:n.role,requiredRoles:a.roles}),(0,e.y)("Forbidden",403,g);let o=await b({req:c,supabase:j,user:k,profile:n,logger:g});return g.info("Request completed",{status:o.status,durationMs:Date.now()-h}),o}catch(a){return g.error("Unhandled error",{error:a instanceof Error?a.message:String(a),stack:a instanceof Error?a.stack:void 0,durationMs:Date.now()-h}),(0,e.y)("Internal server error",500,g)}}}}};var b=require("../../../webpack-runtime.js");b.C(a);var c=b.X(0,[3445,3115,9287,3462,8617,9827,7405],()=>b(b.s=26151));module.exports=c})();