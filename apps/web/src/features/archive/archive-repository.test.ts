import { expect, it } from 'bun:test';
import { groupArchive } from './archive-repository';

const row = (year: number, name: string, title: string) => ({
  year,
  name,
  paper: 'kirsch' as const,
  id: `${year}-${name}-${title}`,
  title,
  note: null,
  url: null,
});

it('wishes group into their seasons and lists in order', () => {
  const seasons = groupArchive(
    [2024, 2023],
    [
      row(2023, 'Mara', 'Tee'),
      row(2024, 'Mara', 'Buch'),
      row(2024, 'Mara', 'Schal'),
      row(2024, 'Jonas', 'Spiel'),
    ],
  );
  expect(seasons.map((season) => season.year)).toEqual([2024, 2023]);
  expect(seasons[0]?.lists.map((list) => list.name)).toEqual(['Mara', 'Jonas']);
  expect(seasons[0]?.lists[0]?.wishes.map((wish) => wish.title)).toEqual([
    'Buch',
    'Schal',
  ]);
  expect(seasons[1]?.lists.map((list) => list.name)).toEqual(['Mara']);
});

it('a season whose wishes were lost keeps an empty list', () => {
  expect(groupArchive([2025], [])).toEqual([{ year: 2025, lists: [] }]);
});
