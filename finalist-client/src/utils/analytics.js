export function getLocalDateStr(dateInput = new Date()) {
  const clientOffset = new Date().getTimezoneOffset();
  const d = new Date(dateInput);
  return new Date(d.getTime() - (clientOffset * 60000)).toISOString().split('T')[0];
}

export function heatmapLevel(count) {
  if (count >= 10) return 4;
  if (count >= 6) return 3;
  if (count >= 3) return 2;
  if (count >= 1) return 1;
  return 0;
}

export function applySolvedToggleToAnalytics(prev, problemTags, isCurrentlySolved) {
  if (!prev) return prev;

  const todayStr = getLocalDateStr();
  const topics = prev.topics || [];
  const heatmap = prev.heatmap || [];

  const newTopics = topics.map((t) => {
    if (problemTags.includes(t.name)) {
      const currentSolvedCount = typeof t.solved === 'number' ? t.solved : 0;
      return { ...t, solved: Math.max(0, currentSolvedCount + (isCurrentlySolved ? -1 : 1)) };
    }
    return t;
  });

  const newHeatmap = heatmap.map((d) => {
    if (d.date !== todayStr) return d;
    const newCount = Math.max(0, d.count + (isCurrentlySolved ? -1 : 1));
    return { ...d, count: newCount, level: heatmapLevel(newCount) };
  });

  return { ...prev, topics: newTopics, heatmap: newHeatmap };
}

export async function fetchAnalytics(apiBase, token) {
  const tzOffset = String(new Date().getTimezoneOffset());
  const headers = { Authorization: `Bearer ${token}`, 'Timezone-Offset': tzOffset };
  const res = await fetch(`${apiBase}/api/progress/analytics`, { headers });
  if (!res.ok) throw new Error('Failed to fetch analytics');
  const data = await res.json();
  if (data && Array.isArray(data.heatmap) && Array.isArray(data.topics)) {
    localStorage.setItem('finalist_analytics_cache', JSON.stringify(data));
    return data;
  }
  throw new Error('Invalid analytics payload');
}
