'use client';

interface Props {
  children: React.ReactNode;
  onClose: () => void;
  onSubmit?: (e: React.FormEvent) => void;
}

const cardStyle: React.CSSProperties = {
  width: 320, background: '#181818', borderRadius: 16, padding: 28,
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
  boxShadow: '0 24px 64px rgba(0,0,0,.6)', fontFamily: 'Inter,sans-serif',
};

export default function ModalShell({ children, onClose, onSubmit }: Props) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.6)' }}
      onClick={onClose}>
      {onSubmit ? (
        <form onClick={e => e.stopPropagation()} onSubmit={onSubmit} style={cardStyle}>{children}</form>
      ) : (
        <div onClick={e => e.stopPropagation()} style={cardStyle}>{children}</div>
      )}
    </div>
  );
}
