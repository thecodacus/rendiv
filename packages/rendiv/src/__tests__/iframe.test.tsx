import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { IFrame } from '../components/IFrame';
import { getPendingHoldCount, _resetPendingHolds } from '../delay-render';

beforeEach(() => {
  _resetPendingHolds();
});

describe('IFrame', () => {
  it('renders an iframe element with src', () => {
    const { container } = render(<IFrame src="https://example.com" />);
    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute('src')).toBe('https://example.com');
  });

  it('calls holdRender on mount', () => {
    render(<IFrame src="https://example.com" />);
    expect(getPendingHoldCount()).toBeGreaterThan(0);
  });

  it('releases hold on load', () => {
    const { container } = render(<IFrame src="https://example.com" />);
    expect(getPendingHoldCount()).toBe(1);

    const iframe = container.querySelector('iframe')!;
    fireEvent.load(iframe);
    expect(getPendingHoldCount()).toBe(0);
  });

  it('forwards onLoad callback', () => {
    let loadCalled = false;
    const { container } = render(
      <IFrame src="https://example.com" onLoad={() => { loadCalled = true; }} />,
    );

    const iframe = container.querySelector('iframe')!;
    fireEvent.load(iframe);
    expect(loadCalled).toBe(true);
  });

  it('releases hold on unmount', () => {
    const { unmount } = render(<IFrame src="https://example.com" />);
    expect(getPendingHoldCount()).toBe(1);

    unmount();
    expect(getPendingHoldCount()).toBe(0);
  });
});
