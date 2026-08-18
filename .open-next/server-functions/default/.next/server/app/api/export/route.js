"use strict";(()=>{var a={};a.id=5620,a.ids=[5620],a.modules={261:a=>{a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},8128:a=>{a.exports=require("next/dist/server/runtime-reacts.external.js")},10846:a=>{a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19121:a=>{a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},29294:a=>{a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},40291:(a,b,c)=>{c.r(b),c.d(b,{handler:()=>z,patchFetch:()=>y,routeModule:()=>u,serverHooks:()=>x,workAsyncStorage:()=>v,workUnitAsyncStorage:()=>w});var d=c(19225),e=c(84006),f=c(8317),g=c(99373),h=c(34775),i=c(24235),j=c(261),k=c(54365),l=c(90771),m=c(73461),n=c(67798),o=c(92280),p=c(62018),q=c(45696),r=c(47929),s=c(86439),t=c(37527);let u=new d.AppRouteRouteModule({definition:{kind:e.RouteKind.APP_ROUTE,page:"/api/export/route",pathname:"/api/export",filename:"route",bundlePath:"app/api/export/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"/home/taha/Desktop/ourprojects/frontend/app/api/export/route.ts",nextConfigOutput:"standalone",userland:()=>c(77227),...{}}),{workAsyncStorage:v,workUnitAsyncStorage:w,serverHooks:x}=u;function y(){return(0,f.patchFetch)({workAsyncStorage:v,workUnitAsyncStorage:w})}async function z(a,b,c){c.requestMeta&&(0,g.setRequestMeta)(a,c.requestMeta),u.isDev&&(0,g.addRequestMeta)(a,"devRequestTimingInternalsEnd",process.hrtime.bigint());let d="/api/export/route";"/index"===d&&(d="/");let f=await u.prepare(a,b,{srcPage:d,multiZoneDraftMode:!1});if(!f)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:v,deploymentId:w,params:x,nextConfig:y,parsedUrl:z,isDraftMode:A,prerenderManifest:B,routerServerContext:C,isOnDemandRevalidate:D,revalidateOnlyGenerated:E,resolvedPathname:F,clientReferenceManifest:G,serverActionsManifest:H}=f,I=(0,j.normalizeAppPath)(d),J=!!(B.dynamicRoutes[I]||B.routes[F]),K=async()=>((null==C?void 0:C.render404)?await C.render404(a,b,z,!1):b.end("This page could not be found"),null);if(J&&!A){let a=!!B.routes[F],b=B.dynamicRoutes[I];if(b&&!1===b.fallback&&!a){if(y.adapterPath)return await K();throw new s.NoFallbackError}}let L=null;!J||u.isDev||A||(L="/index"===(L=F)?"/":L);let M=!0===u.isDev||!J,N=J&&!M;H&&G&&(0,i.setManifestsSingleton)({page:d,clientReferenceManifest:G,serverActionsManifest:H});let O=a.method||"GET",P=(0,h.getTracer)(),Q=P.getActiveScopeSpan(),R=!!(null==C?void 0:C.isWrappedByNextServer),S=!!(0,g.getRequestMeta)(a,"minimalMode"),T=(0,g.getRequestMeta)(a,"incrementalCache")||await u.getIncrementalCache(a,y,B,S);null==T||T.resetRequestCache(),globalThis.__incrementalCache=T;let U={params:x,previewProps:B.preview,renderOpts:{experimental:{authInterrupts:!!y.experimental.authInterrupts,useCacheTimeout:y.experimental.useCacheTimeout},cacheComponents:!!y.cacheComponents,validationLevel:y.experimental.instantInsights.validationLevel,supportsDynamicResponse:M,incrementalCache:T,hmrRefreshHash:(0,g.getRequestMeta)(a,"hmrRefreshHash"),cacheLifeProfiles:y.cacheLife,staticPageGenerationTimeout:y.staticPageGenerationTimeout,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d,e)=>u.onRequestError(a,b,d,e,C)},sharedContext:{buildId:v,deploymentId:w}},V=new k.NodeNextRequest(a),W=new k.NodeNextResponse(b),X=l.NextRequestAdapter.fromNodeNextRequest(V,(0,l.signalFromNodeResponse)(b)),Y=async({previousCacheEntry:e})=>{try{if(!S&&D&&E&&!e)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let d=await u.handle(X,U);a.fetchMetrics=U.renderOpts.fetchMetrics;let f=U.renderOpts.pendingWaitUntil;f&&c.waitUntil&&(c.waitUntil(f),f=void 0);let g=U.renderOpts.collectedTags;if(!J)return await (0,o.I)(V,W,d,f),null;{let a=await d.blob(),b=(0,p.toNodeOutgoingHttpHeaders)(d.headers);g&&(b[r.NEXT_CACHE_TAGS_HEADER]=g),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==U.renderOpts.collectedRevalidate&&!(U.renderOpts.collectedRevalidate>=r.INFINITE_CACHE)&&U.renderOpts.collectedRevalidate,e=void 0===U.renderOpts.collectedExpire||U.renderOpts.collectedExpire>=r.INFINITE_CACHE?!1!==c&&c>0?y.expireTime:void 0:U.renderOpts.collectedExpire;return{value:{kind:t.CachedRouteKind.APP_ROUTE,status:d.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:e}}}}catch(b){throw(null==e?void 0:e.isStale)&&await u.onRequestError(a,b,{routerKind:"App Router",routePath:d,routeType:"route",revalidateReason:(0,n.getRevalidateReason)({isStaticGeneration:N,isOnDemandRevalidate:D})},!1,C),b}},Z=async(d,f)=>{try{var g,i;let d=await u.handleResponse({req:a,nextConfig:y,cacheKey:L,routeKind:e.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:B,isRoutePPREnabled:!1,isOnDemandRevalidate:D,revalidateOnlyGenerated:E,responseGenerator:Y,waitUntil:c.waitUntil,isMinimalMode:S});if(!J)return;if((null==d||null==(g=d.value)?void 0:g.kind)!==t.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(i=d.value)?void 0:i.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});S||b.setHeader("x-nextjs-cache",D?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),A&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let f=(0,p.fromNodeOutgoingHttpHeaders)(d.value.headers);S&&J||f.delete(r.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||b.getHeader("Cache-Control")||f.get("Cache-Control")||f.set("Cache-Control",(0,q.getCacheControlHeader)(d.cacheControl)),await (0,o.I)(V,W,new Response(d.value.body,{headers:f,status:d.value.status||200}));return}catch(b){if(b instanceof s.NoFallbackError||await u.onRequestError(a,b,{routerKind:"App Router",routePath:I,routeType:"route",revalidateReason:(0,n.getRevalidateReason)({isStaticGeneration:N,isOnDemandRevalidate:D})},!1,C),J)throw b;await (0,o.I)(V,W,new Response(null,{status:500}));return}finally{(()=>{if(!d)return;let a=b.statusCode;d.setAttributes({"http.status_code":a,"next.rsc":!1}),a&&a>=500&&(d.setStatus({code:h.SpanStatusCode.ERROR}),d.setAttribute("error.type",a.toString()));let c=P.getRootSpanAttributes();if(!c)return;if(c.get("next.span_type")!==m.BaseServerSpan.handleRequest)return console.warn(`Unexpected root span type '${c.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=c.get("next.route")||I,g=`${O} ${e}`;d.setAttributes({"next.route":e,"http.route":e,"next.span_name":g}),d.updateName(g),f&&f!==d&&(f.setAttribute("http.route",e),f.updateName(g))})()}};if(R&&Q)await Z(Q,void 0);else{let b=P.getActiveScopeSpan();await P.withPropagatedContext(a.headers,()=>P.trace(m.BaseServerSpan.handleRequest,{spanName:`${O} ${d}`,kind:h.SpanKind.SERVER,attributes:{"http.method":O,"http.target":a.url}},a=>Z(a,b)),void 0,!R)}}},44014:(a,b,c)=>{c.d(b,{c:()=>h,i:()=>g});var d=c(49827),e=c(88617);let f=new Map;async function g(a,b){let c,g=(c=`${b.interval}:${b.limit}`,f.has(c)||f.set(c,function(a){let b=process.env.UPSTASH_REDIS_REST_URL,c=process.env.UPSTASH_REDIS_REST_TOKEN;if(!b||!c)return null;let f=new e.Qd({url:b,token:c}),g=Math.round(a.interval/1e3),h=g>=60?`${Math.round(g/60)} m`:`${g} s`;return new d.Ratelimit({redis:f,limiter:d.Ratelimit.slidingWindow(a.limit,h),analytics:!0,prefix:"ktech-rl"})}(b)),f.get(c));if(!g)return console.error("[Rate Limit] Upstash not configured in production — denying request (fail closed)"),{success:!1,remaining:0,resetIn:b.interval};let h=await g.limit(a);return{success:h.success,remaining:h.remaining,resetIn:Math.max(0,h.reset-Date.now())}}let h={whatsapp:{interval:6e4,limit:10},payment:{interval:6e4,limit:5},import:{interval:3e5,limit:3},"ministry-import":{interval:3e5,limit:120},"enroll-from-list":{interval:3e5,limit:3},export:{interval:6e4,limit:5},"ai-transfer":{interval:6e4,limit:30},"ai-chat":{interval:6e4,limit:20},api:{interval:6e4,limit:60},"civil-id-extract":{interval:6e4,limit:10},"psp-self-service":{interval:6e4,limit:30},"lms-sync":{interval:6e4,limit:10}}},44870:a=>{a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},63033:a=>{a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},77227:(a,b,c)=>{c.r(b),c.d(b,{POST:()=>l});var d=c(23211),e=c(98797);function f(a){return a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function g(a){return a.includes(",")||a.includes('"')||a.includes("\n")||a.includes("\r")?`"${a.replace(/"/g,'""')}"`:a}var h=c(40686),i=c(44014);let j=[{key:"name",label:"Name",width:160},{key:"phone",label:"Phone",width:100},{key:"email",label:"Email",width:180},{key:"civil_id",label:"Civil ID",width:120},{key:"stage",label:"Stage",width:120},{key:"status",label:"Status",width:120},{key:"source",label:"Source",width:120},{key:"funding_type",label:"Funding",width:100},{key:"assigned_to_name",label:"Assigned To",width:140},{key:"created_at",label:"Created",width:120}];function k(a){return h.L2.find(b=>b.value===a)?.label??a}let l=(0,e.N)({context:"export",roles:["admin"]},async({req:a,supabase:b,user:c,logger:e})=>{var l,m;let n,o=await (0,i.i)(`export:${c.id}`,i.c.export);if(!o.success)return d.NextResponse.json({error:"Rate limit exceeded. Try again later."},{status:429,headers:{"Retry-After":String(Math.ceil(o.resetIn/1e3))}});let{type:p,entity:q,filters:r}=await a.json();if(!p||!["pdf","csv"].includes(p))return d.NextResponse.json({error:"Invalid export type. Only PDF and CSV are supported."},{status:400});if(!q||!["leads","reports"].includes(q))return d.NextResponse.json({error:"Invalid entity"},{status:400});if("leads"===q){let a=b.from("leads").select("*, profiles!leads_assigned_to_fkey(full_name)").order("created_at",{ascending:!1}).limit(5e3);r?.pipeline_stage&&(a=a.eq("pipeline_stage",r.pipeline_stage)),r?.status&&(a=a.eq("status",r.status)),r?.assigned_to&&(a=a.eq("assigned_to",r.assigned_to)),r?.source&&(a=a.eq("source",r.source)),r?.funding_type&&(a=a.eq("funding_type",r.funding_type)),r?.date_from&&(a=a.gte("created_at",r.date_from)),r?.date_to&&(a=a.lte("created_at",r.date_to));let{data:c,error:f}=await a;if(f)return e.error("Failed to fetch leads for export",{error:f.message}),d.NextResponse.json({error:"Failed to fetch data"},{status:500});let g=(c??[]).map(a=>({...a,assigned_to_name:a.profiles?.full_name??""})),i={"Total Records":String(g.length)};r?.pipeline_stage&&(i.Stage=k(r.pipeline_stage)),(r?.date_from||r?.date_to)&&(i["Date Range"]=[r.date_from,r.date_to].filter(Boolean).join(" to ")),n={title:"Leads Export",subtitle:r?.pipeline_stage?`Stage: ${k(r.pipeline_stage)}`:"All Leads",columns:j,rows:g.map(a=>{var b;return{name:`${a.first_name_ar||""} ${a.last_name_ar||""}`.trim(),phone:a.phone,email:a.email??"",civil_id:a.civil_id??"",stage:k(a.pipeline_stage),status:a.status?(b=a.status,h.OD.find(a=>a.value===b)?.label??b):"",source:a.source??"",funding_type:a.funding_type??"",assigned_to_name:a.assigned_to_name??"",created_at:a.created_at?new Date(a.created_at).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}):""}}),metadata:i}}else n={title:"Reports Export",subtitle:"CRM Report Data",columns:[{key:"metric",label:"Metric",width:200},{key:"value",label:"Value",width:150}],rows:[],metadata:{"Generated At":new Date().toISOString()}};switch(e.info("Generating export",{type:p,entity:q,rowCount:n.rows.length}),p){case"pdf":{let a,b,c,d;return new Response((l=n,a=new Date().toLocaleString("en-US",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"}),b=l.metadata?Object.entries(l.metadata).map(([a,b])=>`<div class="meta-item"><strong>${f(a)}:</strong> ${f(b)}</div>`).join(""):"",c=l.columns.map(a=>{let b=a.width?` style="width:${a.width}px"`:"";return`<th${b}>${f(a.label)}</th>`}).join(""),d=l.rows.map(a=>{let b=l.columns.map(b=>{let c=a[b.key];return`<td>${null!=c?f(String(c)):""}</td>`}).join("");return`<tr>${b}</tr>`}).join(""),`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${f(l.title)} - ADL</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a1a1a;
      padding: 40px;
      font-size: 12px;
      line-height: 1.4;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 3px solid #0f172a;
    }

    .brand h1 {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.5px;
    }

    .brand p {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }

    .report-info {
      text-align: right;
    }

    .report-info h2 {
      font-size: 16px;
      font-weight: 600;
      color: #334155;
    }

    .report-info .subtitle {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }

    .metadata {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 20px;
      padding: 12px 16px;
      background: #f8fafc;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }

    .meta-item {
      font-size: 11px;
      color: #475569;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }

    th {
      background: #0f172a;
      color: #fff;
      padding: 8px 10px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    td {
      padding: 7px 10px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11px;
    }

    tr:nth-child(even) {
      background: #f8fafc;
    }

    .footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #94a3b8;
    }

    @media print {
      body { padding: 20px; }

      .header { break-after: avoid; }

      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
      thead { display: table-header-group; }

      @page {
        size: A4 landscape;
        margin: 15mm;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>ktech</h1>
      <p>Customer Relationship Management</p>
    </div>
    <div class="report-info">
      <h2>${f(l.title)}</h2>
      ${l.subtitle?`<div class="subtitle">${f(l.subtitle)}</div>`:""}
    </div>
  </div>

  ${b?`<div class="metadata">${b}</div>`:""}

  <table>
    <thead>
      <tr>${c}</tr>
    </thead>
    <tbody>
      ${d}
    </tbody>
  </table>

  <div class="footer">
    <span>Generated on ${f(a)}</span>
    <span>Total Records: ${l.rows.length}</span>
  </div>
</body>
</html>`),{headers:{"Content-Type":"text/html; charset=utf-8","Content-Disposition":`attachment; filename="${q}-export.html"`}})}case"csv":return new Response("\uFEFF"+[(m=n).columns.map(a=>g(a.label)).join(","),...m.rows.map(a=>m.columns.map(b=>{let c=a[b.key];return null==c?"":g(String(c))}).join(","))].join("\n"),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="${q}-export.csv"`}});default:return d.NextResponse.json({error:"Unsupported export type"},{status:400})}})},77598:a=>{a.exports=require("node:crypto")},86439:a=>{a.exports=require("next/dist/shared/lib/no-fallback-error.external")},92612:(a,b,c)=>{c.d(b,{h:()=>e,y:()=>f});let d=new Set(["phone","phone_number","phonenumber","mobile","email","civil_id","civilid","national_id","nationalid","passport","card_number","cardnumber","card_cvv","cvv","password","token","access_token","refresh_token","authorization","cookie","set-cookie","api_key","apikey","secret","client_secret","webhook_secret"]);function e(a,b){let c=b||crypto.randomUUID().slice(0,8);function e(b,e,f){let g=JSON.stringify({level:b,context:a,message:e,requestId:c,data:f?function a(b){let c={};for(let[e,f]of Object.entries(b))c[e]=function b(c,e){if(d.has(c.toLowerCase()))return"[REDACTED]";if(null==e)return e;if(Array.isArray(e))return e.map(a=>b("",a));if("object"==typeof e){let b=Object.getPrototypeOf(e);if(b===Object.prototype||null===b)return a(e);if(e instanceof Error)return{name:e.name,message:e.message,stack:e.stack}}return e}(e,f);return c}(f):f,timestamp:new Date().toISOString()});switch(b){case"debug":break;case"info":console.log(g);break;case"warn":console.warn(g);break;case"error":console.error(g)}}return{debug:(a,b)=>e("debug",a,b),info:(a,b)=>e("info",a,b),warn:(a,b)=>e("warn",a,b),error:(a,b)=>e("error",a,b),requestId:c}}function f(a,b,c){return Response.json({error:a,requestId:c.requestId},{status:b})}},98797:(a,b,c)=>{c.d(b,{N:()=>g});var d=c(72880),e=c(92612);function f(a,b){let c;if("GET"===a.method||"HEAD"===a.method||"OPTIONS"===a.method)return null;let d=a.headers.get("origin"),f=a.headers.get("referer"),g=d||f;if(!g)return b.warn("Blocked: missing Origin and Referer on state-changing request",{method:a.method,pathname:a.nextUrl.pathname}),(0,e.y)("Forbidden: missing Origin",403,b);try{c=new URL(g).host}catch{return(0,e.y)("Forbidden: malformed Origin",403,b)}let h=a.nextUrl.host;if(c===h)return null;let i=process.env.NEXT_PUBLIC_APP_URL;if(i)try{if(c===new URL(i).host)return null}catch{}let j=process.env.ALLOWED_ORIGIN_HOSTS;return j&&j.split(",").map(a=>a.trim()).filter(Boolean).includes(c)?null:(b.warn("Blocked: cross-origin state-changing request",{method:a.method,pathname:a.nextUrl.pathname,sourceHost:c,requestHost:h}),(0,e.y)("Forbidden: cross-origin",403,b))}function g(a,b){return async c=>{let g=(0,e.h)(a.context),h=Date.now();g.info("Request received",{method:c.method,url:c.nextUrl.pathname});try{if(!1===a.requireAuth){if(!a.skipOriginCheck){let a=f(c,g);if(a)return a}let d=await b({req:c,logger:g});return g.info("Request completed",{status:d.status,durationMs:Date.now()-h}),d}let i=f(c,g);if(i)return i;let j=await (0,d.zw)(),{data:{user:k},error:l}=await j.auth.getUser();if(l||!k)return g.warn("Unauthorized request"),(0,e.y)("Unauthorized",401,g);let{data:m}=await j.from("profiles").select("role, is_active").eq("id",k.id).single();if(m?.is_active===!1)return g.warn("Forbidden: deactivated account",{userId:k.id}),(0,e.y)("Account deactivated",403,g);let n={role:m?.role??"agent",is_active:m?.is_active??null};if("roles"in a&&a.roles&&a.roles.length>0&&!a.roles.includes(n.role))return g.warn("Forbidden: insufficient role",{userId:k.id,role:n.role,requiredRoles:a.roles}),(0,e.y)("Forbidden",403,g);let o=await b({req:c,supabase:j,user:k,profile:n,logger:g});return g.info("Request completed",{status:o.status,durationMs:Date.now()-h}),o}catch(a){return g.error("Unhandled error",{error:a instanceof Error?a.message:String(a),stack:a instanceof Error?a.stack:void 0,durationMs:Date.now()-h}),(0,e.y)("Internal server error",500,g)}}}}};var b=require("../../../webpack-runtime.js");b.C(a);var c=b.X(0,[3445,3115,9287,1813,3462,8617,9827,5496],()=>b(b.s=40291));module.exports=c})();