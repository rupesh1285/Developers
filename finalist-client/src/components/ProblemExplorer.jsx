import React, { useState, useMemo, useDeferredValue, useCallback } from 'react';
import ProgressHeader from './ProgressHeader';
import FilterBar from './FilterBar';
import ProblemList from './ProblemList';

export default React.memo(function ProblemExplorer({
  problemsData,
  solvedIds,
  starredIds,
  analyticsData,
  activeProblemId,
  handleProblemClick,
  handleToggleSolved,
  handleToggleStar,
  selectedTags,
  handleTagToggle,
  isWorkspaceOpen
}) {
  // --- CORE FILTER STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery); 
  
  const [diffFilter, setDiffFilter] = useState(localStorage.getItem("finalist_diff") || 'Difficulty');
  const [statusFilter, setStatusFilter] = useState(localStorage.getItem("finalist_status") || 'All Problems');

  // Stable handlers for saving filter state
  const handleDiffChange = useCallback((diff) => {
    setDiffFilter(diff);
    localStorage.setItem("finalist_diff", diff);
  }, []);

  const handleStatusChange = useCallback((status) => {
    setStatusFilter(status);
    localStorage.setItem("finalist_status", status);
  }, []);

  // --- DATA CRUNCHING (Memoized for performance) ---
  const allTags = useMemo(() => {
    const tags = new Set();
    problemsData.forEach(p => p.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [problemsData]);

  const stats = useMemo(() => {
    const total = problemsData.length, solved = solvedIds.length;
    const getLevelStats = (level) => {
      const levelTotal = problemsData.filter(p => p.difficulty === level).length;
      const levelSolved = problemsData.filter(p => p.difficulty === level && solvedIds.includes(String(p._id))).length;
      return { total: levelTotal, solved: levelSolved, pct: levelTotal === 0 ? 0 : (levelSolved / levelTotal) * 100 };
    };
    return {
      total, solved, circleOffset: 314 - ((total === 0 ? 0 : solved / total) * 314),
      basic: getLevelStats('Basic'), easy: getLevelStats('Easy'), medium: getLevelStats('Medium'), hard: getLevelStats('Hard')
    };
  }, [problemsData, solvedIds]);

  const filteredProblems = useMemo(() => {
    return problemsData.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(deferredSearchQuery.toLowerCase());
      const matchesDiff = diffFilter === 'Difficulty' || p.difficulty === diffFilter;
      let matchesStatus = true;
      if (statusFilter === 'Solved') matchesStatus = solvedIds.includes(String(p._id));
      if (statusFilter === 'Unsolved') matchesStatus = !solvedIds.includes(String(p._id));
      if (statusFilter === 'Starred') matchesStatus = starredIds.includes(String(p._id));
      const matchesTags = selectedTags.length === 0 || (p.tags && p.tags.some(t => selectedTags.includes(t)));
      return matchesSearch && matchesDiff && matchesStatus && matchesTags;
    });
  }, [problemsData, deferredSearchQuery, diffFilter, statusFilter, solvedIds, starredIds, selectedTags]);

  // --- RENDER ---
  return (
    <div className={`middle-panel ${!isWorkspaceOpen ? 'expanded' : ''}`}>
      
      <ProgressHeader 
        stats={stats} 
        analyticsData={analyticsData} 
      />
      
      <FilterBar 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        diffFilter={diffFilter}
        onDiffChange={handleDiffChange}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
        selectedTags={selectedTags}
        handleTagToggle={handleTagToggle}
        allTags={allTags}
      />

      <ProblemList 
        filteredProblems={filteredProblems}
        solvedIds={solvedIds}
        starredIds={starredIds}
        activeProblemId={activeProblemId}
        handleProblemClick={handleProblemClick}
        handleToggleSolved={handleToggleSolved}
        handleToggleStar={handleToggleStar}
      />

    </div>
  );
});