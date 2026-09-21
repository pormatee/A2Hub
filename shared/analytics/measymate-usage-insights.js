/*
 * MEasyMate Usage Insights V1
 * Analyzes anonymous LOCAL event counters only.
 */
(function(global){
  "use strict";
  function analyze(summary){
    const s=summary||{};
    const counts=Object.assign({},s.event_counts||{});
    const entries=Object.entries(counts).sort((a,b)=>Number(b[1])-Number(a[1]));
    const navKeys=["nav_today","nav_bills","nav_future","nav_overview","nav_review"];
    const navTotal=navKeys.reduce((n,k)=>n+Number(counts[k]||0),0);
    const actionKeys=[
      "bill_saved","expense_saved","income_saved","reserve_added","reserve_used",
      "saving_added","saving_withdrawn","dream_updated","week_closed",
      "backup_created","backup_shared","restore_used","safety_restore_used"
    ];
    const actionTotal=actionKeys.reduce((n,k)=>n+Number(counts[k]||0),0);
    const activeDays=Array.isArray(s.active_days)?s.active_days.length:0;
    const topEvents=entries.slice(0,5).map(([event,count])=>({event,count:Number(count)}));
    const errors=Number(counts.runtime_error||0);
    let health="ยังมีข้อมูลน้อย";
    if(Number(s.total_events||0)>=10)health=errors===0?"ระบบทำงานปกติจากสถิติในเครื่อง":"มี Runtime error ที่ควรตรวจ";
    return {
      total_events:Number(s.total_events||0),
      active_days:activeDays,
      navigation_events:navTotal,
      action_events:actionTotal,
      runtime_errors:errors,
      top_events:topEvents,
      health
    };
  }
  function current(){
    if(!global.MEasyMateAnalytics||typeof global.MEasyMateAnalytics.getLocalSummary!=="function")return analyze({});
    return analyze(global.MEasyMateAnalytics.getLocalSummary());
  }
  global.MEasyMateUsageInsights=Object.freeze({analyze,current});
})(window);
