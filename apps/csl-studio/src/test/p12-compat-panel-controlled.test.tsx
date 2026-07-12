// P12 — IncompatibilityDetailsPanel 受控开关测试

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { IncompatibilityDetailsPanel } from '@/components/csl/IncompatibilityDetailsPanel';

function Harness({ initial }: { initial: boolean }) {
  const [open, setOpen] = useState(initial);
  return (
    <div>
      <button data-testid="ext-toggle" onClick={() => setOpen(true)}>外部打开</button>
      <span data-testid="state">{open ? 'open' : 'closed'}</span>
      <IncompatibilityDetailsPanel
        objectName="X"
        verdict="incompatible"
        origin="viewer"
        open={open}
        onOpenChange={setOpen}
        reasons={['r1']}
      />
    </div>
  );
}

describe('P12 — IncompatibilityDetailsPanel 受控用法', () => {
  it('外部置 true 时面板打开,关闭按钮回写 false', async () => {
    render(<Harness initial={false} />);
    expect(screen.getByTestId('state').textContent).toBe('closed');
    fireEvent.click(screen.getByTestId('ext-toggle'));
    expect(await screen.findByText(/兼容性详情/)).toBeInTheDocument();
    expect(screen.getByTestId('state').textContent).toBe('open');
    fireEvent.click(screen.getByRole('button', { name: '关闭' }));
    expect(screen.getByTestId('state').textContent).toBe('closed');
  });

  it('受控初始 true → 面板渲染时即可见', async () => {
    render(<Harness initial={true} />);
    expect(await screen.findByText(/兼容性详情/)).toBeInTheDocument();
  });
});
