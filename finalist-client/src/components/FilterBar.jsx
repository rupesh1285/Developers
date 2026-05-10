import React, { useState, useEffect, useRef } from 'react';

export default React.memo(function FilterBar({
  searchQuery, onSearchChange,
  diffFilter, onDiffChange,
  statusFilter, onStatusChange,
  selectedTags, handleTagToggle,
  allTags
}) {
  // 🌟 UI STATE ISOLATION: These no longer trigger global list re-renders!
  const [diffOpen, setDiffOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [topicMenuOpen, setTopicMenuOpen] = useState(false);
  const [topicSearch, setTopicSearch] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const topicMenuRef = useRef(null);
  const searchInputRef = useRef(null);

  const availableTags = allTags.filter(t => !selectedTags.includes(t) && t.toLowerCase().includes(topicSearch.toLowerCase()));

  // Search Bar Typing Effect
  useEffect(() => {
    const typeTexts = ["Search 'Two Sum'", "Search 'Trapping Rain Water'", "Search 'LRU Cache'", "Search 'Valid Palindrome'", "Search 'Merge K Sorted Lists'"];
    let tIndex = 0, cIndex = 0, isDeleting = false, cursorBlink = true;
    let typeTimeout, blinkInterval;

    function typeEffect() {
      if (!searchInputRef.current) return;
      if (document.activeElement === searchInputRef.current) {
        searchInputRef.current.placeholder = "";
        typeTimeout = setTimeout(typeEffect, 500);
        return;
      }
      const current = typeTexts[tIndex];
      if (isDeleting) cIndex--; else cIndex++;
      let displayText = current.substring(0, cIndex);
      searchInputRef.current.placeholder = displayText + (cursorBlink ? "|" : "");
      let typeSpeed = isDeleting ? 30 : 60;
      if (!isDeleting && cIndex === current.length) { typeSpeed = 2000; isDeleting = true; }
      else if (isDeleting && cIndex === 0) { isDeleting = false; tIndex = (tIndex + 1) % typeTexts.length; typeSpeed = 500; }
      typeTimeout = setTimeout(typeEffect, typeSpeed);
    }

    typeTimeout = setTimeout(typeEffect, 1000);
    blinkInterval = setInterval(() => {
      if (document.activeElement !== searchInputRef.current && searchInputRef.current) {
        cursorBlink = !cursorBlink;
        if (cIndex === typeTexts[tIndex].length || cIndex === 0) {
          let displayText = typeTexts[tIndex].substring(0, cIndex);
          searchInputRef.current.placeholder = displayText + (cursorBlink ? "|" : "");
        }
      }
    }, 450);

    return () => { clearTimeout(typeTimeout); clearInterval(blinkInterval); };
  }, []);

  // Click Outside Handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.filter-pill')) { setDiffOpen(false); setStatusOpen(false); }
      if (topicMenuRef.current && !topicMenuRef.current.contains(e.target) && !e.target.closest('#topic-btn')) setTopicMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {mobileFiltersOpen && (
        <div className={`mobile-filter-overlay ${mobileFiltersOpen ? 'active' : ''}`} onClick={() => setMobileFiltersOpen(false)} />
      )}

      <div className="filters-section">
        <div className="search-wrapper">
          <i className="ri-search-line search-icon"></i>
          <input
            type="text"
            id="search-input"
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            autoComplete="off"
            placeholder="Search..."
            aria-label="Search problems"
          />
        </div>

        <button
          className={`mobile-filter-btn ${mobileFiltersOpen ? 'active' : ''}`}
          type="button"
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          aria-expanded={mobileFiltersOpen}
          aria-controls="filters-actions"
          aria-label="Toggle filters"
        >
          <i className="ri-equalizer-line"></i>
          {(selectedTags.length > 0 || diffFilter !== 'Difficulty' || statusFilter !== 'All Problems') && (
            <span className="mobile-filter-dot"></span>
          )}
        </button>

        <div className={`filters-actions ${mobileFiltersOpen ? 'mobile-open' : ''}`} id="filters-actions" role="dialog" aria-label="Filters">
          <div className="filter-sheet-header">
            <span className="filter-sheet-title">Filters</span>
            <button className="filter-sheet-close" type="button" onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters">
              <i className="ri-close-line"></i>
            </button>
          </div>
          <div className="filter-sheet-body">
            <div className="filter-sheet-label">Difficulty</div>
            {['Difficulty', 'Basic', 'Easy', 'Medium', 'Hard'].map(diff => (
              <button key={diff} type="button" className={`filter-sheet-option ${diffFilter === diff ? 'selected' : ''}`} onClick={() => { onDiffChange(diff); }}>
                <span>{diff === 'Difficulty' ? 'All Difficulties' : diff}</span>
                <i className="ri-check-line filter-check"></i>
              </button>
            ))}
            <div className="filter-sheet-divider"></div>
            <div className="filter-sheet-label">Status</div>
            {['All Problems', 'Solved', 'Unsolved', 'Starred'].map(status => (
              <button key={status} type="button" className={`filter-sheet-option ${statusFilter === status ? 'selected' : ''}`} onClick={() => { onStatusChange(status); }}>
                <span>{status}</span>
                <i className="ri-check-line filter-check"></i>
              </button>
            ))}
            <div className="filter-sheet-divider"></div>
            <div className="filter-sheet-label">
              Topics {selectedTags.length > 0 && (
                <button type="button" style={{ color: '#f87171', marginLeft: 8, cursor: 'pointer', fontWeight: 600, background: 'transparent', border: 'none' }} onClick={() => { handleTagToggle([]); }}>
                  Clear ({selectedTags.length})
                </button>
              )}
            </div>
            <div className="search-wrapper" style={{ marginBottom: 8, height: 40 }}>
              <i className="ri-search-line search-icon"></i>
              <input type="text" placeholder="Search tags..." value={topicSearch} onClick={e => e.stopPropagation()} onChange={(e) => { e.stopPropagation(); setTopicSearch(e.target.value); }} style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 14, width: '100%' }} />
            </div>
            <div className="filter-sheet-topics">
              {allTags.filter(t => t.toLowerCase().includes(topicSearch.toLowerCase())).map(tag => (
                <button key={tag} type="button" className={`topic-pill-item ${selectedTags.includes(tag) ? 'selected' : ''}`} onClick={(e) => { e.stopPropagation(); handleTagToggle(tag); }}>
                  {tag}
                  {selectedTags.includes(tag) && <i className="ri-close-line"></i>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="v2-filter-group">
          <div
            className={`v2-pill ${diffOpen ? 'active' : ''}`}
            onClick={() => { setDiffOpen(!diffOpen); setStatusOpen(false); setTopicMenuOpen(false); }}
            aria-expanded={diffOpen}
          >
            <span className="v2-pill-text">{diffFilter}</span>
            <i className="ri-arrow-down-s-line v2-pill-icon"></i>
            <div className="v2-dropdown">
              {['Difficulty', 'Basic', 'Easy', 'Medium', 'Hard'].map(diff => (
                <button key={diff} type="button" className="v2-dropdown-item" onClick={(e) => { e.stopPropagation(); onDiffChange(diff); setDiffOpen(false); }}>{diff}</button>
              ))}
            </div>
          </div>
          <div
            className={`v2-pill ${statusOpen ? 'active' : ''}`}
            onClick={() => { setStatusOpen(!statusOpen); setDiffOpen(false); setTopicMenuOpen(false); }}
            aria-expanded={statusOpen}
          >
            <span className="v2-pill-text">{statusFilter}</span>
            <i className="ri-arrow-down-s-line v2-pill-icon"></i>
            <div className="v2-dropdown">
              {['All Problems', 'Solved', 'Unsolved', 'Starred'].map(status => (
                <button key={status} type="button" className="v2-dropdown-item" onClick={(e) => { e.stopPropagation(); onStatusChange(status); setStatusOpen(false); }}>{status}</button>
              ))}
            </div>
          </div>
          <div className="filter-pill-wrapper" style={{ position: 'relative' }} ref={topicMenuRef}>
            <button
              type="button"
              className={`icon-btn filter-trigger ${selectedTags.length > 0 || topicMenuOpen ? 'active-filter' : ''}`}
              onClick={() => { setTopicMenuOpen(!topicMenuOpen); setDiffOpen(false); setStatusOpen(false); }}
              aria-expanded={topicMenuOpen}
              aria-label="Filter by topics"
            >
              <i className="ri-filter-3-line"></i>
              <div className="filter-badge" style={{ display: selectedTags.length > 0 ? 'flex' : 'none' }}>{selectedTags.length}</div>
            </button>
            <div className={`topic-menu ${topicMenuOpen ? 'active' : ''}`}>
              <div className="topic-header">
                <div className="topic-search-box">
                  <i className="ri-search-line"></i>
                  <input type="text" placeholder="Search tags..." value={topicSearch} onClick={e => e.stopPropagation()} onChange={(e) => { e.stopPropagation(); setTopicSearch(e.target.value); }} />
                </div>
                {selectedTags.length > 0 && <button type="button" className="clear-all-btn" onClick={() => { handleTagToggle([]); setTopicSearch(""); }}>Clear</button>}
              </div>
              {selectedTags.length > 0 && <div className="topics-container" style={{ display: 'flex' }}>{selectedTags.map(tag => (<button key={tag} type="button" className="topic-pill-item selected" onClick={(e) => { e.stopPropagation(); handleTagToggle(tag); }}>{tag} <i className="ri-close-line"></i></button>))}</div>}
              {selectedTags.length > 0 && <div className="topic-divider" style={{ display: 'block' }}></div>}
              <div className="topics-container">
                {availableTags.map(tag => (<button key={tag} type="button" className="topic-pill-item" onClick={(e) => { e.stopPropagation(); handleTagToggle(tag); }}>{tag}</button>))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});