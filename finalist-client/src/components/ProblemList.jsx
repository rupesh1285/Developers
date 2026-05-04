import React, { memo } from 'react';

// 🌟 1. Extract the Row and MEMOIZE it. 
// This prevents 200+ elements from re-rendering every time you click one!
const ProblemRow = memo(({ 
  problem, index, isSolved, isStarred, isActive, 
  handleProblemClick, handleToggleSolved, handleToggleStar 
}) => {
  const zebraClass = index % 2 === 0 ? 'zebra-odd' : 'zebra-even';
  
  return (
    <div 
      className={`problem-strip ${zebraClass} ${isActive ? 'active-problem' : ''}`} 
      data-id={problem._id} 
      onClick={() => handleProblemClick(String(problem._id))}
    >
      <div className="problem-left">
        <span className="problem-number">{problem.problemNumber}.</span>
        <span className="problem-title">{problem.title}</span>
      </div>
      <div className="problem-right">
        <i 
          className={`${isSolved ? 'ri-checkbox-circle-fill checked' : 'ri-checkbox-blank-circle-line'} checkbox-icon`} 
          style={{ color: isSolved ? '#4ade80' : 'var(--text-muted)' }} 
          onClick={(e) => handleToggleSolved(e, String(problem._id))}
        ></i>
        <span className={`difficulty ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
        <i 
          className={`${isStarred ? 'ri-star-fill active' : 'ri-star-line'} star-icon`} 
          onClick={(e) => handleToggleStar(e, String(problem._id))}
        ></i>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // 🌟 THE MAGIC: Only re-render if the state of THIS SPECIFIC row changes
  return (
    prevProps.isActive === nextProps.isActive &&
    prevProps.isSolved === nextProps.isSolved &&
    prevProps.isStarred === nextProps.isStarred &&
    prevProps.problem._id === nextProps.problem._id
  );
});

// 🌟 2. The Main List Component
export default memo(function ProblemList({ 
  filteredProblems, solvedIds, starredIds, activeProblemId, 
  handleProblemClick, handleToggleSolved, handleToggleStar 
}) {
  return (
    <div className="problems-panel" id="problems-panel" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
      {filteredProblems.map((problem, index) => (
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