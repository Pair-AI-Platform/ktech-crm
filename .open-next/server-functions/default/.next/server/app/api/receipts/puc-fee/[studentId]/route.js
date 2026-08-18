"use strict";(()=>{var a={};a.id=7230,a.ids=[7230],a.modules={261:a=>{a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},8128:a=>{a.exports=require("next/dist/server/runtime-reacts.external.js")},10846:a=>{a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},17305:(a,b,c)=>{function d(a){return`${a.getFullYear()}-${String(a.getMonth()+1).padStart(2,"0")}-${String(a.getDate()).padStart(2,"0")}`}function e(a){return a?a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"):""}c.d(b,{HN:()=>d,ZD:()=>e}),c(53858)},19121:a=>{a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},29294:a=>{a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},30965:(a,b,c)=>{c.r(b),c.d(b,{GET:()=>h});var d=c(23211),e=c(72880),f=c(17305),g=c(40686);async function h(a,{params:b}){try{let{studentId:a}=await b,c=await (0,e.zw)(),{data:{user:h},error:i}=await c.auth.getUser();if(i||!h)return d.NextResponse.json({error:"Unauthorized"},{status:401});let{data:j,error:k}=await c.from("students").select("id, first_name, last_name, civil_id, phone, email, puc_fee_paid, created_at").eq("id",a).single();if(k||!j)return d.NextResponse.json({error:"Student not found"},{status:404});if(!j.puc_fee_paid)return d.NextResponse.json({error:"PUC fee has not been paid yet"},{status:400});let{data:l}=await c.from("payment_transactions").select("*").eq("student_id",a).eq("status","completed").ilike("notes","%PUC%").order("completed_at",{ascending:!1}).limit(1).single(),m=l?.completed_at?new Date(l.completed_at).toLocaleDateString("en-GB",{day:"2-digit",month:"2-digit",year:"numeric"}):new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"2-digit",year:"numeric"}),n=l?.cash_invoice_number||l?.myfatoorah_invoice_id||`PUC-${a.substring(0,8).toUpperCase()}`,o=`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PUC Fee Receipt - ${(0,f.ZD)(j.first_name)} ${(0,f.ZD)(j.last_name)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .receipt {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 24px;
      margin-bottom: 5px;
    }
    .header p {
      opacity: 0.9;
      font-size: 14px;
    }
    .badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      padding: 8px 16px;
      border-radius: 20px;
      margin-top: 15px;
      font-weight: 600;
    }
    .content {
      padding: 30px;
    }
    .receipt-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 25px;
      padding-bottom: 20px;
      border-bottom: 1px dashed #e5e7eb;
    }
    .receipt-info div {
      text-align: center;
    }
    .receipt-info label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .receipt-info span {
      display: block;
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin-top: 4px;
    }
    .student-details {
      background: #f9fafb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 25px;
    }
    .student-details h3 {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-row label {
      color: #6b7280;
    }
    .detail-row span {
      font-weight: 500;
      color: #111827;
    }
    .amount-section {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border-radius: 8px;
      padding: 25px;
      text-align: center;
      margin-bottom: 25px;
    }
    .amount-section label {
      font-size: 14px;
      color: #047857;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .amount-section .amount {
      font-size: 42px;
      font-weight: 700;
      color: #047857;
      margin-top: 5px;
    }
    .amount-section .currency {
      font-size: 18px;
      font-weight: 500;
    }
    .status {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #047857;
      font-weight: 600;
      margin-top: 10px;
    }
    .status svg {
      width: 20px;
      height: 20px;
    }
    .footer {
      text-align: center;
      padding: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 12px;
    }
    .footer p {
      margin-bottom: 5px;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .receipt {
        box-shadow: none;
        border-radius: 0;
      }
      .no-print {
        display: none;
      }
    }
    .print-btn {
      display: block;
      max-width: 600px;
      margin: 20px auto;
      padding: 12px 24px;
      background: #7c3aed;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }
    .print-btn:hover {
      background: #6d28d9;
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>Kuwait Technical College</h1>
      <p>كلية الكويت التقنية</p>
      <div class="badge">PUC Fee Receipt</div>
    </div>

    <div class="content">
      <div class="receipt-info">
        <div>
          <label>Receipt No.</label>
          <span>${(0,f.ZD)(n)}</span>
        </div>
        <div>
          <label>Date</label>
          <span>${(0,f.ZD)(m)}</span>
        </div>
        <div>
          <label>Payment Method</label>
          <span>${l?.payment_method==="cash"?"Cash":"Online"}</span>
        </div>
      </div>

      <div class="student-details">
        <h3>Student Information</h3>
        <div class="detail-row">
          <label>Name</label>
          <span>${(0,f.ZD)(j.first_name)} ${(0,f.ZD)(j.last_name)}</span>
        </div>
        <div class="detail-row">
          <label>Civil ID</label>
          <span>${(0,f.ZD)(j.civil_id||"N/A")}</span>
        </div>
        <div class="detail-row">
          <label>Phone</label>
          <span>${(0,f.ZD)(j.phone||"N/A")}</span>
        </div>
        <div class="detail-row">
          <label>Email</label>
          <span>${(0,f.ZD)(j.email||"N/A")}</span>
        </div>
      </div>

      <div class="amount-section">
        <label>Amount Paid</label>
        <div class="amount">
          ${g.pY} <span class="currency">KWD</span>
        </div>
        <div class="status">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Payment Confirmed
        </div>
      </div>

      <div class="footer">
        <p>This is an official receipt for the PUC (Public Universities Council) fee.</p>
        <p>For inquiries, please contact the admissions office.</p>
        <p style="margin-top: 15px; font-weight: 500;">Thank you / شكراً لكم</p>
      </div>
    </div>
  </div>

  <button class="print-btn no-print" onclick="window.print()">
    Print Receipt
  </button>
</body>
</html>
    `;return new d.NextResponse(o,{headers:{"Content-Type":"text/html"}})}catch(a){return console.error("[PUC Fee Receipt] Error:",a),d.NextResponse.json({error:"Failed to generate receipt"},{status:500})}}},44870:a=>{a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},63033:a=>{a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},83531:(a,b,c)=>{c.r(b),c.d(b,{handler:()=>z,patchFetch:()=>y,routeModule:()=>u,serverHooks:()=>x,workAsyncStorage:()=>v,workUnitAsyncStorage:()=>w});var d=c(19225),e=c(84006),f=c(8317),g=c(99373),h=c(34775),i=c(24235),j=c(261),k=c(54365),l=c(90771),m=c(73461),n=c(67798),o=c(92280),p=c(62018),q=c(45696),r=c(47929),s=c(86439),t=c(37527);let u=new d.AppRouteRouteModule({definition:{kind:e.RouteKind.APP_ROUTE,page:"/api/receipts/puc-fee/[studentId]/route",pathname:"/api/receipts/puc-fee/[studentId]",filename:"route",bundlePath:"app/api/receipts/puc-fee/[studentId]/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"/home/taha/Desktop/ourprojects/frontend/app/api/receipts/puc-fee/[studentId]/route.ts",nextConfigOutput:"standalone",userland:()=>c(30965),...{}}),{workAsyncStorage:v,workUnitAsyncStorage:w,serverHooks:x}=u;function y(){return(0,f.patchFetch)({workAsyncStorage:v,workUnitAsyncStorage:w})}async function z(a,b,c){c.requestMeta&&(0,g.setRequestMeta)(a,c.requestMeta),u.isDev&&(0,g.addRequestMeta)(a,"devRequestTimingInternalsEnd",process.hrtime.bigint());let d="/api/receipts/puc-fee/[studentId]/route";"/index"===d&&(d="/");let f=await u.prepare(a,b,{srcPage:d,multiZoneDraftMode:!1});if(!f)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:v,deploymentId:w,params:x,nextConfig:y,parsedUrl:z,isDraftMode:A,prerenderManifest:B,routerServerContext:C,isOnDemandRevalidate:D,revalidateOnlyGenerated:E,resolvedPathname:F,clientReferenceManifest:G,serverActionsManifest:H}=f,I=(0,j.normalizeAppPath)(d),J=!!(B.dynamicRoutes[I]||B.routes[F]),K=async()=>((null==C?void 0:C.render404)?await C.render404(a,b,z,!1):b.end("This page could not be found"),null);if(J&&!A){let a=!!B.routes[F],b=B.dynamicRoutes[I];if(b&&!1===b.fallback&&!a){if(y.adapterPath)return await K();throw new s.NoFallbackError}}let L=null;!J||u.isDev||A||(L="/index"===(L=F)?"/":L);let M=!0===u.isDev||!J,N=J&&!M;H&&G&&(0,i.setManifestsSingleton)({page:d,clientReferenceManifest:G,serverActionsManifest:H});let O=a.method||"GET",P=(0,h.getTracer)(),Q=P.getActiveScopeSpan(),R=!!(null==C?void 0:C.isWrappedByNextServer),S=!!(0,g.getRequestMeta)(a,"minimalMode"),T=(0,g.getRequestMeta)(a,"incrementalCache")||await u.getIncrementalCache(a,y,B,S);null==T||T.resetRequestCache(),globalThis.__incrementalCache=T;let U={params:x,previewProps:B.preview,renderOpts:{experimental:{authInterrupts:!!y.experimental.authInterrupts,useCacheTimeout:y.experimental.useCacheTimeout},cacheComponents:!!y.cacheComponents,validationLevel:y.experimental.instantInsights.validationLevel,supportsDynamicResponse:M,incrementalCache:T,hmrRefreshHash:(0,g.getRequestMeta)(a,"hmrRefreshHash"),cacheLifeProfiles:y.cacheLife,staticPageGenerationTimeout:y.staticPageGenerationTimeout,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d,e)=>u.onRequestError(a,b,d,e,C)},sharedContext:{buildId:v,deploymentId:w}},V=new k.NodeNextRequest(a),W=new k.NodeNextResponse(b),X=l.NextRequestAdapter.fromNodeNextRequest(V,(0,l.signalFromNodeResponse)(b)),Y=async({previousCacheEntry:e})=>{try{if(!S&&D&&E&&!e)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let d=await u.handle(X,U);a.fetchMetrics=U.renderOpts.fetchMetrics;let f=U.renderOpts.pendingWaitUntil;f&&c.waitUntil&&(c.waitUntil(f),f=void 0);let g=U.renderOpts.collectedTags;if(!J)return await (0,o.I)(V,W,d,f),null;{let a=await d.blob(),b=(0,p.toNodeOutgoingHttpHeaders)(d.headers);g&&(b[r.NEXT_CACHE_TAGS_HEADER]=g),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==U.renderOpts.collectedRevalidate&&!(U.renderOpts.collectedRevalidate>=r.INFINITE_CACHE)&&U.renderOpts.collectedRevalidate,e=void 0===U.renderOpts.collectedExpire||U.renderOpts.collectedExpire>=r.INFINITE_CACHE?!1!==c&&c>0?y.expireTime:void 0:U.renderOpts.collectedExpire;return{value:{kind:t.CachedRouteKind.APP_ROUTE,status:d.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:e}}}}catch(b){throw(null==e?void 0:e.isStale)&&await u.onRequestError(a,b,{routerKind:"App Router",routePath:d,routeType:"route",revalidateReason:(0,n.getRevalidateReason)({isStaticGeneration:N,isOnDemandRevalidate:D})},!1,C),b}},Z=async(d,f)=>{try{var g,i;let d=await u.handleResponse({req:a,nextConfig:y,cacheKey:L,routeKind:e.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:B,isRoutePPREnabled:!1,isOnDemandRevalidate:D,revalidateOnlyGenerated:E,responseGenerator:Y,waitUntil:c.waitUntil,isMinimalMode:S});if(!J)return;if((null==d||null==(g=d.value)?void 0:g.kind)!==t.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(i=d.value)?void 0:i.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});S||b.setHeader("x-nextjs-cache",D?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),A&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let f=(0,p.fromNodeOutgoingHttpHeaders)(d.value.headers);S&&J||f.delete(r.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||b.getHeader("Cache-Control")||f.get("Cache-Control")||f.set("Cache-Control",(0,q.getCacheControlHeader)(d.cacheControl)),await (0,o.I)(V,W,new Response(d.value.body,{headers:f,status:d.value.status||200}));return}catch(b){if(b instanceof s.NoFallbackError||await u.onRequestError(a,b,{routerKind:"App Router",routePath:I,routeType:"route",revalidateReason:(0,n.getRevalidateReason)({isStaticGeneration:N,isOnDemandRevalidate:D})},!1,C),J)throw b;await (0,o.I)(V,W,new Response(null,{status:500}));return}finally{(()=>{if(!d)return;let a=b.statusCode;d.setAttributes({"http.status_code":a,"next.rsc":!1}),a&&a>=500&&(d.setStatus({code:h.SpanStatusCode.ERROR}),d.setAttribute("error.type",a.toString()));let c=P.getRootSpanAttributes();if(!c)return;if(c.get("next.span_type")!==m.BaseServerSpan.handleRequest)return console.warn(`Unexpected root span type '${c.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=c.get("next.route")||I,g=`${O} ${e}`;d.setAttributes({"next.route":e,"http.route":e,"next.span_name":g}),d.updateName(g),f&&f!==d&&(f.setAttribute("http.route",e),f.updateName(g))})()}};if(R&&Q)await Z(Q,void 0);else{let b=P.getActiveScopeSpan();await P.withPropagatedContext(a.headers,()=>P.trace(m.BaseServerSpan.handleRequest,{spanName:`${O} ${d}`,kind:h.SpanKind.SERVER,attributes:{"http.method":O,"http.target":a.url}},a=>Z(a,b)),void 0,!R)}}},86439:a=>{a.exports=require("next/dist/shared/lib/no-fallback-error.external")}};var b=require("../../../../../webpack-runtime.js");b.C(a);var c=b.X(0,[3445,3115,9287,1813,3462,5496],()=>b(b.s=83531));module.exports=c})();