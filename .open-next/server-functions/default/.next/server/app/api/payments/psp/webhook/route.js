(()=>{var a={};a.id=5937,a.ids=[5937],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},8128:a=>{"use strict";a.exports=require("next/dist/server/runtime-reacts.external.js")},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},17305:(a,b,c)=>{"use strict";function d(a){return`${a.getFullYear()}-${String(a.getMonth()+1).padStart(2,"0")}-${String(a.getDate()).padStart(2,"0")}`}function e(a){return a?a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"):""}c.d(b,{HN:()=>d,ZD:()=>e}),c(53858)},19063:(a,b,c)=>{"use strict";c.d(b,{FD:()=>g,Ti:()=>f,s1:()=>h,zV:()=>e});var d=c(88095);async function e(a){return(0,d.Cb)(a)}async function f(a,b,c,d,e){if(null!==e){let f=Math.floor((Date.now()-e)/1e3);if(f>3600||f<-3600)return await a.from("webhook_events").insert({source:b,event_id:c,payload_hash:d,status:"rejected_stale",error_message:`Event age ${f}s outside \xb13600s tolerance`}),{ok:!1,reason:"stale",eventId:c,ageSeconds:f}}let{error:f}=await a.from("webhook_events").insert({source:b,event_id:c,payload_hash:d,status:"received"});if(f){if("23505"===f.code)return{ok:!1,reason:"replay",eventId:c};throw f}return{ok:!0,eventId:c,isReplay:!1}}async function g(a,b,c){await a.from("webhook_events").update({status:"processed",processed_at:new Date().toISOString()}).eq("source",b).eq("event_id",c)}async function h(a,b,c,d){await a.from("webhook_events").update({status:"failed",processed_at:new Date().toISOString(),error_message:d.slice(0,500)}).eq("source",b).eq("event_id",c)}},19121:a=>{"use strict";a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},25117:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>z,patchFetch:()=>y,routeModule:()=>u,serverHooks:()=>x,workAsyncStorage:()=>v,workUnitAsyncStorage:()=>w});var d=c(19225),e=c(84006),f=c(8317),g=c(99373),h=c(34775),i=c(24235),j=c(261),k=c(54365),l=c(90771),m=c(73461),n=c(67798),o=c(92280),p=c(62018),q=c(45696),r=c(47929),s=c(86439),t=c(37527);let u=new d.AppRouteRouteModule({definition:{kind:e.RouteKind.APP_ROUTE,page:"/api/payments/psp/webhook/route",pathname:"/api/payments/psp/webhook",filename:"route",bundlePath:"app/api/payments/psp/webhook/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"/home/taha/Desktop/ourprojects/frontend/app/api/payments/psp/webhook/route.ts",nextConfigOutput:"standalone",userland:()=>c(51516),...{}}),{workAsyncStorage:v,workUnitAsyncStorage:w,serverHooks:x}=u;function y(){return(0,f.patchFetch)({workAsyncStorage:v,workUnitAsyncStorage:w})}async function z(a,b,c){c.requestMeta&&(0,g.setRequestMeta)(a,c.requestMeta),u.isDev&&(0,g.addRequestMeta)(a,"devRequestTimingInternalsEnd",process.hrtime.bigint());let d="/api/payments/psp/webhook/route";"/index"===d&&(d="/");let f=await u.prepare(a,b,{srcPage:d,multiZoneDraftMode:!1});if(!f)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:v,deploymentId:w,params:x,nextConfig:y,parsedUrl:z,isDraftMode:A,prerenderManifest:B,routerServerContext:C,isOnDemandRevalidate:D,revalidateOnlyGenerated:E,resolvedPathname:F,clientReferenceManifest:G,serverActionsManifest:H}=f,I=(0,j.normalizeAppPath)(d),J=!!(B.dynamicRoutes[I]||B.routes[F]),K=async()=>((null==C?void 0:C.render404)?await C.render404(a,b,z,!1):b.end("This page could not be found"),null);if(J&&!A){let a=!!B.routes[F],b=B.dynamicRoutes[I];if(b&&!1===b.fallback&&!a){if(y.adapterPath)return await K();throw new s.NoFallbackError}}let L=null;!J||u.isDev||A||(L="/index"===(L=F)?"/":L);let M=!0===u.isDev||!J,N=J&&!M;H&&G&&(0,i.setManifestsSingleton)({page:d,clientReferenceManifest:G,serverActionsManifest:H});let O=a.method||"GET",P=(0,h.getTracer)(),Q=P.getActiveScopeSpan(),R=!!(null==C?void 0:C.isWrappedByNextServer),S=!!(0,g.getRequestMeta)(a,"minimalMode"),T=(0,g.getRequestMeta)(a,"incrementalCache")||await u.getIncrementalCache(a,y,B,S);null==T||T.resetRequestCache(),globalThis.__incrementalCache=T;let U={params:x,previewProps:B.preview,renderOpts:{experimental:{authInterrupts:!!y.experimental.authInterrupts,useCacheTimeout:y.experimental.useCacheTimeout},cacheComponents:!!y.cacheComponents,validationLevel:y.experimental.instantInsights.validationLevel,supportsDynamicResponse:M,incrementalCache:T,hmrRefreshHash:(0,g.getRequestMeta)(a,"hmrRefreshHash"),cacheLifeProfiles:y.cacheLife,staticPageGenerationTimeout:y.staticPageGenerationTimeout,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d,e)=>u.onRequestError(a,b,d,e,C)},sharedContext:{buildId:v,deploymentId:w}},V=new k.NodeNextRequest(a),W=new k.NodeNextResponse(b),X=l.NextRequestAdapter.fromNodeNextRequest(V,(0,l.signalFromNodeResponse)(b)),Y=async({previousCacheEntry:e})=>{try{if(!S&&D&&E&&!e)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let d=await u.handle(X,U);a.fetchMetrics=U.renderOpts.fetchMetrics;let f=U.renderOpts.pendingWaitUntil;f&&c.waitUntil&&(c.waitUntil(f),f=void 0);let g=U.renderOpts.collectedTags;if(!J)return await (0,o.I)(V,W,d,f),null;{let a=await d.blob(),b=(0,p.toNodeOutgoingHttpHeaders)(d.headers);g&&(b[r.NEXT_CACHE_TAGS_HEADER]=g),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==U.renderOpts.collectedRevalidate&&!(U.renderOpts.collectedRevalidate>=r.INFINITE_CACHE)&&U.renderOpts.collectedRevalidate,e=void 0===U.renderOpts.collectedExpire||U.renderOpts.collectedExpire>=r.INFINITE_CACHE?!1!==c&&c>0?y.expireTime:void 0:U.renderOpts.collectedExpire;return{value:{kind:t.CachedRouteKind.APP_ROUTE,status:d.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:e}}}}catch(b){throw(null==e?void 0:e.isStale)&&await u.onRequestError(a,b,{routerKind:"App Router",routePath:d,routeType:"route",revalidateReason:(0,n.getRevalidateReason)({isStaticGeneration:N,isOnDemandRevalidate:D})},!1,C),b}},Z=async(d,f)=>{try{var g,i;let d=await u.handleResponse({req:a,nextConfig:y,cacheKey:L,routeKind:e.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:B,isRoutePPREnabled:!1,isOnDemandRevalidate:D,revalidateOnlyGenerated:E,responseGenerator:Y,waitUntil:c.waitUntil,isMinimalMode:S});if(!J)return;if((null==d||null==(g=d.value)?void 0:g.kind)!==t.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(i=d.value)?void 0:i.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});S||b.setHeader("x-nextjs-cache",D?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),A&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let f=(0,p.fromNodeOutgoingHttpHeaders)(d.value.headers);S&&J||f.delete(r.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||b.getHeader("Cache-Control")||f.get("Cache-Control")||f.set("Cache-Control",(0,q.getCacheControlHeader)(d.cacheControl)),await (0,o.I)(V,W,new Response(d.value.body,{headers:f,status:d.value.status||200}));return}catch(b){if(b instanceof s.NoFallbackError||await u.onRequestError(a,b,{routerKind:"App Router",routePath:I,routeType:"route",revalidateReason:(0,n.getRevalidateReason)({isStaticGeneration:N,isOnDemandRevalidate:D})},!1,C),J)throw b;await (0,o.I)(V,W,new Response(null,{status:500}));return}finally{(()=>{if(!d)return;let a=b.statusCode;d.setAttributes({"http.status_code":a,"next.rsc":!1}),a&&a>=500&&(d.setStatus({code:h.SpanStatusCode.ERROR}),d.setAttribute("error.type",a.toString()));let c=P.getRootSpanAttributes();if(!c)return;if(c.get("next.span_type")!==m.BaseServerSpan.handleRequest)return console.warn(`Unexpected root span type '${c.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=c.get("next.route")||I,g=`${O} ${e}`;d.setAttributes({"next.route":e,"http.route":e,"next.span_name":g}),d.updateName(g),f&&f!==d&&(f.setAttribute("http.route",e),f.updateName(g))})()}};if(R&&Q)await Z(Q,void 0);else{let b=P.getActiveScopeSpan();await P.withPropagatedContext(a.headers,()=>P.trace(m.BaseServerSpan.handleRequest,{spanName:`${O} ${d}`,kind:h.SpanKind.SERVER,attributes:{"http.method":O,"http.target":a.url}},a=>Z(a,b)),void 0,!R)}}},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},44870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},51516:(a,b,c)=>{"use strict";c.r(b),c.d(b,{GET:()=>n,POST:()=>l});var d=c(23211),e=c(59287),f=c(94952),g=c(17305),h=c(19063),i=c(92612),j=c(58642);let k=(0,i.h)("PSP Payment Webhook");async function l(a){try{let b,c=await a.text(),g=a.headers.get("x-myfatoorah-signature"),i=process.env.MYFATOORAH_WEBHOOK_SECRET;if(!(0,f.t6)(c,g,i))return console.error("[PSP Payment Webhook] Invalid signature"),d.NextResponse.json({error:"Invalid webhook signature"},{status:401});let j=JSON.parse(c);k.info("Received",{transactionId:j?.transactionId,status:j?.status});let l=j.InvoiceId||j.Data?.InvoiceId;if(!l)return console.error("[PSP Payment Webhook] No InvoiceId in payload"),d.NextResponse.json({error:"Missing InvoiceId"},{status:400});let n=(0,e.UU)(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY),o=`psp:${l}`,p=await (0,h.Ti)(n,"myfatoorah",o,await (0,h.zV)(c),null);if(!p.ok)return k.info("Deduplicated",{reason:p.reason,eventId:o}),d.NextResponse.json({success:!0,message:`Webhook ${p.reason}`});try{b=await m(n,j,l),await (0,h.FD)(n,"myfatoorah",o)}catch(a){throw await (0,h.s1)(n,"myfatoorah",o,a instanceof Error?a.message:String(a)),a}return b}catch(a){return console.error("[PSP Payment Webhook] Error:",a),d.NextResponse.json({error:"Webhook processing failed"},{status:500})}}async function m(a,b,c){let{data:e,error:h}=await a.from("payment_transactions").select("*, lead:leads(id, first_name, last_name, first_name_ar, last_name_ar, phone, email, civil_id)").eq("myfatoorah_invoice_id",c.toString()).eq("notes","PSP Fee Payment").single();if(h||!e)return console.error("[PSP Payment Webhook] Transaction not found for invoice:",c),d.NextResponse.json({error:"Transaction not found"},{status:404});if("completed"===e.status)return k.info("Transaction already completed",{transactionId:e.id}),d.NextResponse.json({success:!0,message:"Already processed"});let i=await (0,f.DB)(c.toString());if(!i.success)return console.error("[PSP Payment Webhook] Failed to get status:",i.error),d.NextResponse.json({error:i.error},{status:500});if(await a.from("payment_transactions").update({webhook_payload:b,webhook_received_at:new Date().toISOString(),myfatoorah_payment_id:i.paymentId}).eq("id",e.id),"Paid"===i.invoiceStatus){var l;let b,f=e.lead;await a.from("payment_transactions").update({status:"completed",completed_at:new Date().toISOString()}).eq("id",e.id);let h=`PSP-${c}-${Date.now().toString(36).toUpperCase()}`,m=(b=new Date((l={invoiceNumber:h,leadName:`${f.first_name_ar||""} ${f.last_name_ar||""}`,civilId:f.civil_id||e.civil_id,phone:f.phone,email:f.email,amount:e.amount,paymentDate:new Date().toISOString(),paymentMethod:"Online Payment (MyFatoorah)"}).paymentDate).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"}),`
<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8f9fa; padding: 20px; }
    .invoice { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { font-size: 24px; margin-bottom: 8px; }
    .header p { opacity: 0.9; font-size: 14px; }
    .badge { display: inline-block; background: #22c55e; color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 16px; }
    .content { padding: 30px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 12px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .info-item { }
    .info-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
    .info-value { font-size: 14px; color: #1f2937; font-weight: 500; }
    .fees-table { width: 100%; border-collapse: collapse; }
    .fees-table th, .fees-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .fees-table th { font-size: 12px; color: #6b7280; font-weight: 600; }
    .fees-table td { font-size: 14px; color: #1f2937; }
    .fees-table .amount { text-align: right; font-weight: 500; }
    .total-row { background: #f8f9fa; }
    .total-row td { font-weight: 700; color: #1e3a5f; font-size: 16px; }
    .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; }
    .footer p { font-size: 12px; color: #6b7280; }
    .footer .logo { font-weight: 700; color: #1e3a5f; font-size: 14px; margin-top: 8px; }
    @media print {
      body { padding: 0; background: white; }
      .invoice { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <h1>Payment Receipt</h1>
      <p>PSP Fee Payment Confirmation</p>
      <span class="badge">PAID</span>
    </div>
    <div class="content">
      <div class="section">
        <div class="section-title">Receipt Details</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Receipt Number</div>
            <div class="info-value">${(0,g.ZD)(l.invoiceNumber)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Payment Date</div>
            <div class="info-value">${(0,g.ZD)(b)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Payment Method</div>
            <div class="info-value">${(0,g.ZD)(l.paymentMethod)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Status</div>
            <div class="info-value" style="color: #22c55e;">Confirmed</div>
          </div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Student Information</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Name</div>
            <div class="info-value">${(0,g.ZD)(l.leadName)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Civil ID</div>
            <div class="info-value">${(0,g.ZD)(l.civilId)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Phone</div>
            <div class="info-value">${(0,g.ZD)(l.phone)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Email</div>
            <div class="info-value">${(0,g.ZD)(l.email||"N/A")}</div>
          </div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Payment Summary</div>
        <table class="fees-table">
          <thead>
            <tr>
              <th>Description</th>
              <th class="amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${l.fees?.map(a=>`
              <tr>
                <td>${(0,g.ZD)(a.label)}</td>
                <td class="amount">${a.amount} KD</td>
              </tr>
            `).join("")||`
              <tr>
                <td>PSP Application Fees</td>
                <td class="amount">${l.amount} KD</td>
              </tr>
            `}
            <tr class="total-row">
              <td>Total Paid</td>
              <td class="amount">${l.amount} KD</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="footer">
      <p>Thank you for your payment. This receipt confirms your PSP fee payment.</p>
      <p class="logo">Kuwait Technical College</p>
    </div>
  </div>
</body>
</html>
  `.trim()),n=`leads/${f.id}/psp/invoices/${h}.html`,{error:o}=await a.storage.from("documents").upload(n,new Blob([m],{type:"text/html"}),{contentType:"text/html",upsert:!0});o&&console.error("[PSP Payment Webhook] Failed to upload invoice:",o);let{data:p}=a.storage.from("documents").getPublicUrl(n),q={file_name:`${h}.html`,file_type:"text/html",storage_path:n,public_url:p?.publicUrl,is_verified:!0,verified_at:new Date().toISOString(),verification_notes:"Auto-verified: Payment confirmed via MyFatoorah"};for(let b of["gov","us","uk","ksa","others"]){let{data:c}=await a.from("psp_documents").select("id").eq("lead_id",f.id).eq("document_type","payment_receipt").eq("graduate_type",b).single();c?await a.from("psp_documents").update(q).eq("id",c.id):await a.from("psp_documents").insert({lead_id:f.id,document_type:"payment_receipt",graduate_type:b,...q})}await a.from("activities").insert({lead_id:f.id,activity_type:"psp_payment_received",title:"PSP Payment Received",description:`PSP fee payment of ${e.amount} KWD received via MyFatoorah. Invoice: ${h}`,metadata:{transaction_id:e.id,payment_method:"myfatoorah",amount:e.amount,invoice_id:c,payment_id:i.paymentId,invoice_number:h}});try{let b=f.phone.replace(/\D/g,"");b.startsWith("965")||b.startsWith("+")||(b=`965${b}`);let c=`whatsapp:+${b}`,d=`whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,g=`مرحباً ${f.first_name_ar||""}،

تم استلام دفعتكم بنجاح ✅

رقم الإيصال: ${h}
المبلغ: ${e.amount} د.ك
الطريقة: دفع إلكتروني (MyFatoorah)

${p?.publicUrl?`رابط الإيصال: ${p.publicUrl}`:""}

---

Hello ${f.first_name_ar||""},

Your payment has been received successfully ✅

Receipt Number: ${h}
Amount: ${e.amount} KD
Method: Online Payment (MyFatoorah)

${p?.publicUrl?`Receipt Link: ${p.publicUrl}`:""}

شكراً لكم / Thank you
Kuwait Technical College`,i=await (0,j.op)({body:g,from:d,to:c});await a.from("whatsapp_messages").insert({twilio_message_sid:i.sid,direction:"outbound",from_number:process.env.TWILIO_WHATSAPP_NUMBER,to_number:b,message_body:g,status:i.status,lead_id:f.id,sent_at:new Date().toISOString()}),k.info("Receipt sent via WhatsApp",{sid:i.sid})}catch(a){console.error("[PSP Payment Webhook] Failed to send receipt via WhatsApp:",a)}return k.info("Successfully processed payment",{leadId:f.id}),d.NextResponse.json({success:!0,message:"Payment processed, invoice generated, and receipt sent via WhatsApp",invoiceNumber:h})}return"Failed"===i.invoiceStatus||"Expired"===i.invoiceStatus?(await a.from("payment_transactions").update({status:"failed",notes:`PSP Fee Payment - ${i.invoiceStatus}`}).eq("id",e.id),await a.from("activities").insert({lead_id:e.lead_id,activity_type:"psp_payment_failed",title:"PSP Payment Failed",description:`PSP fee payment of ${e.amount} KWD failed - ${i.invoiceStatus}`,metadata:{transaction_id:e.id,invoice_id:c,status:i.invoiceStatus}}),d.NextResponse.json({success:!0,message:`Payment ${i.invoiceStatus?.toLowerCase()}`})):(await a.from("payment_transactions").update({status:"processing"}).eq("id",e.id),d.NextResponse.json({success:!0,message:"Payment still pending",status:i.invoiceStatus}))}async function n(a){let b=a.nextUrl.searchParams,c=b.get("paymentId"),e=b.get("error"),f=process.env.NEXT_PUBLIC_APP_URL||"http://localhost:3000";return e?d.NextResponse.redirect(`${f}/payment-error?reason=cancelled&type=psp`):c?d.NextResponse.redirect(`${f}/payment-success?paymentId=${c}&type=psp`):d.NextResponse.json({status:"ok",service:"psp-payment-webhook"})}},53858:(a,b,c)=>{"use strict";c.d(b,{GA:()=>l,Gv:()=>j,HP:()=>d,LS:()=>g,NC:()=>i,W_:()=>e,ll:()=>h,o7:()=>k,pY:()=>f});let{ENROLLMENT_PAYMENT_AMOUNT:d,FULL_TUITION_AMOUNT:e,PUC_FEE_AMOUNT:f,TEST_FEE_AMOUNT:g,GPA_SELF_FUNDED_THRESHOLD:h,PLACEMENT_TEST_PASSING_THRESHOLD:i,FILE_APPLICATION_FEE_AMOUNT:j,FILE_TEST_FEE_AMOUNT:k,PSP_FEE_AMOUNT:l}={ENROLLMENT_PAYMENT_AMOUNT:150,FULL_TUITION_AMOUNT:550,PUC_FEE_AMOUNT:10,TEST_FEE_AMOUNT:20,FILE_APPLICATION_FEE_AMOUNT:20,FILE_TEST_FEE_AMOUNT:15,PSP_FEE_AMOUNT:50,CURRENCY:"KWD",GPA_SELF_FUNDED_THRESHOLD:70,PLACEMENT_TEST_PASSING_THRESHOLD:60,PIPELINE_STAGES:["new","contacted","visit","test","application","applicant","enrolled","lost","withdraw"]}},58642:(a,b,c)=>{"use strict";async function d(a){return e(a)}async function e(a){let b=process.env.TWILIO_ACCOUNT_SID,c=process.env.TWILIO_AUTH_TOKEN;if(!b||!c)throw Error("Twilio credentials not configured");let d=`https://api.twilio.com/2010-04-01/Accounts/${b}/Messages.json`,e=new URLSearchParams;e.append("To",a.to),e.append("From",a.from),e.append("Body",a.body),a.mediaUrl&&e.append("MediaUrl",a.mediaUrl);let f=btoa(`${b}:${c}`);try{let a=await fetch(d,{method:"POST",headers:{Authorization:`Basic ${f}`,"Content-Type":"application/x-www-form-urlencoded"},body:e.toString()}),b=await a.json();if(!a.ok)throw Error(`Twilio API error: ${b.message||b.error_message||"Unknown error"} (Code: ${b.code||b.error_code||a.status})`);return{sid:b.sid,status:b.status,error_code:b.error_code,error_message:b.error_message}}catch(a){if(a instanceof Error)throw a;throw Error(`Failed to send Twilio message: ${String(a)}`)}}c.d(b,{op:()=>d})},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},78335:()=>{},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},88095:(a,b,c)=>{"use strict";function d(a){let b=new Uint8Array(a);return crypto.getRandomValues(b),Array.from(b).map(a=>a.toString(16).padStart(2,"0")).join("")}async function e(a){let b=new TextEncoder;return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",b.encode(a)))).map(a=>a.toString(16).padStart(2,"0")).join("")}async function f(a,b){let c=new TextEncoder,d=await crypto.subtle.importKey("raw",c.encode(a),{name:"HMAC",hash:"SHA-256"},!1,["sign"]);return Array.from(new Uint8Array(await crypto.subtle.sign("HMAC",d,c.encode(b)))).map(a=>a.toString(16).padStart(2,"0")).join("")}async function g(a,b,c){try{let d=await f(a,b);return h(c,d)}catch{return!1}}function h(a,b){let c=a.length,d=b.length,e=Math.max(c,d),f=+(c!==d);for(let g=0;g<e;g++)f|=(g<c?a.charCodeAt(g):0)^(g<d?b.charCodeAt(g):0);return 0===f}async function i(a,b){if("string"!=typeof a||"string"!=typeof b)return!1;let[c,d]=await Promise.all([e(a),e(b)]);return h(c,d)}c.d(b,{Cb:()=>e,dV:()=>i,hV:()=>g,k6:()=>d})},92612:(a,b,c)=>{"use strict";c.d(b,{h:()=>e,y:()=>f});let d=new Set(["phone","phone_number","phonenumber","mobile","email","civil_id","civilid","national_id","nationalid","passport","card_number","cardnumber","card_cvv","cvv","password","token","access_token","refresh_token","authorization","cookie","set-cookie","api_key","apikey","secret","client_secret","webhook_secret"]);function e(a,b){let c=b||crypto.randomUUID().slice(0,8);function e(b,e,f){let g=JSON.stringify({level:b,context:a,message:e,requestId:c,data:f?function a(b){let c={};for(let[e,f]of Object.entries(b))c[e]=function b(c,e){if(d.has(c.toLowerCase()))return"[REDACTED]";if(null==e)return e;if(Array.isArray(e))return e.map(a=>b("",a));if("object"==typeof e){let b=Object.getPrototypeOf(e);if(b===Object.prototype||null===b)return a(e);if(e instanceof Error)return{name:e.name,message:e.message,stack:e.stack}}return e}(e,f);return c}(f):f,timestamp:new Date().toISOString()});switch(b){case"debug":break;case"info":console.log(g);break;case"warn":console.warn(g);break;case"error":console.error(g)}}return{debug:(a,b)=>e("debug",a,b),info:(a,b)=>e("info",a,b),warn:(a,b)=>e("warn",a,b),error:(a,b)=>e("error",a,b),requestId:c}}function f(a,b,c){return Response.json({error:a,requestId:c.requestId},{status:b})}},94952:(a,b,c)=>{"use strict";c.d(b,{DB:()=>h,lN:()=>e,t6:()=>i,vt:()=>g});var d=c(88095);function e(a){let b=a.replace(/\D/g,"");return 12===b.length&&(b.startsWith("2")||b.startsWith("3"))}function f(){let a=process.env.MYFATOORAH_API_KEY,b=process.env.MYFATOORAH_BASE_URL||"https://apitest.myfatoorah.com";return a?{apiKey:a,baseUrl:b}:null}async function g(a){let b=f();if(!b)return{success:!1,error:"MyFatoorah not configured. Please set MYFATOORAH_API_KEY."};if(!e(a.customerCivilId))return{success:!1,error:"Invalid civil ID format. Must be 12 digits starting with 2 or 3."};let c=process.env.NEXT_PUBLIC_APP_URL||"http://localhost:3000";try{let d,e=await fetch(`${b.baseUrl}/v2/SendPaymentLink`,{method:"POST",headers:{Authorization:`Bearer ${b.apiKey}`,"Content-Type":"application/json"},signal:AbortSignal.timeout(3e4),body:JSON.stringify({NotificationOption:"LNK",CustomerName:a.customerName,CustomerEmail:a.customerEmail||"",CustomerMobile:(d=a.customerMobile.replace(/\D/g,"")).startsWith("965")?d:8===d.length?`965${d}`:d,CustomerCivilId:a.customerCivilId,InvoiceValue:a.invoiceValue,DisplayCurrencyIso:a.displayCurrencyIso||"KWD",CallBackUrl:a.callBackUrl||`${c}/api/payments/myfatoorah/callback`,ErrorUrl:a.errorUrl||`${c}/api/payments/myfatoorah/callback?error=true`,Language:a.language||"en",CustomerReference:a.customerReference||"",ExpiryDate:a.expiryDate||"",InvoiceItems:[{ItemName:"ktech Enrollment Fee",Quantity:1,UnitPrice:a.invoiceValue}]})}),f=await e.json();if(!e.ok||!f.IsSuccess)return{success:!1,error:f.Message||f.ValidationErrors?.[0]?.Error||"Failed to create payment link"};return{success:!0,invoiceId:f.Data?.InvoiceId?.toString(),invoiceUrl:f.Data?.InvoiceURL||f.Data?.CustomerPortalUrl}}catch(a){return console.error("[MyFatoorah] Error creating payment link:",a),{success:!1,error:a instanceof Error?a.message:"Failed to create payment link"}}}async function h(a){let b=f();if(!b)return{success:!1,error:"MyFatoorah not configured. Please set MYFATOORAH_API_KEY."};try{let c=await fetch(`${b.baseUrl}/v2/GetPaymentStatus`,{method:"POST",headers:{Authorization:`Bearer ${b.apiKey}`,"Content-Type":"application/json"},signal:AbortSignal.timeout(3e4),body:JSON.stringify({Key:a,KeyType:"InvoiceId"})}),d=await c.json();if(!c.ok||!d.IsSuccess)return{success:!1,error:d.Message||"Failed to get payment status"};let e=d.Data,f=e?.InvoiceTransactions?.[0];return{success:!0,invoiceStatus:e?.InvoiceStatus,invoiceId:e?.InvoiceId?.toString(),paymentId:f?.PaymentId,paidAmount:e?.InvoiceValue}}catch(a){return console.error("[MyFatoorah] Error getting payment status:",a),{success:!1,error:a instanceof Error?a.message:"Failed to get payment status"}}}async function i(a,b,c){return c?b?(0,d.hV)(c,a,b):(console.error("[MyFatoorah] No signature header in webhook request"),!1):(console.error("[MyFatoorah] MYFATOORAH_WEBHOOK_SECRET is not configured — rejecting webhook"),!1)}},96487:()=>{}};var b=require("../../../../../webpack-runtime.js");b.C(a);var c=b.X(0,[3445,9287,1813],()=>b(b.s=25117));module.exports=c})();