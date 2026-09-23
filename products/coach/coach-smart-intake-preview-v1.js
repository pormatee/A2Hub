/* COACH_SMART_INTAKE_PREVIEW_V1_1 */
/* COACH_SMART_INTAKE_PREVIEW_V1_2 */
/* SMART_CASE_INTAKE_FACT_DECOMP_V1_2 */
(function(){
"use strict";
const HYP=/อาจ|คาดว่า|น่าจะ|สันนิษฐาน|เป็นไปได้|เบื้องต้นพบปัจจัย|ปัจจัย\/สาเหตุ/i;
const SAFETY=/อุบัติเหตุ|บาดเจ็บ|ฟกช้ำ|ปฐมพยาบาล|ห้องพยาบาล|KYT|Risk Assessment|ความปลอดภัย|Jig\s*กระแทก|นิ้ว|มือ.*กระแทก/i;
const QUALITY=/QA|QC|NG|Defect|คุณภาพ|Sampling|Screw|กรีส|Grease|Part|Bundling|ผิด|ไม่ครบ|กลับด้าน|ปนเปื้อน/i;
const STANDARD=/มาตรฐาน|standard|ต้อง(?:มี|ไม่มี|ขัน|เป็น|อยู่)|spec|ข้อกำหนด/i;
const CONTAIN=/hold|กัก|recheck|ตรวจ\s*100%|100%\s*inspection|stop\s*ship|stop\s*shipping|คัด|แยก|ห้ามส่ง|หยุดส่ง|ปฐมพยาบาล|ควบคุมสถานการณ์/i;
const ACTION=/มาตรการ|ปรับตำแหน่ง|ปรับปรุง|เพิ่ม(?:ความ|การ|ฝา|guide|interlock)|revision|แก้ไข|ขยายผล|ทำ\s*KYT|risk assessment/i;
const EVSRC=/ตรวจ(?:สอบ)?|กล้อง|camera|cctv|log|บันทึก|สอบถาม|สัมภาษณ์|วัด|ทดลอง/i;
const EVRES=/พบว่า|พบ\s|เห็น|แสดง|ยืนยัน|ไม่พบ|วัดได้|ทดลอง.*(?:ได้|ไม่ได้|พบ)|กล้อง.*(?:พบ|เห็น)|log.*(?:พบ|แสดง)/i;
const FACT=/พบ|เกิดเหตุ|ทำให้|ส่งผล|เวลา|วันที่|shift|บริเวณ|ฟกช้ำ|บาดเจ็บ|\d+\s*(?:ชิ้น|ชุด|เครื่อง|จุด|lot|ล็อต|ครั้ง|คน)/i;
const ESC=/ไม่พบก่อน|ไม่พบ.*เพราะ|มองไม่เห็น|ปล่อยผ่าน|หลุด|ตรวจไม่พบ|ก่อนปล่อยงาน/i;
const HUMAN=/พนักงาน.*(?:ลืม|ไม่ทำตาม|ทำผิด)|operator.*(?:forgot|missed|error)|human\s*error/i;
const RELEASE=/จน.*(?:ยืนยัน|ตรวจครบ|ผ่าน)|ปล่อย.*เมื่อ|release/i;
const METHOD_ONLY=/^(?:ตรวจ)?\s*(?:กล้องวงจรปิด|กล้อง|camera|cctv|log|สอบถามพนักงาน|สัมภาษณ์พนักงาน)\s*$/i;
const CAUSE_HEADER=/^(?:จากการตรวจสอบเบื้องต้น)?\s*(?:พบ)?\s*ปัจจัย\/สาเหตุ(?:ว่า)?\s*:?\s*$/i;
const ACTION_HEADER=/^มาตรการป้องกันและการติดตามต่อไป(?:คือ)?\s*:?\s*$/i;
const META_LINE=/^(?:📋|🕒|Report by:|ขณะนี้รายงานอยู่ในสถานะ)/i;

const clean=t=>String(t||"").replace(/\s+/g," ").trim();
const h=t=>String(t??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));

function splitSegments(raw){
 let t=String(raw||"").replace(/\r\n?/g,"\n");
 // Do not split on "."; Thai dates such as ก.ย. must remain intact.
 t=t.replace(/;\s+/g,";\n");
 t=t.replace(/\s+(?=\d+\.(?!\d))/g,"\n");
 t=t.replace(/\s+(?=(?:จากการตรวจสอบเบื้องต้นพบปัจจัย\/สาเหตุว่า|ได้ดำเนินการช่วยเหลือและควบคุมสถานการณ์ทันทีโดย|มาตรการป้องกันและการติดตามต่อไปคือ|ข้อมูลด้านช่วงเวลา\/ความถี่เพิ่มเติม:|ขณะนี้รายงานอยู่ในสถานะ|Report by:|ต่อมารายงานอีกส่วน|อาจเกิดจาก|คาดว่า|น่าจะ|สันนิษฐาน|เป็นไปได้|พนักงานบอกว่า))/gi,"\n");
 return t.split("\n").map(clean).filter(Boolean);
}
function detectDomain(raw){
 const t=String(raw||"");
 if(SAFETY.test(t)&&/อุบัติเหตุ|บาดเจ็บ|ฟกช้ำ|ปฐมพยาบาล|ห้องพยาบาล|Jig\s*กระแทก/i.test(t))
  return {caseType:"safety",compatibleWithCurrentCoach:false,domainReason:"พบข้อมูลอุบัติเหตุ/การบาดเจ็บหรือการควบคุมด้านความปลอดภัย"};
 if(QUALITY.test(t))return {caseType:"quality",compatibleWithCurrentCoach:true,domainReason:"พบข้อมูลปัญหาคุณภาพ/NG/การตรวจคุณภาพ"};
 return {caseType:"unknown",compatibleWithCurrentCoach:false,domainReason:"ข้อมูลยังไม่พอระบุว่าเป็น Quality หรือ Safety โดยไม่เดา"};
}
function metadata(raw){
 const t=String(raw||""),m={category:"",severity:"",status:"",title:"",eventDate:"",eventTime:"",shift:"",location:"",reporter:""};
 let x=t.match(/📋\s*([^|\n]+)\|\s*([^|\n]+)\|\s*([^\n]+)/);if(x){m.category=clean(x[1]);m.severity=clean(x[2]);m.status=clean(x[3])}
 x=t.match(/^\s*\*([^*\n]+)\*\s*$/m);if(x)m.title=clean(x[1]);
 x=t.match(/วันที่\s+(.+?)\s+เวลา\s+(\d{1,2}:\d{2})/);if(x){m.eventDate=clean(x[1]);m.eventTime=clean(x[2])}
 x=t.match(/\bShift\s+(A|B|Day)\b/i);if(x)m.shift="Shift "+x[1];
 x=t.match(/บริเวณ\s+(.+?)\s+โดยเหตุการณ์/i);if(x)m.location=clean(x[1]);
 x=t.match(/Report by:\s*([^\n]+)/i);if(x)m.reporter=clean(x[1]);
 return m;
}
function classify(t,caseType){
 t=clean(t);
 if(HUMAN.test(t))return {sourceText:t,type:"candidate_cause",confidence:"high",reason:"เป็น Human Error/พฤติกรรมที่ต้องวิเคราะห์ต่อ ไม่ใช่ Root Cause สุดท้าย"};
 if(HYP.test(t)){
   if(ESC.test(t))return {sourceText:t,type:"escape_hypothesis",confidence:"high",reason:"มีถ้อยคำความไม่แน่นอนและอธิบายเหตุที่ตรวจไม่พบ"};
   return {sourceText:t,type:"candidate_cause",confidence:"high",reason:"มีถ้อยคำความไม่แน่นอน/ปัจจัยสาเหตุ จึงยังเป็นเพียงสาเหตุที่ต้องพิสูจน์"};
 }
 if(STANDARD.test(t)&&!ACTION.test(t))return {sourceText:t,type:"standard",confidence:"high",reason:"ระบุมาตรฐานหรือสภาพที่ควรเป็น"};
 if(CONTAIN.test(t))return {sourceText:t,type:"containment",confidence:"high",reason:"เป็นการควบคุม/กัก/ตรวจซ้ำ/ช่วยเหลือทันที"};
 if(EVSRC.test(t)&&EVRES.test(t)&&!METHOD_ONLY.test(t))return {sourceText:t,type:"evidence",confidence:"high",reason:"มีทั้งแหล่ง/วิธีตรวจและผลที่ตรวจพบ"};
 if(ACTION.test(t))return {sourceText:t,type:"action",confidence:"high",reason:"เป็นมาตรการหรือการเปลี่ยนแปลงที่เสนอ/ดำเนินการ"};
 if(METHOD_ONLY.test(t)||(EVSRC.test(t)&&!EVRES.test(t)))return {sourceText:t,type:"unknown",confidence:"medium",reason:"เป็นวิธีหรือแหล่งตรวจ แต่ยังไม่มีผลตรวจ"};
 if(FACT.test(t))return {sourceText:t,type:"fact",confidence:"medium",reason:"เป็นเหตุการณ์/ผลตรวจ/จำนวน/ผลกระทบที่รายงานว่าเกิดขึ้น"};
 if(caseType==="safety"&&/ระยะ|พร้อมกัน|ขณะหยิบ|jig|สกรู/i.test(t))return {sourceText:t,type:"fact",confidence:"medium",reason:"เป็นบริบทเหตุการณ์ด้านความปลอดภัยที่รายงานโดยตรง"};
 return {sourceText:t,type:"unknown",confidence:"low",reason:"ยังจัดประเภทไม่ได้โดยไม่เดา"};
}
function classifySegments(raw,caseType){
 const out=[];let context="";
 for(const source of splitSegments(raw)){
   const t=clean(source);if(!t)continue;
   if(META_LINE.test(t))continue;
   if(t.startsWith("*")&&t.endsWith("*")&&t.length>2)continue;
   if(CAUSE_HEADER.test(t)){context="candidate_cause";continue}
   if(ACTION_HEADER.test(t)){context="action";continue}
   if(/^(?:ได้ดำเนินการช่วยเหลือและควบคุมสถานการณ์ทันทีโดย|ข้อมูลด้านช่วงเวลา\/ความถี่เพิ่มเติม:)/i.test(t))context="";
   const n=t.match(/^\d+\.(.+)$/);
   if(n&&(context==="candidate_cause"||context==="action")){
     out.push({sourceText:clean(n[1]),type:context,confidence:"high",reason:context==="candidate_cause"?"อยู่ใต้หัวข้อปัจจัย/สาเหตุเบื้องต้น จึงยังเป็นสาเหตุที่ต้องพิสูจน์":"อยู่ใต้หัวข้อมาตรการป้องกัน/ติดตาม"});
     continue;
   }
   out.push(classify(t,caseType));
 }
 return out;
}
function contradictions(segs){
 const txt=segs.map(x=>x.sourceText),pos=txt.filter(t=>/พบ\s*(?:NG|ปัญหา|defect)|\d+\s*NG/i.test(t)),neg=txt.filter(t=>/ไม่พบ\s*(?:NG|ปัญหา|defect)/i.test(t));
 return pos.length&&neg.length?[{claimA:pos[0],claimB:neg[0],reason:"มีข้อความว่าพบและไม่พบในบริบทเดียวกัน ควรยืนยันแหล่งข้อมูลก่อน"}]:[];
}
function missingInfo(raw,caseType,segs,problem,contain){
 const missing=[],text=String(raw||""),kinds=new Set(segs.map(x=>x.type));
 if(!problem.statement)missing.push("เกิดอะไรขึ้น");
 if(caseType==="quality"&&!problem.standard)missing.push("มาตรฐานของงาน");
 if(!problem.actual)missing.push("สิ่งที่เกิดจริง");
 if(!contain.length)missing.push("Containment / การควบคุมทันที");
 else if(caseType==="quality"&&!RELEASE.test(text))missing.push("เงื่อนไขปล่อยงานหลัง Containment");
 if(caseType==="quality"&&kinds.has("candidate_cause")&&!kinds.has("evidence"))missing.push("หลักฐานที่ยืนยัน candidate cause");
 if(caseType==="quality"){
   if(!/final|qa|qc|sampling|inspection|จุดตรวจ|ก่อนปล่อย|ก่อน pack|torque audit/i.test(text))missing.push("จุดตรวจที่ควรพบก่อนปล่อยงาน");
   if(!kinds.has("escape_hypothesis")&&kinds.has("candidate_cause"))missing.push("สาเหตุที่จุดตรวจไม่พบ");
 }
 if(caseType==="safety"){
   const existingDistance=segs.some(s=>s.type==="standard"&&/ระยะปลอดภัย|safe distance|clearance|ระยะห่าง/i.test(s.sourceText)&&!ACTION.test(s.sourceText));
   if(!existingDistance)missing.push("มาตรฐานระยะปลอดภัยเดิม");
   if(!/ปุ่ม|switch|sensor|interlock|foot|เหยียบ|สั่งหมุน|trigger|ทำให้ jig หมุน/i.test(text))missing.push("วิธีหรือเงื่อนไขที่ทำให้ Jig หมุน");
   if(!/guard|interlock|ฝาครอบ|รั้ว|ม่านแสง|light curtain/i.test(text))missing.push("มี Guard หรือ Interlock หรือไม่");
   if(!/กล้อง.*(?:พบ|เห็น)|cctv.*(?:พบ|เห็น)|พยาน|log.*พบ/i.test(text))missing.push("หลักฐานยืนยันลำดับเหตุการณ์");
 }
 return [...new Set(missing)];
}
function decomposeFacts(raw,caseType,meta,problem,contain){
 const text=String(raw||""),out={event:meta.title||problem.statement||"",personAction:"",equipmentAction:"",observedActual:problem.actual||"",standard:problem.standard||"",location:meta.location||"",eventDate:meta.eventDate||"",eventTime:meta.eventTime||"",shift:meta.shift||"",impact:"",immediateResponse:contain[0]||"",sequence:[]};
 if(caseType==="safety"){
   let x=text.match(/(พนักงาน(?:ใช้|เอื้อม|ยื่น|นำ)?[^.\n]+?)(?=\s*ขณะเดียวกัน|\s*ในขณะเดียวกัน|\s*ทำให้\s*Jig|\.|$)/i);if(x)out.personAction=clean(x[1]);
   x=text.match(/((?:ขณะเดียวกัน\s*)?มีการหมุน\s*Jig[^.\n]+?)(?=\s*ทำให้|\.|$)/i);if(x)out.equipmentAction=clean(x[1]);
   x=text.match(/ระดับผลกระทบ\s+([^.\n]+)/i)||text.match(/(ฟกช้ำ[^.\n]*|ได้รับบาดเจ็บ[^.\n]*)/i);if(x)out.impact=clean(x[1]);
 }
 for(const k of ["personAction","equipmentAction","event"]){const v=clean(out[k]);if(v&&!out.sequence.includes(v))out.sequence.push(v)}
 return out;
}
function nextQuestions(raw,caseType,facts,missing,segs){
 const qs=[],add=(id,question,reason,priority="medium")=>{if(!qs.some(x=>x.id===id))qs.push({id,question,reason,priority})};
 if(caseType==="safety"){
   if(missing.includes("วิธีหรือเงื่อนไขที่ทำให้ Jig หมุน"))add("jig_movement_trigger","Jig เริ่มหมุนด้วยวิธีหรือเงื่อนไขอะไรในขณะนั้น?","รู้ว่า Jig หมุน แต่ยังไม่รู้เงื่อนไขที่เริ่มการเคลื่อนที่","high");
   if(missing.includes("มี Guard หรือ Interlock หรือไม่"))add("barrier_guard","บริเวณนี้มี Guard, Interlock หรืออุปกรณ์ที่ป้องกันมือเข้าเขตการหมุนของ Jig หรือไม่?","ยังไม่ทราบว่ามีชั้นป้องกันทางวิศวกรรมอยู่แล้วหรือไม่","high");
   const c=segs.filter(x=>x.type==="candidate_cause").map(x=>x.sourceText).join(" ");
   if(/กล่องสกรู.*(?:ระยะ|ใกล้).*Jig|Jig.*(?:ระยะ|ใกล้).*กล่องสกรู/i.test(c))add("actual_layout_distance","ระยะจริงจากตำแหน่งกล่องสกรูถึงขอบเขตการหมุนของ Jig วัดได้เท่าไร?","รายงานระบุความสัมพันธ์ของตำแหน่ง แต่ยังไม่มีค่าระยะจริง","high");
   if(missing.includes("มาตรฐานระยะปลอดภัยเดิม"))add("existing_safe_distance","เดิมมีมาตรฐานระยะห่างระหว่างพื้นที่วางอุปกรณ์กับขอบเขตการหมุนของ Jig หรือไม่? ถ้ามี กำหนดเท่าไร?","ยังไม่พบมาตรฐานเดิมในรายงาน","medium");
   if(missing.includes("หลักฐานยืนยันลำดับเหตุการณ์"))add("sequence_evidence","มีหลักฐานอะไรยืนยันลำดับเหตุการณ์ขณะมืออยู่ที่กล่องสกรูและ Jig เริ่มหมุน?","รายงานมีคำบอกเล่าเหตุการณ์ แต่ยังไม่เห็นหลักฐานยืนยันลำดับเวลา","high");
 }else if(caseType==="quality"){
   const map={
    "มาตรฐานของงาน":["quality_standard","ปกติงานนี้ต้องเป็นอย่างไร?","ยังไม่พบมาตรฐานของงาน","high"],
    "เงื่อนไขปล่อยงานหลัง Containment":["release_condition","งานที่กักหรือ Hold ไว้จะปล่อยได้เมื่อมีเงื่อนไขอะไร?","มี Containment แล้ว แต่ยังไม่เห็นเงื่อนไขปล่อยงาน","medium"],
    "หลักฐานที่ยืนยัน candidate cause":["cause_evidence","มีหลักฐานอะไรที่ยืนยันหรือหักล้างสาเหตุที่กำลังสงสัย?","มีสาเหตุที่ต้องพิสูจน์ แต่ยังไม่มีหลักฐานเชื่อม","high"],
    "จุดตรวจที่ควรพบก่อนปล่อยงาน":["escape_point","หลังปัญหาเกิด จุดไหนควรตรวจพบก่อนปล่อยงาน?","ยังไม่พบ Detection / Escape Point","high"],
    "สาเหตุที่จุดตรวจไม่พบ":["escape_why","ทำไมจุดตรวจนั้นจึงไม่พบหรือไม่หยุดปัญหา?","ยังไม่ทราบเหตุที่ Detection Point พลาด","medium"]
   };
   for(const m of missing)if(map[m])add(...map[m]);
 }
 return qs.slice(0,6);
}
function recommendedChecks(caseType,qs){
 const ids=new Set(qs.map(x=>x.id)),out=[];
 if(caseType==="safety"){
   if(ids.has("actual_layout_distance"))out.push("วัดระยะจริงระหว่างตำแหน่งกล่องสกรูกับขอบเขตการหมุนของ Jig");
   if(ids.has("jig_movement_trigger"))out.push("ตรวจเงื่อนไข/ลำดับการทำงานที่ทำให้ Jig เริ่มหมุน");
   if(ids.has("barrier_guard"))out.push("ตรวจว่ามี Guard / Interlock / อุปกรณ์ป้องกันการเข้าถึงจุดอันตรายหรือไม่");
   if(ids.has("sequence_evidence"))out.push("รวบรวมหลักฐานที่ยืนยันลำดับเหตุการณ์ เช่น กล้อง พยาน หรือข้อมูลจากเครื่อง");
 }
 return out;
}
function parseV12(raw){
 const domain=detectDomain(raw),meta=metadata(raw),segs=classifySegments(raw,domain.caseType),by=k=>segs.filter(x=>x.type===k).map(x=>x.sourceText);
 const standards=by("standard"),contain=by("containment"),evidence=by("evidence"),causes=by("candidate_cause"),escapes=by("escape_hypothesis"),actions=by("action");
 let statement="",actual="";
 for(const s of segs){if(s.type==="fact"&&/พบ|เกิดเหตุ|กระแทก|NG|บาดเจ็บ/i.test(s.sourceText)){statement=s.sourceText;break}}
 for(const s of segs){if(s.type==="fact"&&/พบ|NG|ไม่ครบ|ไม่ได้|ไม่พบ|กระแทก|บาดเจ็บ/i.test(s.sourceText)){actual=s.sourceText;break}}
 const problem={statement,standard:standards[0]||"",actual},missing=missingInfo(raw,domain.caseType,segs,problem,contain);
 const facts=decomposeFacts(raw,domain.caseType,meta,problem,contain),qs=nextQuestions(raw,domain.caseType,facts,missing,segs);
 const warnings=[];if(HUMAN.test(String(raw||"")))warnings.push("Human Error ต้องวิเคราะห์ต่อ");if(domain.caseType==="safety")warnings.push("Safety case: แยกข้อมูลได้ แต่ยังไม่รองรับ Quality-specific Coach flow");if(domain.caseType==="unknown")warnings.push("ยังไม่ทราบประเภทเคส ต้องยืนยัน Domain ก่อน Import");
 return {schemaVersion:2,...domain,metadata:meta,rawText:String(raw||""),segments:segs,problem,containment:contain,evidence,candidateCauses:causes,escapeCandidates:escapes,actions,factDecomposition:facts,missingInformation:missing,nextQuestions:qs,recommendedChecks:recommendedChecks(domain.caseType,qs),contradictions:contradictions(segs),warnings,gateEffects:{rootGateChanged:false,stageChanged:false,completedChanged:false}};
}


/* SMART_CASE_INTAKE_QUALITY_FIELD_REPORT_V1_3_1 */
function qualityFieldExtractV131(raw){
 const text=String(raw||""),lines=text.replace(/\r\n?/g,"\n").split("\n").map(clean).filter(Boolean);
 let problem="";
 const pats=[
  /(Unit\s+ที่ประกอบ\s+Screw\s+[A-Za-z0-9_-]+\s*แล้ว[^.\n]{0,100}?มีรอยแตก(?:\s*จำนวน\s*\d+\s*Unit)?)/i,
  /(Unit[^.\n]{0,100}?มีรอยแตก(?:\s*จำนวน\s*\d+\s*Unit)?)/i,
  /พบความผิดปกติ\s+([^.\n]+)/i
 ];
 for(const p of pats){const m=text.match(p);if(m){problem=clean(m[1]);break}}
 problem=problem.replace(/^ที่\s+/i,"").replace(/\s+/g," ").replace(/^[ .]+|[ .]+$/g,"");

 let quantity="",m=text.match(/จำนวน\s*(\d+)\s*Unit/i);if(m)quantity=m[1]+" Unit";
 let eventDate="",eventTime="";
 m=text.match(/วันที่\s+(.+?)\s+เวลา\s+(\d{1,2})[.:](\d{2})\s*(?:น\.?)?/i);
 if(m){eventDate=clean(m[1]);eventTime=String(Number(m[2])).padStart(2,"0")+":"+m[3]}
 let shift="";
 if(/\bDay\s*Shift\b|\bDayshift\b/i.test(text))shift="Day Shift";
 else if(/\bNight\s*Shift\b|\bNightshift\b|\bNight\b/i.test(text))shift="Night Shift";

 let area="";m=text.match(/(Cell\s+Develop\s+[A-Za-z0-9_-]+)/i);if(m)area=clean(m[1]);
 let detectionPoint="";m=text.match(/(ST\.\s*Main\s*1\s*,?\s*Main\s*2\s*Cell\s*1)/i)||text.match(/(ST\.[^\n]{0,80}?Cell\s*\d+)/i);if(m)detectionPoint=clean(m[1]);
 const location=[area,detectionPoint].filter(Boolean).join(" · ");

 let workActivity="";
 m=text.match(/ระหว่างการ(.+?)(?=\s*พนักงานพบ|\s*พบ\s*Unit|\s*พบความผิดปกติ|$)/is);
 if(m)workActivity=clean(m[1]);

 const containment=[];let inC=false;
 for(const line0 of lines){
   const line=clean(line0);
   if(/^การจัดการเบื้องต้น\s*:?\s*$/i.test(line)){inC=true;continue}
   if(inC){
     if(/^(?:จากการตรวจสอบ|มาตรการ|สาเหตุ|วิเคราะห์|Report by:)/i.test(line)){inC=false;continue}
     const item=line.replace(/^[-•]\s*/,"").trim();
     if(item&&/(แจ้ง|QC|QA|Stop\s*Shipping|Hold|กัก|ตรวจสอบ|Control)/i.test(item)&&!containment.includes(item))containment.push(item);
   }
 }
 return {problem,actual:problem,quantity,eventDate,eventTime,shift,area,detectionPoint,location,workActivity,containment};
}
function enhanceQualitySegmentsV131(segments,x){
 const out=[];let inC=false;
 for(const seg of (segments||[])){
  const item={...seg},t=clean(item.sourceText);
  if(/^รายละเอียด\s*:?\s*$/i.test(t))continue;
  if(/^การจัดการเบื้องต้น\s*:?\s*$/i.test(t)){inC=true;continue}
  if(inC){
    const c=t.replace(/^[-•]\s*/,"").trim();
    if(/(แจ้ง|QC|QA|Stop\s*Shipping|Hold|กัก|ตรวจสอบ|Control)/i.test(c)){
      item.sourceText=c;item.type="containment";item.confidence="high";item.reason="อยู่ใต้หัวข้อการจัดการเบื้องต้น";out.push(item);continue;
    }
  }
  if(x.problem&&(/พบความผิดปกติ/i.test(t)||(/รอยแตก/i.test(t)&&/จำนวน\s*\d+\s*Unit/i.test(t)))){
    item.type="fact";item.confidence="high";item.reason="เป็นข้อความที่ระบุปัญหาและจำนวนที่พบจริง";
  }else if(/^วันที่\s+/i.test(t)){
    item.type="fact";item.confidence="high";item.reason="เป็นวันเวลา/บริบทการตรวจพบที่รายงานไว้";
  }
  out.push(item);
 }
 return out;
}
function enhanceQualityV131(raw,out){
 out.parserBehaviorVersion="1.3.1";
 if(out.caseType!=="quality")return out;
 const x=qualityFieldExtractV131(raw);
 if(x.problem){out.problem.statement=x.problem;out.problem.actual=x.actual}
 for(const k of ["eventDate","eventTime","shift","location"])if(x[k]&&!out.metadata[k])out.metadata[k]=x[k];
 out.segments=enhanceQualitySegmentsV131(out.segments,x);

 const merged=[];
 for(const v of [...(out.containment||[]),...x.containment]){const c=clean(v);if(c&&!merged.includes(c))merged.push(c)}
 out.containment=merged;

 const f=out.factDecomposition||{};
 if(x.problem){f.event=x.problem;f.observedActual=x.actual}
 if(x.workActivity)f.workActivity=x.workActivity;
 if(x.detectionPoint)f.detectionPoint=x.detectionPoint;
 if(x.quantity)f.quantity=x.quantity;
 if(x.location)f.location=x.location;
 if(x.eventDate)f.eventDate=x.eventDate;
 if(x.eventTime)f.eventTime=x.eventTime;
 if(x.shift)f.shift=x.shift;
 if(merged.length)f.immediateResponse=merged.join("\n");
 out.factDecomposition=f;

 let missing=[...(out.missingInformation||[])];
 if(x.problem)missing=missing.filter(v=>v!=="เกิดอะไรขึ้น"&&v!=="สิ่งที่เกิดจริง");
 if(merged.length)missing=missing.filter(v=>v!=="Containment / การควบคุมทันที");
 out.missingInformation=missing;
 out.nextQuestions=nextQuestions(raw,"quality",f,missing,out.segments||[]);
 out.recommendedChecks=recommendedChecks("quality",out.nextQuestions);
 out.gateEffects={rootGateChanged:false,stageChanged:false,completedChanged:false};
 return out;
}

function parse(raw){return enhanceQualityV131(raw,parseV12(raw));}
const LABEL={fact:"ข้อเท็จจริง",standard:"มาตรฐาน",containment:"การควบคุมทันที",evidence:"หลักฐาน",candidate_cause:"สาเหตุที่ต้องพิสูจน์",escape_hypothesis:"สมมติฐานว่าทำไมไม่พบ",action:"มาตรการ",unknown:"ยังจัดกลุ่มไม่ได้"};
const FIELDS=[["event","เหตุการณ์ / ปัญหาที่พบ"],["observedActual","สิ่งที่เกิดจริง"],["workActivity","กิจกรรมขณะตรวจพบ"],["detectionPoint","จุดที่ตรวจพบ"],["quantity","จำนวนที่พบ"],["personAction","คนกำลังทำอะไร"],["equipmentAction","Jig / อุปกรณ์กำลังทำอะไร"],["location","พื้นที่ / จุดเกิดเหตุ"],["eventDate","วันที่"],["eventTime","เวลา"],["shift","กะ"],["impact","ผลกระทบ"],["immediateResponse","การควบคุมทันที"]];
const list=(items,empty="—")=>!items||!items.length?`<div class="sciEmpty">${h(empty)}</div>`:`<ul>${items.map(x=>`<li>${h(typeof x==="string"?x:(x.sourceText||x.reason||""))}</li>`).join("")}</ul>`;
function metadataHTML(m){
 const rows=[["ประเภท",m.category],["หัวข้อ",m.title],["ระดับ",m.severity],["สถานะ",m.status],["วันที่",m.eventDate],["เวลา",m.eventTime],["กะ",m.shift],["จุดเกิดเหตุ",m.location],["ผู้รายงาน",m.reporter]].filter(x=>x[1]);
 return rows.length?`<section><h4>ข้อมูลรายงาน</h4>${rows.map(x=>`<div><b>${h(x[0])}:</b> ${h(x[1])}</div>`).join("")}</section>`:"";
}
function factHTML(f){
 const rows=FIELDS.filter(([k])=>clean(f[k])).map(([k,label])=>`<div class="sciFactRow"><b>${h(label)}:</b> ${h(f[k])}</div>`).join("");
 return `<section class="sciFacts"><h4>เหตุการณ์ที่ระบบแตกให้</h4>${rows||'<div class="sciEmpty">ยังแตกข้อมูลไม่ได้</div>'}<div class="sciFoot">ระบบดึงจากข้อความต้นฉบับเท่านั้น · ช่องที่ไม่ชัดจะปล่อยว่าง</div></section>`;
}
function questionHTML(qs){
 if(!qs.length)return `<section><h4>Coach ถามต่อ</h4><div class="sciEmpty">ยังไม่มีคำถามเพิ่มจากกติกา V1.2</div></section>`;
 return `<section class="sciQuestions"><h4>Coach ถามต่อ</h4>${qs.map((q,i)=>`<div class="sciQ"><b>${i+1}. ${h(q.question)}</b><br><small>${h(q.reason)}</small></div>`).join("")}</section>`;
}
function renderResult(out){
 const compat=out.compatibleWithCurrentCoach?"รองรับ Quality Coach ปัจจุบัน":"ยังไม่ควร Import เข้า Quality Coach";
 const type=out.caseType==="safety"?"Safety / Accident":out.caseType==="quality"?"Quality":"Unknown";
 const groups=["fact","standard","containment","evidence","candidate_cause","escape_hypothesis","action","unknown"];
 return `<div class="sciResult">
 <div class="sciDomain"><b>Domain:</b> ${h(type)}<br><b>สถานะ:</b> ${h(compat)}<br><span>${h(out.domainReason)}</span></div>
 ${out.warnings.length?`<div class="sciWarn"><b>คำเตือน</b>${list(out.warnings)}</div>`:""}
 ${factHTML(out.factDecomposition)}
 ${questionHTML(out.nextQuestions)}
 ${out.recommendedChecks.length?`<section class="sciChecks"><h4>Coach แนะนำให้ตรวจต่อ</h4>${list(out.recommendedChecks)}</section>`:""}
 <div class="sciGrid">${metadataHTML(out.metadata)}${groups.map(g=>`<section><h4>${h(LABEL[g])}</h4>${list(out.segments.filter(x=>x.type===g))}</section>`).join("")}</div>
 <section class="sciMissing"><h4>ข้อมูลที่ยังขาด / ควรถามต่อ</h4>${list(out.missingInformation,"ยังไม่พบช่องว่างจากกติกา V1.2")}</section>
 ${out.contradictions.length?`<section class="sciWarn"><h4>ข้อมูลขัดแย้ง</h4>${out.contradictions.map(x=>`<div>• ${h(x.claimA)} ↔ ${h(x.claimB)}<br><small>${h(x.reason)}</small></div>`).join("")}</section>`:""}
 <div class="sciFoot">Preview only · ยังไม่เขียนข้อมูลเข้าเคสจริง · ไม่เปลี่ยน Root Cause Gate / Stage / Completed</div></div>`;
}
function build(){
 if(document.getElementById("smartIntakePreviewV1"))return;
 const root=document.createElement("div");root.id="smartIntakePreviewV1";
 root.innerHTML=`<style>
 #smartIntakePreviewV1{position:fixed;inset:8px;z-index:100006;background:#fff;border:2px solid #222;border-radius:14px;overflow:auto;padding:14px;font-family:system-ui,sans-serif}
 #smartIntakePreviewV1 .sciTop{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;position:sticky;top:0;background:#fff;padding-bottom:10px}
 #smartIntakePreviewV1 textarea{width:100%;min-height:220px;box-sizing:border-box;font:inherit;padding:10px;border:1px solid #aaa;border-radius:10px}
 #smartIntakePreviewV1 button{font:inherit;padding:9px 12px;border-radius:10px;border:1px solid #888;background:#fff}
 #smartIntakePreviewV1 button.primary{font-weight:700}
 #smartIntakePreviewV1 .actions{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}
 #smartIntakePreviewV1 .sciDomain,#smartIntakePreviewV1 .sciWarn,#smartIntakePreviewV1 .sciMissing,#smartIntakePreviewV1 .sciFacts,#smartIntakePreviewV1 .sciQuestions,#smartIntakePreviewV1 .sciChecks{border:1px solid #bbb;border-radius:10px;padding:10px;margin:10px 0}
 #smartIntakePreviewV1 .sciGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px}
 #smartIntakePreviewV1 section{border:1px solid #ddd;border-radius:10px;padding:10px}
 #smartIntakePreviewV1 h4{margin:0 0 6px}
 #smartIntakePreviewV1 ul{margin:5px 0 0;padding-left:20px}
 #smartIntakePreviewV1 .sciFactRow{margin:6px 0}
 #smartIntakePreviewV1 .sciQ{padding:8px 0;border-bottom:1px solid #eee}
 #smartIntakePreviewV1 .sciQ:last-child{border-bottom:0}
 #smartIntakePreviewV1 .sciEmpty,#smartIntakePreviewV1 small,#smartIntakePreviewV1 .sciFoot{opacity:.7}
 #smartIntakePreviewV1 .sciFoot{margin:10px 0 4px;font-size:12px}
 </style>
 <div class="sciTop"><div><b>Smart Case Intake V1.4.4 — Confirmed-evidence Handoff</b><br><small>ระบบแตกเหตุการณ์ให้ และ Coach ถามต่อจากช่องที่ยังขาด</small></div><button id="sciClose">ปิด</button></div>
 <textarea id="sciRaw" placeholder="วางรายงาน Quality / Safety ที่นี่..."></textarea>
 <div class="actions"><button class="primary" id="sciAnalyze">วิเคราะห์รายงาน</button><button id="sciClear">ล้าง</button></div>
 <div id="sciOutput"><div class="sciEmpty">ยังไม่ได้วิเคราะห์</div></div>`;
 document.body.appendChild(root);
 document.getElementById("sciClose").onclick=()=>root.remove();
 document.getElementById("sciClear").onclick=()=>{document.getElementById("sciRaw").value="";document.getElementById("sciOutput").innerHTML='<div class="sciEmpty">ยังไม่ได้วิเคราะห์</div>'};
 document.getElementById("sciAnalyze").onclick=()=>{const raw=document.getElementById("sciRaw").value;document.getElementById("sciOutput").innerHTML=renderResult(parse(raw))};
}
window.mEasyMateSmartIntakePreviewV1=Object.freeze({parse,detectDomain,splitSegments,open:build});
setTimeout(build,250);
})();

