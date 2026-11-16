import { signal } from '@angular/core';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { GalleryFilterComponent } from './gallery-filter.component';
import { GalleryListRepository } from '../../gallery-list.repository';
import { GalleryFilter } from '../../models';

function createRepository(initial: GalleryFilter = {}) {
  const filter = signal<GalleryFilter>(initial);
  return {
    filter,
    setFilter: vi.fn(async (f: GalleryFilter) => filter.set(f)),
  };
}

async function setup(
  inputs: Record<string, unknown> = {},
  repository = createRepository()
) {
  const result = await render(GalleryFilterComponent, {
    inputs,
    providers: [{ provide: GalleryListRepository, useValue: repository }],
  });
  return { ...result, repository };
}

describe('GalleryFilterComponent', () => {
  it('should show the repository filter', async () => {
    await setup(
      { entries: [{ id: 'title', value: 'Title' }] },
      createRepository({ title: 'abc' })
    );
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(1);
    expect(within(items[0]).getByText('Title')).toBeTruthy();
    expect(within(items[0]).getByText('abc')).toBeTruthy();
  });

  it('should show the filter input rather than the repository one', async () => {
    await setup({ filter: { dsc: 'x' } }, createRepository({ title: 'abc' }));
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(1);
    expect(within(items[0]).getByText('dsc')).toBeTruthy();
    expect(within(items[0]).getByText('x')).toBeTruthy();
  });

  it('should add a free metadatum and apply the filter', async () => {
    const user = userEvent.setup();
    const { repository, fixture } = await setup();
    expect(screen.getByText(/no filters/i)).toBeTruthy();

    const add = screen.getByRole('button', { name: 'add filter' });
    expect((add as HTMLButtonElement).disabled).toBe(true);

    await user.type(screen.getByRole('textbox', { name: 'name' }), 'title');
    await user.type(screen.getByRole('textbox', { name: 'value' }), 'abc');
    await fixture.whenStable();
    expect((add as HTMLButtonElement).disabled).toBe(false);
    await user.click(add);
    await fixture.whenStable();

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    // form is reset
    expect(
      (screen.getByRole('textbox', { name: 'name' }) as HTMLInputElement).value
    ).toBe('');

    await user.click(screen.getByRole('button', { name: /apply/ }));
    expect(repository.setFilter).toHaveBeenCalledWith({ title: 'abc' });
    expect(fixture.componentInstance.filter()).toEqual({ title: 'abc' });
  });

  it('should replace a metadatum with the same name', async () => {
    const user = userEvent.setup();
    const { fixture } = await setup({}, createRepository({ title: 'old' }));

    await user.type(screen.getByRole('textbox', { name: 'name' }), 'title');
    await user.type(screen.getByRole('textbox', { name: 'value' }), 'new');
    await fixture.whenStable();
    await user.click(screen.getByRole('button', { name: 'add filter' }));
    await fixture.whenStable();

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(1);
    expect(within(items[0]).getByText('new')).toBeTruthy();
  });

  it('should remove a metadatum', async () => {
    const user = userEvent.setup();
    const { fixture } = await setup(
      {},
      createRepository({ title: 'a', dsc: 'b' })
    );
    await user.click(
      screen.getByRole('button', { name: 'remove filter title' })
    );
    await fixture.whenStable();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(1);
    expect(within(items[0]).getByText('dsc')).toBeTruthy();
  });

  it('should reset and apply an empty filter', async () => {
    const user = userEvent.setup();
    const { repository } = await setup({}, createRepository({ title: 'a' }));
    await user.click(screen.getByRole('button', { name: /reset/ }));
    expect(repository.setFilter).toHaveBeenCalledWith({});
  });

  it('should use a select when entries are provided', async () => {
    await setup({
      entries: [
        { id: 'title', value: 'Title' },
        { id: 'dsc', value: 'Description' },
      ],
    });
    expect(screen.getByRole('combobox')).toBeTruthy();
    expect(screen.queryByRole('textbox', { name: 'name' })).toBeNull();
  });
});
