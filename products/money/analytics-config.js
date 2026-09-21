(function(){
  "use strict";
  const config={
    projectId:"money",
    appVersion:"F2.1.12",
    dataSchemaVersion:3,
    localStatsEnabled:true,
    transportEnabled:false,
    endpoint:"",
    includeInstallId:true,
    retentionDays:90,
    allowEvents:[
      "app_open",
      "nav_today","nav_bills","nav_future","nav_overview","nav_review",
      "onboarding_started","onboarding_completed",
      "bill_saved","expense_saved","income_saved",
      "reserve_added","reserve_used",
      "saving_added","saving_withdrawn","dream_updated","week_closed",
      "backup_created","backup_shared","restore_used","safety_restore_used",
      "app_reset","runtime_error","system_test"
    ],
    allowMetaKeys:["view","action","result","kind"]
  };
  window.MEasyMateAnalyticsConfig=config;
  if(window.MEasyMateAnalytics)window.MEasyMateAnalytics.init(config);
})();
