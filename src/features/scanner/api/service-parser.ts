
export interface ParsedServiceData {
  date: string;
  mileage: string;
  serviceName: string;
  totalCost: string;
  currency: 'BYN' | 'USD' | 'EUR' | 'PLN' | 'GBP' | 'RUB';
  workshop: string;
  rawText: string;
}

const CURRENCIES = [
  'BYN',
  'USD',
  'EUR',
  'PLN',
  'GBP',
  'RUB',
] as const;

type SupportedCurrency = (typeof CURRENCIES)[number];

function getLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseDate(text: string): string {
  const lines = getLines(text);

  const orderLine = lines.find((line) =>
    /заказ[-\s]?наряд|service order/i.test(line),
  );

  const datePattern =
    /(\d{1,2})[./-](\d{1,2})[./-](\d{4})/;

  const match =
    orderLine?.match(datePattern) ??
    text.match(
      /(?:дата|date)\s*[:\-]?\s*(\d{1,2})[./-](\d{1,2})[./-](\d{4})/i,
    );

  if (!match) {
    return '';
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(
    Date.UTC(year, month - 1, day),
  );

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return '';
  }

  return [
    year,
    String(month).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-');
}

function parseMileage(text: string): string {
  const lines = getLines(text);

  const normalizeMileage = (
    value: string,
  ): string => {
    const cleaned = value
      .replace(/[\s\u00A0\u202F]/g, '')
      .replace(/(?:км|km)$/i, '');

    if (!/^\d{1,8}$/.test(cleaned)) {
      return '';
    }

    const mileage = Number(cleaned);

    if (
      !Number.isSafeInteger(mileage) ||
      mileage < 0 ||
      mileage > 10_000_000
    ) {
      return '';
    }

    return String(mileage);
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    // Do not use \b after Cyrillic words.
    const labelMatch = line.match(
      /пробег|mileage|odometer/i,
    );

    if (!labelMatch) {
      continue;
    }

    const afterLabel = line
      .slice(
        (labelMatch.index ?? 0) +
          labelMatch[0].length,
      )
      .replace(/^[\s:№#–—-]+/, '');

    // Example: Пробег: 126665 км
    const sameLineMatch = afterLabel.match(
      /^(\d[\d\s\u00A0\u202F]*)(?:\s*(?:км|km))?$/i,
    );

    if (sameLineMatch) {
      const mileage = normalizeMileage(
        sameLineMatch[1],
      );

      if (mileage) {
        return mileage;
      }
    }

    // Example:
    // Пробег
    // 126665
    for (
      let j = i + 1;
      j < Math.min(i + 4, lines.length);
      j += 1
    ) {
      const nextLine = lines[j];

      if (
        /^(?:выполненные работы|наименование работ|автомобиль|марка|модель|дата)/i.test(
          nextLine,
        )
      ) {
        break;
      }

      const numberMatch = nextLine.match(
        /^(\d[\d\s\u00A0\u202F]*)(?:\s*(?:км|km))?$/i,
      );

      if (!numberMatch) {
        continue;
      }

      const mileage = normalizeMileage(
        numberMatch[1],
      );

      if (mileage) {
        return mileage;
      }
    }
  }

  return '';
}

function parseCurrency(
  text: string,
): SupportedCurrency {
  if (
    /\b(BYN|BYR)\b|белорусск\w*\s+рубл|бел\.\s*руб/i.test(
      text,
    )
  ) {
    return 'BYN';
  }

  if (
    /\bUSD\b|US\s*\$|доллар(?:а|ов)?/i.test(
      text,
    )
  ) {
    return 'USD';
  }

  if (/\bEUR\b|€|евро/i.test(text)) {
    return 'EUR';
  }

  if (/\bPLN\b|zł|злот(?:ый|ых)/i.test(text)) {
    return 'PLN';
  }

  if (/\bGBP\b|£/i.test(text)) {
    return 'GBP';
  }

  if (
    /\bRUB\b|₽|российск\w*\s+рубл/i.test(
      text,
    )
  ) {
    return 'RUB';
  }

  return 'BYN';
}

function normalizeAmount(
  value: string,
): string {
  return value
    .replace(/[\s\u00A0\u202F]/g, '')
    .replace(',', '.');
}

function parseTotalCost(text: string): string {
  const lines = getLines(text);

  // Prefer the final numeric summary.
  // Example:
  // Всего с НДС, руб.коп.
  // 45,00

  const finalTotalIndices = lines
    .map((line, index) =>
      /^всего с ндс\s*,?\s*руб\.?\s*коп\.?$/i.test(
        line,
      )
        ? index
        : -1,
    )
    .filter((index) => index !== -1);

  for (const index of finalTotalIndices.reverse()) {
    for (
      const line of lines.slice(index + 1, index + 6)
    ) {
      const match = line.match(
        /^(\d[\d\s]*[.,]\d{2})$/,
      );

      if (match) {
        return normalizeAmount(match[1]);
      }
    }
  }

  // Example: Всего с НДС: 45,00
  for (const line of lines) {
    const match = line.match(
      /всего с ндс\s*[:\-]?\s*(\d[\d\s]*[.,]\d{2})/i,
    );

    if (match) {
      return normalizeAmount(match[1]);
    }
  }

  // Fallback: Стоимость без НДС
  const netTotalIndex = lines.findIndex(
    (line) =>
      /стоимость без ндс/i.test(line),
  );

  if (netTotalIndex !== -1) {
    for (
      const line of lines.slice(
        netTotalIndex + 1,
        netTotalIndex + 4,
      )
    ) {
      const match = line.match(
        /^(\d[\d\s]*[.,]\d{2})$/,
      );

      if (match) {
        return normalizeAmount(match[1]);
      }
    }
  }

  // Generic total fallback.
  for (const line of lines) {
    if (
      !/^(?:итого|всего)\s*[:\-]/i.test(
        line,
      )
    ) {
      continue;
    }

    const amounts = line.match(
      /\d[\d\s]*(?:[.,]\d{1,2})?/g,
    );

    if (amounts?.length) {
      const amount = normalizeAmount(
        amounts[amounts.length - 1],
      );

      if (Number(amount) > 0) {
        return amount;
      }
    }
  }

  return '';
}

function parseServiceName(text: string): string {
  const lines = getLines(text);

  const headingIndex = lines.findIndex(
    (line) =>
      /^(?:выполненные работы|описание работ)\s*:?\s*$/i.test(
        line,
      ),
  );

  const servicePattern =
    /замена|ремонт|диагностик|обслуживан|масло|тормоз|фильтр|свеч|replacement|repair|maintenance|oil change/i;

  const stopPattern =
    /^(?:компоненты и технические жидкости|итоговая стоимость заказа|стоимость без ндс|всего с ндс|гарантийные обязательства)/i;

  if (headingIndex !== -1) {
    const services: string[] = [];

    for (
      const line of lines.slice(
        headingIndex + 1,
        headingIndex + 35,
      )
    ) {
      if (stopPattern.test(line)) {
        break;
      }

      if (
        servicePattern.test(line) &&
        !/^(?:цена|надбавка|скидка|итого)/i.test(
          line,
        )
      ) {
        if (!services.includes(line)) {
          services.push(line);
        }
      }
    }

    if (services.length > 0) {
      // Your Zod schema limits serviceName
      // to 150 characters.
      return services.join('\n').slice(0, 150);
    }
  }

  const joinedLine = lines.find((line) =>
    /наименование работ\s+.+/i.test(line),
  );

  if (joinedLine) {
    const description = joinedLine
      .replace(
        /^.*?наименование работ\s*/i,
        '',
      )
      .trim();

    if (description) {
      return description.slice(0, 150);
    }
  }

  const candidate = lines.find(
    (line) =>
      servicePattern.test(line) &&
      line.length <= 180 &&
      !/итого|к оплате|всего/i.test(line),
  );

  return candidate?.slice(0, 150) ?? '';
}

function parseWorkshop(text: string): string {
  const lines = getLines(text);

  // Example: СТО «ТАНДЕМ»
  const quotedStoLine = lines.find(
    (line) =>
      /СТО\s*[«"“][^»"”]+[»"”]/i.test(
        line,
      ),
  );

  if (quotedStoLine) {
    const match = quotedStoLine.match(
      /СТО\s*[«"“]([^»"”]+)[»"”]/i,
    );

    if (match) {
      return `СТО «${match[1].trim()}»`;
    }
  }

  // Example: ООО "СТО Тандем"
  const companyLine = lines.find((line) =>
    /ООО\s*["«].*СТО/i.test(line),
  );

  if (companyLine) {
    const match = companyLine.match(
      /СТО\s+([^»"”]+)/i,
    );

    if (match) {
      return `СТО «${match[1].trim()}»`;
    }

    return companyLine.slice(0, 120);
  }

  const namedService = lines.find(
    (line) =>
      /автосервис|service center|auto service|garage/i.test(
        line,
      ),
  );

  return namedService?.slice(0, 120) ?? '';
}

export function parseServiceText(
  text: string,
): ParsedServiceData {
  return {
    date: parseDate(text),
    mileage: parseMileage(text),
    serviceName: parseServiceName(text),
    totalCost: parseTotalCost(text),
    currency: parseCurrency(text),
    workshop: parseWorkshop(text),
    rawText: text,
  };
}
