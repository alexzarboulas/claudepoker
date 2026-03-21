'use client';

interface Props {
  lastSeen: string | null;
  hasActiveRoom?: boolean;
  size?: number;
}

export default function PresenceDot({ lastSeen, hasActiveRoom = false, size = 10 }: Props) {
  const now = Date.now();
  const last = lastSeen ? new Date(lastSeen).getTime() : 0;
  const diffMin = (now - last) / 60000;

  let color = '#555';
  let label = 'Offline';

  if (diffMin < 2) {
    if (hasActiveRoom) {
      color = '#f59e0b'; // amber — in game
      label = 'In Game';
    } else {
      color = '#22c55e'; // green — online
      label = 'Online';
    }
  }

  return (
    <span
      title={label}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
        boxShadow: diffMin < 2 ? `0 0 6px ${color}88` : 'none',
      }}
    />
  );
}
