import React from 'react';
import StreakWidget from './StreakWidget';
import ActivityHeatmap from './ActivityHeatmap';
import TopicCluster from './TopicCluster';

export default React.memo(function AnalyticsPanel({ data, onBubbleClick }) {
  // 🌟 Prevents crashing if the backend data is still loading
  if (!data) return null;

  return (
    <>
      <StreakWidget data={data} />
      <ActivityHeatmap data={data} />
      <TopicCluster data={data} onBubbleClick={onBubbleClick} />
    </>
  );
});