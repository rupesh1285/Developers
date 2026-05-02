import React from 'react';

export default React.memo(function ProblemList({ 
  filteredProblems, solvedIds, starredIds, activeProblemId, 
  handleProblemClick, handleToggleSolved, handleToggleStar 
}) {
  return (
    <div className="problems-panel" id="problems-panel" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
      {filteredProblems.map((problem, index) => {
        const isSolved = solvedIds.includes(String(problem._id));
        const isStarred = starredIds.includes(String(problem._id));
        
        // 🌟 THE REVERSE ZEBRA: Intact and mathematically perfect
        const zebraClass = index % 2 === 0 ? 'zebra-odd' : 'zebra-even';

        return (
          <div 
            key={problem._id} 
            className={`problem-strip ${zebraClass} ${activeProblemId === String(problem._id) ? 'active-problem' : ''}`} 
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
      })}
    </div>
  );
});