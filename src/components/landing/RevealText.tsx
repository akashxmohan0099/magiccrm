"use client";

import { Fragment, useEffect, useRef } from "react";
import styles from "./RevealText.module.css";

const REVEAL_LINES = [
  { split: "word", text: "You are an artist.", green: false, start: 0.02, end: 0.09 },
  { split: "word", text: "You are a business owner.", green: false, start: 0.17, end: 0.26 },
  { split: "word", text: "You are not an admin.", green: false, start: 0.34, end: 0.43 },
  { split: "char", text: "Don't waste your time!", green: true, start: 0.5, end: 0.66 },
] as const;

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export function RevealText() {
  const trackRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const text = textRef.current;
    if (!track || !text) return;

    const wordEls = Array.from(text.querySelectorAll<HTMLSpanElement>(`.${styles.w}`));

    let ticking = false;
    const update = () => {
      const rect = track.getBoundingClientRect();
      const scrollable = track.offsetHeight - window.innerHeight;
      const p = scrollable > 0 ? clamp(-rect.top / scrollable, 0, 1) : 0;
      for (const el of wordEls) {
        const t = parseFloat(el.dataset.t || "0");
        el.classList.toggle(styles.on, p >= t);
      }
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          update();
          ticking = false;
        });
        ticking = true;
      }
    };
    const onResize = () => update();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div ref={trackRef} className={styles.track}>
      <div className={styles.sticky}>
        <h2 ref={textRef} className={styles.text}>
          {REVEAL_LINES.map((line, li) => {
            const tokens =
              line.split === "word"
                ? line.text.split(/(\s+)/)
                : Array.from(line.text);
            const units = tokens.filter((t) => !/^\s+$/.test(t) && t !== " ");
            let idx = 0;
            const isLast = li === REVEAL_LINES.length - 1;
            return (
              <Fragment key={li}>
                {tokens.map((tok, ti) => {
                  if (/^\s+$/.test(tok) || tok === " ") {
                    return <Fragment key={ti}> </Fragment>;
                  }
                  const t = line.start + ((idx + 1) / units.length) * (line.end - line.start);
                  idx++;
                  const cls = `${styles.w}${line.green ? ` ${styles.wGreen}` : ""}`;
                  return (
                    <span key={ti} className={cls} data-t={t.toFixed(4)}>
                      {tok}
                    </span>
                  );
                })}
                {isLast ? null : <br />}
              </Fragment>
            );
          })}
        </h2>
      </div>
    </div>
  );
}
