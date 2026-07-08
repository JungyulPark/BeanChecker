"use client";

/**
 * 별점 0.5 단위 (0.5–5.0). 반쪽 터치 영역 10개 — 탭 1회로 입력 완료.
 */
function Star({ fill }: { fill: number }) {
  const id = `star-${Math.round(fill * 100)}`;
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full">
      <defs>
        <linearGradient id={id}>
          <stop offset={`${fill * 100}%`} stopColor="var(--color-amber-glow)" />
          <stop offset={`${fill * 100}%`} stopColor="var(--color-roast-700)" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${id})`}
        d="M12 2l2.9 6.26 6.6.72-4.9 4.55 1.34 6.47L12 16.77 6.06 20l1.34-6.47L2.5 8.98l6.6-.72L12 2z"
      />
    </svg>
  );
}

export function StarRating({
  value,
  onChange,
  size = 36,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-1" role={onChange ? "radiogroup" : undefined}>
      {stars.map((star) => {
        const fill = Math.max(0, Math.min(1, value - (star - 1)));
        return (
          <div key={star} className="relative" style={{ width: size, height: size }}>
            <Star fill={fill} />
            {onChange && (
              <>
                <button
                  type="button"
                  aria-label={`${star - 0.5}점`}
                  className="absolute inset-y-0 left-0 w-1/2"
                  onClick={() => onChange(star - 0.5)}
                />
                <button
                  type="button"
                  aria-label={`${star}점`}
                  className="absolute inset-y-0 right-0 w-1/2"
                  onClick={() => onChange(star)}
                />
              </>
            )}
          </div>
        );
      })}
      <span className="font-mono ml-2 text-h2 text-crema-100">
        {value > 0 ? value.toFixed(1) : "–"}
      </span>
    </div>
  );
}