/* COACH_SMART_INTAKE_SAFE_IMPORT_V1_3 */
(function(){
"use strict";
const ACTIVE_KEY="measymate_qc_v1_active";
const BACKUP_PREFIX="measymate_qc_smart_intake_preimport_v13__";
const AUDIT_KEY="measymate_qc_smart_intake_import_audit_v13";
const esc=t=>String(t??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const clean=t=>String(t||"").trim();

function parser(){
  return window.mEasyMateSmartIntakePreviewV1 &&
         typeof window.mEasyMateSmartIntakePreviewV1.parse==="function"
    ? window.mEasyMateSmartIntakePreviewV1.parse : null;
}
function inScenario(){
  try{return new URLSearchParams(location.search).has("scenario")}catch(e){return false}
}
function reviewFields(out){
  const m=out.metadata||{},p=out.problem||{};
  const f=out.factDecomposition||{};
  const workContext=clean([f.workActivity||"",f.location||f.detectionPoint||""].filter(Boolean).join(" · "));
  return [
    {id:"workContext",label:"งาน / บริบทที่กำลังทำ",target:"data.workContext",value:workContext},
    {id:"problem",label:"ปัญหาที่พบ",target:"data.problem",value:clean(m.title||p.statement||"")},
    {id:"standard",label:"มาตรฐาน / สิ่งที่ควรเป็น",target:"data.expectedWork",value:clean(p.standard||"")},
    {id:"actual",label:"สิ่งที่เกิดจริง",target:"data.actualDeviation",value:clean(p.actual||p.statement||"")},
    {id:"containment",label:"การควบคุมเบื้องต้น",target:"data.protect",value:(out.containment||[]).map(clean).filter(Boolean).join("\n")},
    {id:"evidence",label:"หลักฐานที่มีแล้ว",target:"data.fact",value:(out.evidence||[]).map(clean).filter(Boolean).join("\n")}
  ];
}
function card(f){
  const has=!!clean(f.value);
  return `<label class="sciImportField">
    <div class="sciImportHead">
      <input type="checkbox" data-sci-import-check="${esc(f.id)}" ${has?"checked":""}>
      <b>${esc(f.label)}</b><small>→ ${esc(f.target)}</small>
    </div>
    <textarea data-sci-import-value="${esc(f.id)}">${esc(f.value)}</textarea>
  </label>`;
}
function blocked(out){
  let why="ยังไม่สามารถ Import เคสนี้เข้า Quality Coach ได้";
  if(out.caseType==="safety")why="เคส Safety แยกข้อมูลได้ แต่ห้าม Import เข้า Quality Coach";
  else if(out.caseType==="unknown")why="ยังไม่ทราบประเภทเคส ต้องยืนยัน Domain ก่อน";
  return `<section id="sciSafeImportV13" class="sciImportBlocked">
    <h4>Review & Safe Import V1.3</h4>
    <b>🔒 ${esc(why)}</b>
    <div class="sciFoot">Candidate Cause / Action / Root Cause จะไม่ถูกนำเข้าอัตโนมัติ</div>
  </section>`;
}
function qualityPanel(out){
  return `<section id="sciSafeImportV13" class="sciImportPanel">
    <h4>Review & Safe Import V1.3</h4>
    <div class="sciImportNotice">ตรวจ/แก้ข้อความก่อน แล้วเลือกเฉพาะข้อมูลที่ต้องการนำเข้าเป็น <b>เคส Quality ใหม่</b></div>
    ${reviewFields(out).map(card).join("")}
    <div class="sciLocked">🔒 <b>ไม่ Import อัตโนมัติ:</b> Candidate Cause, Escape Hypothesis, Action, Root Cause, Root Evidence และผล Verify</div>
    <label class="sciConfirmRow"><input type="checkbox" id="sciImportConfirmed"> ฉันตรวจข้อมูลด้านบนแล้ว และยืนยันให้นำเฉพาะช่องที่เลือกเข้า Coach</label>
    <button type="button" id="sciImportNewCase" class="primary">Import เป็นเคส Quality ใหม่</button>
    <div id="sciImportStatus" class="sciFoot"></div>
  </section>`;
}
function styles(){
  if(document.getElementById("sciImportV13Style"))return;
  const s=document.createElement("style");s.id="sciImportV13Style";
  s.textContent=`
  #smartIntakePreviewV1 .sciImportPanel,#smartIntakePreviewV1 .sciImportBlocked{border:2px solid #999;border-radius:12px;padding:12px;margin:12px 0}
  #smartIntakePreviewV1 .sciImportField{display:block;border:1px solid #ddd;border-radius:10px;padding:9px;margin:8px 0}
  #smartIntakePreviewV1 .sciImportHead{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px}
  #smartIntakePreviewV1 .sciImportHead small{margin-left:auto}
  #smartIntakePreviewV1 .sciImportField textarea{min-height:70px}
  #smartIntakePreviewV1 .sciLocked{padding:9px;border:1px dashed #999;border-radius:9px;margin:10px 0}
  #smartIntakePreviewV1 .sciConfirmRow{display:block;margin:10px 0}`;
  document.head.appendChild(s);
}

/* COACH_SMART_INTAKE_REVIEW_EDIT_V1_4_1 */
function enableMissingFieldEditing(panel){
  if(!panel)return;
  for(const ta of panel.querySelectorAll("[data-sci-import-value]")){
    if(ta.dataset.autoCheckBound==="1")continue;
    ta.dataset.autoCheckBound="1";
    ta.addEventListener("input",()=>{
      const id=ta.getAttribute("data-sci-import-value");
      const cb=panel.querySelector(`[data-sci-import-check="${id}"]`);
      if(cb && String(ta.value||"").trim())cb.checked=true;
    });
  }
}

/* COACH_SMART_INTAKE_REQUIRED_FIELDS_V1_4_3 */
function validateRequiredProblemFields(payload){
  const required=[
    ["workContext","งาน / บริบทที่กำลังทำ"],
    ["problem","ปัญหาที่พบ"],
    ["standard","มาตรฐาน / สิ่งที่ควรเป็น"],
    ["actual","สิ่งที่เกิดจริง"]
  ];
  return required
    .filter(([id])=>!String(payload[id]||"").trim())
    .map(([,label])=>label);
}

function selected(panel){
  const out={};
  for(const cb of panel.querySelectorAll("[data-sci-import-check]")){
    if(!cb.checked||cb.disabled)continue;
    const id=cb.getAttribute("data-sci-import-check");
    const ta=panel.querySelector(`[data-sci-import-value="${id}"]`);
    const v=clean(ta&&ta.value);
    if(v)out[id]=v;
  }
  return out;
}
function newCoreState(){
  if(typeof window.newState!=="function")throw new Error("ไม่พบ Core newState() — ยกเลิก Import เพื่อความปลอดภัย");
  const st=window.newState();
  if(!st||typeof st!=="object"||!st.data||typeof st.data!=="object")throw new Error("โครงสร้าง Coach state ไม่พร้อม — ยกเลิก Import");
  return st;
}
function applySafeFields(st,p){
  if(p.workContext)st.data.workContext=p.workContext;
  if(p.problem)st.data.problem=p.problem;
  if(p.standard)st.data.expectedWork=p.standard;
  if(p.actual)st.data.actualDeviation=p.actual;
  if(p.containment)st.data.protect=p.containment;
  if(p.evidence)st.data.fact=p.evidence;
  return st;
}
function backupActive(){
  const cur=localStorage.getItem(ACTIVE_KEY);
  if(cur===null)return "";
  const key=BACKUP_PREFIX+Date.now();
  localStorage.setItem(key,cur);
  return key;
}
function audit(out,p,backupKey){
  try{
    let arr=[];try{arr=JSON.parse(localStorage.getItem(AUDIT_KEY)||"[]")}catch(e){arr=[]}
    if(!Array.isArray(arr))arr=[];
    arr.push({version:"1.3",importedAt:new Date().toISOString(),caseType:out.caseType,selectedFields:Object.keys(p),backupKey:backupKey||"",sourceRawText:out.rawText||""});
    if(arr.length>20)arr=arr.slice(-20);
    localStorage.setItem(AUDIT_KEY,JSON.stringify(arr));
  }catch(e){}
}
function bind(out){
  const panel=document.getElementById("sciSafeImportV13");
  if(!panel||out.caseType!=="quality"||!out.compatibleWithCurrentCoach)return;
  const btn=document.getElementById("sciImportNewCase"),status=document.getElementById("sciImportStatus");
  if(!btn||btn.dataset.bound==="1")return;btn.dataset.bound="1";
  btn.addEventListener("click",()=>{
    if(inScenario()){status.textContent="Test Scenario กำลังทำงานอยู่ — ปิด scenario ก่อน Import";return}
    const c=document.getElementById("sciImportConfirmed");
    if(!c||!c.checked){status.textContent="กรุณาตรวจข้อมูลและติ๊กยืนยันก่อน Import";return}
    const payload=selected(panel);
    if(!Object.keys(payload).length){status.textContent="ยังไม่ได้เลือกข้อมูลสำหรับ Import";return}
    const missingRequired=validateRequiredProblemFields(payload);
    if(missingRequired.length){
      status.textContent="ยัง Import ไม่ได้ · กรุณาเติม/เลือกข้อมูลที่จำเป็นก่อน: "+missingRequired.join(", ");
      return;
    }
    if(!window.confirm("จะสร้างเคส Quality ใหม่จากเฉพาะข้อมูลที่คุณเลือก\n\nCandidate Cause / Action / Root Cause จะไม่ถูก Import และ Root Cause Gate จะไม่ถูกข้าม\n\nยืนยันดำเนินการ?"))return;
    try{
      const st=newCoreState();
      applySafeFields(st,payload);
      const backupKey=backupActive();
      localStorage.setItem(ACTIVE_KEY,JSON.stringify(st));
      audit(out,payload,backupKey);
      status.innerHTML=`✅ Import สำเร็จเป็นเคสใหม่ · นำเข้า ${Object.keys(payload).length} ช่อง · Core จะไปต่อจากข้อมูลที่ยืนยันแล้ว <button type="button" id="sciGoCoach">ไปทำต่อใน Coach</button>`;
      const go=document.getElementById("sciGoCoach");
      if(go)go.onclick=()=>{if(window.mEasyMateSmartIntakeHandoffV14){window.mEasyMateSmartIntakeHandoffV14.go()}else{try{const u=new URL(location.href);u.searchParams.delete("smartintake");u.searchParams.delete("v");location.href=u.toString()}catch(e){location.reload()}}};
    }catch(err){status.textContent="Import ไม่สำเร็จ: "+(err&&err.message?err.message:String(err))}
  });
}
function render(){
  const root=document.getElementById("smartIntakePreviewV1"),raw=document.getElementById("sciRaw"),output=document.getElementById("sciOutput"),p=parser();
  if(!root||!raw||!output||!p)return;
  const old=document.getElementById("sciSafeImportV13");if(old)old.remove();
  if(!clean(raw.value))return;
  const out=p(raw.value);
  output.insertAdjacentHTML("beforeend",out.caseType==="quality"&&out.compatibleWithCurrentCoach?qualityPanel(out):blocked(out));
  bind(out);
  enableMissingFieldEditing(document.getElementById("sciSafeImportV13"));
}
function install(){
  styles();
  const analyze=document.getElementById("sciAnalyze");
  if(!analyze||analyze.dataset.safeImportV13==="1")return false;
  analyze.dataset.safeImportV13="1";
  analyze.addEventListener("click",()=>setTimeout(render,0));
  return true;
}
let tries=0;
const timer=setInterval(()=>{tries++;if(install()||tries>100)clearInterval(timer)},100);
window.mEasyMateSmartIntakeSafeImportV13=Object.freeze({reviewFields,applySafeFields});
})();



/* COACH_SMART_INTAKE_HANDOFF_V1_4 */
(function(){
"use strict";

const ACTIVE_KEY="measymate_qc_v1_active";
const HANDOFF_KEY="measymate_qc_smart_intake_handoff_v14";
const ALLOWED_RESUME_STAGES=Object.freeze(["problem","protect","evidence","occ"]);
const clean=v=>String(v??"").trim();

function computeResumeStage(st){
  const d=(st&&st.data)||{};
  const problemReady=!!(clean(d.workContext)&&clean(d.problem)&&clean(d.expectedWork)&&clean(d.actualDeviation));
  if(!problemReady)return "problem";
  if(!clean(d.protect))return "protect";
  if(!clean(d.fact))return "evidence";
  return "occ";
}

function validateImportedState(st){
  if(!st||typeof st!=="object"||!st.data||typeof st.data!=="object"){
    throw new Error("ไม่พบเคสที่ Import ไว้");
  }
  if(Number(st.rootGate||0)!==0){
    throw new Error("Root Cause Gate ไม่ได้อยู่ที่ 0 — ยกเลิก Handoff เพื่อความปลอดภัย");
  }
  if(st.completed===true){
    throw new Error("เคสนี้ถูกระบุว่า Completed — ยกเลิก Handoff");
  }
}

function saveHandoff(st,stage){
  const handoff={
    version:"1.4",
    source:"smart_case_intake",
    resumeStage:stage,
    createdAt:new Date().toISOString(),
    fieldsPresent:{
      workContext:!!clean(st.data.workContext),
      problem:!!clean(st.data.problem),
      standard:!!clean(st.data.expectedWork),
      actual:!!clean(st.data.actualDeviation),
      containment:!!clean(st.data.protect),
      evidence:!!clean(st.data.fact)
    }
  };
  localStorage.setItem(HANDOFF_KEY,JSON.stringify(handoff));
  return handoff;
}

function go(){
  try{
    const raw=localStorage.getItem(ACTIVE_KEY);
    if(!raw)throw new Error("ไม่พบ Active Case หลัง Import");

    const st=JSON.parse(raw);
    validateImportedState(st);

    const stage=computeResumeStage(st);
    if(!ALLOWED_RESUME_STAGES.includes(stage)){
      throw new Error("Resume Stage อยู่นอกขอบเขตที่อนุญาต");
    }

    // V1.4 may resume only in pre-root stages.
    // Confirmed Evidence may resume to occ; never auto-resume to esc / root / action / verify / finish.
    st.stage = stage;
    st.smartIntakeHandoff={
      version:"1.4",
      resumeStage:stage,
      rootGateAtHandoff:Number(st.rootGate||0)
    };

    localStorage.setItem(ACTIVE_KEY,JSON.stringify(st));
    saveHandoff(st,stage);

    const u=new URL(location.href);
    u.searchParams.delete("smartintake");
    u.searchParams.delete("v");
    u.searchParams.set("handoff","smartintake14");
    location.href=u.toString();
  }catch(err){
    const status=document.getElementById("sciImportStatus");
    if(status)status.textContent="Handoff ไม่สำเร็จ: "+(err&&err.message?err.message:String(err));
    else alert("Handoff ไม่สำเร็จ");
  }
}

window.mEasyMateSmartIntakeHandoffV14=Object.freeze({
  computeResumeStage,
  go,
  allowedResumeStages:ALLOWED_RESUME_STAGES
});
})();


/* COACH_SMART_INTAKE_CORE_HANDOFF_V1_4_2 */

/* COACH_SMART_INTAKE_CONFIRMED_EVIDENCE_HANDOFF_V1_4_4
After explicit Review + Import confirmation:
- missing core problem fields -> problem
- missing containment -> protect
- missing evidence -> evidence
- confirmed evidence present -> occ
Never auto-resume to esc/root/action/verify/finish.
Root Gate remains 0.
*/
