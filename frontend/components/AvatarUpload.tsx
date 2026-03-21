'use client';

import { useRef, useState } from 'react';

interface Props {
  currentUrl: string | null;
  username: string;
  onUpload: (dataUrl: string) => void;
}

export default function AvatarUpload({ currentUrl, username, onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d')!;
        // Cover crop
        const scale = Math.max(200 / img.width, 200 / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (200 - w) / 2, (200 - h) / 2, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPreview(dataUrl);
        onUpload(dataUrl);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          width: 88,
          height: 88,
          borderRadius: '50%',
          background: 'var(--bg-input)',
          border: '2px solid var(--border-mid)',
          overflow: 'hidden',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '2.2rem',
          fontWeight: 700,
          color: 'var(--gold-primary)',
          position: 'relative',
        }}
      >
        {preview
          ? <img src={preview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : (username[0]?.toUpperCase() ?? '?')}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer' }}
      >
        Change photo
      </button>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  );
}
