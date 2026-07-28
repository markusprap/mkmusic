export default function ScrollArrows({ canPrev, canNext, onPrev, onNext }: { canPrev: boolean; canNext: boolean; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="scroll-arrows">
      <button className="topbar-nav-btn" disabled={!canPrev} onClick={onPrev} title="Sebelumnya">
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <button className="topbar-nav-btn" disabled={!canNext} onClick={onNext} title="Selanjutnya">
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  );
}
