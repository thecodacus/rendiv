import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Img } from '../components/Img';
import { getPendingHoldCount, _resetPendingHolds } from '../delay-render';

beforeEach(() => {
  _resetPendingHolds();
});

describe('Img', () => {
  it('renders an img element with src', () => {
    const { container } = render(<Img src="/test.png" alt="test" />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('/test.png');
    expect(img?.getAttribute('alt')).toBe('test');
  });

  it('calls holdRender on mount', () => {
    render(<Img src="/test.png" />);
    expect(getPendingHoldCount()).toBeGreaterThan(0);
  });

  it('releases hold on load', () => {
    const { container } = render(<Img src="/test.png" />);
    expect(getPendingHoldCount()).toBe(1);

    const img = container.querySelector('img')!;
    fireEvent.load(img);
    expect(getPendingHoldCount()).toBe(0);
  });

  it('releases hold on error', () => {
    const { container } = render(<Img src="/missing.png" />);
    expect(getPendingHoldCount()).toBe(1);

    const img = container.querySelector('img')!;
    fireEvent.error(img);
    expect(getPendingHoldCount()).toBe(0);
  });

  it('releases hold on unmount', () => {
    const { unmount } = render(<Img src="/test.png" />);
    expect(getPendingHoldCount()).toBe(1);

    unmount();
    expect(getPendingHoldCount()).toBe(0);
  });

  it('forwards onLoad and onError callbacks', () => {
    let loadCalled = false;
    let errorCalled = false;

    const { container, rerender } = render(
      <Img
        src="/test.png"
        onLoad={() => { loadCalled = true; }}
        onError={() => { errorCalled = true; }}
      />,
    );

    const img = container.querySelector('img')!;
    fireEvent.load(img);
    expect(loadCalled).toBe(true);

    // Reset and test error path
    _resetPendingHolds();
    rerender(
      <Img
        src="/fail.png"
        onLoad={() => { loadCalled = true; }}
        onError={() => { errorCalled = true; }}
      />,
    );

    const img2 = container.querySelector('img')!;
    fireEvent.error(img2);
    expect(errorCalled).toBe(true);
  });

  it('passes through standard img props', () => {
    const { container } = render(
      <Img src="/test.png" alt="photo" className="hero" width={800} height={600} />,
    );
    const img = container.querySelector('img')!;
    expect(img.getAttribute('class')).toBe('hero');
    expect(img.getAttribute('width')).toBe('800');
    expect(img.getAttribute('height')).toBe('600');
  });
});
