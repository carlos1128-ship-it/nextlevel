import React, { useState, useEffect } from 'react';
import './hero-title.css';

/**
 * HeroTyped
 * Animated typewriter component that cycles through words.
 * Renders the changing word (lime green) + blinking cursor.
 */
const HeroTyped = () => {
  const words = ["vendas", "atendimento", "financeiro"];
  const TYPE_SPEED = 38;
  const DELETE_SPEED = 22;
  const PAUSE_AFTER = 700;
  const PAUSE_BEFORE = 100;
  const INITIAL_DELAY = 200;

  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setStarted(true), INITIAL_DELAY);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!started) return;
    const currentWord = words[wordIndex];
    const delay = deleting
      ? charIndex === 0 ? PAUSE_BEFORE : DELETE_SPEED
      : charIndex === currentWord.length ? PAUSE_AFTER : TYPE_SPEED;

    const t = window.setTimeout(() => {
      if (!deleting) {
        if (charIndex < currentWord.length) setCharIndex(c => c + 1);
        else setDeleting(true);
      } else {
        if (charIndex > 0) setCharIndex(c => c - 1);
        else { setDeleting(false); setWordIndex(w => (w + 1) % words.length); }
      }
    }, delay);
    return () => window.clearTimeout(t);
  }, [started, wordIndex, charIndex, deleting]);

  const visible = words[wordIndex].slice(0, charIndex);

  return (
    <span className="nl-typed-wrapper">
      <span className="nl-typed-word">{visible}</span>
      <span className="nl-cursor-blink nl-typed-cursor">|</span>
    </span>
  );
};

/**
 * HeroTitle
 * The full h1 block used in the hero section.
 * Pass `loaded={true}` to trigger the entrance animation.
 */
const HeroTitle = ({ loaded = true }: { loaded?: boolean }) => (
  <h1
    className="nl-hero-title"
    style={{
      opacity: loaded ? 1 : 0,
      transform: loaded ? 'translateY(0)' : 'translateY(10px)',
      transitionDelay: '250ms',
    }}
  >
    <span className="nl-title-line">O sistema de gestão</span>
    <span className="nl-title-line">com ia para controlar</span>
    <span className="nl-title-line nl-title-line-typed">
      <HeroTyped />
    </span>
  </h1>
);

export { HeroTyped, HeroTitle };
export default HeroTitle;
