import React, { useEffect, useRef, useState } from "react";

type RevealOnScrollProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
  yOffset?: number;
  as?: React.ElementType;
  id?: string;
};

export const RevealOnScroll: React.FC<RevealOnScrollProps> = ({
  children,
  className = "",
  delay = 0,
  duration = 0.6,
  once = true,
  yOffset = 24,
  as: Component = "div",
  id,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once && ref.current) {
            observer.unobserve(ref.current);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        root: null,
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.1,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [once]);

  return (
    <Component
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : `translateY(${yOffset}px)`,
        filter: isVisible ? "blur(0px)" : "blur(4px)",
        transition: `opacity ${duration}s ease-out ${delay}s, transform ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, filter ${duration}s ease-out ${delay}s`,
      }}
      {...(Component === "section" && id ? { id } : {})}
    >
      {children}
    </Component>
  );
};

export default RevealOnScroll;
