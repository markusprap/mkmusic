'use client';
import ModalShell from './ModalShell';

interface Props {
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmModal({ message, confirmLabel = 'Ya', danger, onConfirm, onClose }: Props) {
  return (
    <ModalShell onClose={onClose}>
      <p style={{ fontSize: 15, color: '#fff', textAlign: 'center', marginBottom: 20, lineHeight: 1.5 }}>{message}</p>
      <div style={{ display: 'flex', gap: 8, width: '100%' }}>
        <button onClick={onClose} style={{
          flex: 1, background: 'transparent', color: '#b3b3b3', border: '1px solid rgba(255,255,255,.25)', borderRadius: 24, padding: '12px',
          fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Batal
        </button>
        <button onClick={() => { onConfirm(); onClose(); }} style={{
          flex: 1, background: danger ? '#f44336' : '#1db954', color: danger ? '#fff' : '#000', border: 'none', borderRadius: 24, padding: '12px',
          fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}
