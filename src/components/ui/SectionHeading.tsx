import React from 'react';

interface SectionHeadingProps {
  children: React.ReactNode;
  /** UPPERCASE micro-label treatment for an athletic cue (use sparingly). */
  uppercase?: boolean;
  className?: string;
  /** Optional content rendered to the right of the heading text. */
  trailing?: React.ReactNode;
}

/** Screen section title (built on .section-heading). */
const SectionHeading: React.FC<SectionHeadingProps> = ({
  children,
  uppercase = false,
  className = '',
  trailing,
}) => (
  <h2
    className={`section-heading ${uppercase ? 'uppercase tracking-[0.05em]' : ''} ${className} ${trailing ? 'flex items-center justify-between' : ''}`}
  >
    <span>{children}</span>
    {trailing && <span className="ml-2 flex items-center">{trailing}</span>}
  </h2>
);

export default SectionHeading;
