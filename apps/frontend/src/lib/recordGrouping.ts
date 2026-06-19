export type RecordGroup<T> = {
  key: string;
  label: string;
  items: T[];
};

export function dateInputValue(dateValue: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function dateParts(dateValue: string) {
  const date = new Date(dateValue);

  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
}

export function formatDate(dateValue: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    date.getFullYear(),
  ].join('/');
}

export function formatMonthYear(year: number, month: number) {
  return new Date(year, month - 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });
}

export function sortByDateAscending<T>(
  items: T[],
  getDateValue: (item: T) => string,
) {
  return [...items].sort(
    (firstItem, secondItem) =>
      new Date(getDateValue(firstItem)).getTime() -
      new Date(getDateValue(secondItem)).getTime(),
  );
}

export function groupByMonth<T>(
  items: T[],
  getYear: (item: T) => number,
  getMonth: (item: T) => number,
) {
  const groups = new Map<string, RecordGroup<T>>();

  items.forEach((item) => {
    const year = getYear(item);
    const month = getMonth(item);
    const key = `${year}-${String(month).padStart(2, '0')}`;

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: formatMonthYear(year, month),
        items: [],
      });
    }

    groups.get(key)?.items.push(item);
  });

  return [...groups.values()].sort((firstGroup, secondGroup) =>
    firstGroup.key.localeCompare(secondGroup.key),
  );
}

export function groupByParent<T, TParent>(
  parents: TParent[],
  items: T[],
  getParentId: (parent: TParent) => string,
  getParentLabel: (parent: TParent, index: number) => string,
  getItemParentId: (item: T) => string,
) {
  return parents
    .map((parent, index) => {
      const parentId = getParentId(parent);

      return {
        key: parentId,
        label: getParentLabel(parent, index),
        items: items.filter((item) => getItemParentId(item) === parentId),
      };
    })
    .filter((group) => group.items.length > 0);
}
