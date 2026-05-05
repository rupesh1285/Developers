import React, { memo, useState, useEffect, useRef, useLayoutEffect } from 'react';

const ProblemRow = memo(({ 
  problem, index, isSolved, isStarred, isActive, 
  handleProblemClick, handleToggleSolved, handleToggleStar 
}) => {
  const zebraClass = index % 2 === 0 ? 'zebra-odd' : 'zebra-even';
  const onRowKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleProblemClick(String(problem._id));
    }
  };
  
  return (
    <div 
      className={`problem-strip ${zebraClass} ${isActive ? 'active-problem' : ''}`} 
      data-id={problem._id} 
      onClick={() => handleProblemClick(String(problem._id))}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      aria-label={`${problem.problemNumber}. ${problem.title}`}
      onKeyDown={onRowKeyDown}
    >
      <div className="problem-left">
        <span className="problem-number">{problem.problemNumber}.</span>
        <span className="problem-title">{problem.title}</span>
      </div>
      <div className="problem-right">
        <button
          type="button"
          className={`${isSolved ? 'ri-checkbox-circle-fill checked' : 'ri-checkbox-blank-circle-line'} checkbox-icon`}
          style={{ color: isSolved ? '#4ade80' : 'var(--text-muted)' }}
          onClick={(e) => handleToggleSolved(e, String(problem._id))}
          aria-pressed={isSolved}
          aria-label={isSolved ? "Mark as unsolved" : "Mark as solved"}
        ></button>
        <span className={`difficulty ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
        <button
          type="button"
          className={`${isStarred ? 'ri-star-fill active' : 'ri-star-line'} star-icon`}
          onClick={(e) => handleToggleStar(e, String(problem._id))}
          aria-pressed={isStarred}
          aria-label={isStarred ? "Remove from starred" : "Add to starred"}
        ></button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.isActive === nextProps.isActive &&
    prevProps.isSolved === nextProps.isSolved &&
    prevProps.isStarred === nextProps.isStarred &&
    prevProps.problem._id === nextProps.problem._id
  );
});

export default memo(function ProblemList({ 
  filteredProblems, solvedIds, starredIds, activeProblemId, 
  handleProblemClick, handleToggleSolved, handleToggleStar,
  filterKey
}) {
  // 🌟 THE MAGIC: Only render 25 items to start
  const [visibleCount, setVisibleCount] = useState(25);
  const listRef = useRef(null);
  const scrollTopRef = useRef(0);
  const lastFilterKeyRef = useRef(filterKey);

  // Reset visible count only when filters (not status toggles) change
  useEffect(() => {
    setVisibleCount(25);
    if (listRef.current) listRef.current.scrollTop = 0;
    lastFilterKeyRef.current = filterKey;
  }, [filterKey]);

  // Clamp visible count if the filtered list shrinks
  useEffect(() => {
    setVisibleCount(prev => {
      const nextLen = filteredProblems.length || 0;
      if (nextLen === 0) return 0;
      if (prev === 0) return Math.min(25, nextLen);
      return Math.min(prev, nextLen);
    });
  }, [filteredProblems.length]);

  useLayoutEffect(() => {
    if (!listRef.current) return;
    if (lastFilterKeyRef.current !== filterKey) return;
    listRef.current.scrollTop = scrollTopRef.current;
  }, [solvedIds, starredIds, filterKey]);

  // Handle native scroll to load more items gracefully
  const handleScroll = () => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    scrollTopRef.current = scrollTop;
    
    // If the user scrolls within 200px of the bottom, load 25 more
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      if (visibleCount < filteredProblems.length) {
        // Use requestAnimationFrame to prevent scroll blocking
        requestAnimationFrame(() => {
          setVisibleCount(prev => Math.min(prev + 25, filteredProblems.length));
        });
      }
    }
  };

  return (
    <div 
      className="problems-panel" 
      id="problems-panel" 
      ref={listRef}
      onScroll={handleScroll}
      style={{ flex: 1, minHeight: 0, overflowY: 'auto', willChange: 'transform' }}
    >
      {filteredProblems.slice(0, visibleCount).map((problem, index) => (
        <ProblemRow
          key={problem._id}
          problem={problem}
          index={index}
          isSolved={solvedIds.includes(String(problem._id))}
          isStarred={starredIds.includes(String(problem._id))}
          isActive={activeProblemId === String(problem._id)}
          handleProblemClick={handleProblemClick}
          handleToggleSolved={handleToggleSolved}
          handleToggleStar={handleToggleStar}
        />
      ))}
    </div>
  );
});