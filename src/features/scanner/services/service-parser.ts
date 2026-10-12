export interface ParsedServiceData {
  date: string;
  mileage: string;
  serviceName: string;
  totalCost: string;
  currency: 'BYN' | 'USD' | 'EUR' | 'PLN' | 'GBP' | 'RUB';
  workshop: string;
  rawText: string;
}

const CURRENCIES = ['BYN', 'USD', 'EUR', 'PLN', 'GBP', 'RUB'] as const;

type SupportedCurrency = (typeof CURRENCIES)[number];

function parseDate(text: string): string {
  const lines = text.split(/\r?\n/).map((line) => line.trim());

  const orderLine = lines.find((line) =>
    /заказ-наряд|заказ наряд|service order/i.test(line),
  );

  const match =
    orderLine?.match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/) ??
    text.match(
      /(?:дата|date)\s*[:\-]?\s*(\d{1,2})[./-](\d{1,2})[./-](\d{4})/i,
    );

  if (!match) {
    return '';
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return '';
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseMileage(text: string): string {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const isValidMileage = (value: string): boolean => {
    const digits = value.replace(/\D/g, '');

    if (!/^\d{4,7}$/.test(digits)) return false;

    const mileage = Number(digits);
    return mileage >= 1_000 && mileage <= 1_000_000;
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    const labelMatch = line.match(
      /(?:пробег|mileage|odometer)\b/i,
    );

    if (!labelMatch) continue;

    const afterLabel = line
      .slice(labelMatch.index! + labelMatch[0].length)
      .replace(/^[\s:№#-]+/, '');

    const sameLineMatch = afterLabel.match(/^\d[\d\s]*/);

    if (sameLineMatch) {
      const candidate = sameLineMatch[0].trim();

      if (isValidMileage(candidate)) {
        return candidate.replace(/\D/g, '');
      }
    }

    for (const nextLine of lines.slice(i + 1, i + 4)) {
      if (
        /^(?:выполненные работы|наименование работ|автомобиль|марка|модель|дата)\b/i.test(
          nextLine,
        )
      ) {
        break;
      }

      const numberMatch = nextLine.match(/^\s*(\d[\d\s]*)\s*$/);

      if (numberMatch && isValidMileage(numberMatch[1])) {
        return numberMatch[1].replace(/\D/g, '');
      }
    }
  }

  return '';
}


function parseCurrency(text: string): SupportedCurrency {
  if (
    /\b(BYN|BYR)\b|белорусск\w*\s+рубл|бел\.\s*руб/i.test(text)
  ) {
    return 'BYN';
  }

  if (/\bUSD\b|US\s*\$|доллар(?:а|ов)?/i.test(text)) {
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
    /\bRUB\b|₽|российск\w*\s+рубл/i.test(text)
  ) {
    return 'RUB';
  }

  return 'BYN';
}

function parseTotalCost(text: string): string {
  const lines = text.split(/\r?\n/).map((line) => line.trim());

  const finalTotalIndex = lines.findIndex((line) =>
    /всего с ндс/i.test(line),
  );

  if (finalTotalIndex !== -1) {
    const sameLine = lines[finalTotalIndex].match(
      /всего с ндс.*?(\d[\d\s]*[.,]\d{2})/i,
    );

    if (sameLine) {
      return sameLine[1].replace(/\s/g, '').replace(',', '.');
    }

    for (const line of lines.slice(finalTotalIndex + 1, finalTotalIndex + 3)) {
      const amount = line.match(/^\s*(\d[\d\s]*[.,]\d{2})\s*$/);

      if (amount) {
        return amount[1].replace(/\s/g, '').replace(',', '.');
      }
    }
  }

  const netTotalIndex = lines.findIndex((line) =>
    /стоимость без ндс/i.test(line),
  );

  if (netTotalIndex !== -1) {
    for (const line of lines.slice(netTotalIndex + 1, netTotalIndex + 3)) {
      const amount = line.match(/^\s*(\d[\d\s]*[.,]\d{2})\s*$/);

      if (amount) {
        return amount[1].replace(/\s/g, '').replace(',', '.');
      }
    }
  }

  for (const line of lines) {
    if (!/^(?:итого|всего)\s*[:\-]/i.test(line)) {
      continue;
    }

    const amounts = line.match(/\d[\d\s]*(?:[.,]\d{1,2})?/g);

    if (amounts?.length) {
      const amount = amounts[amounts.length - 1]
        .replace(/\s/g, '')
        .replace(',', '.');

      if (Number(amount) > 0) {
        return amount;
      }
    }
  }

  return '';
}

function parseServiceName(text: string): string {
  const lines = text.split(/\r?\n/).map((line) => line.trim());

  const headingIndex = lines.findIndex((line) =>
    /^(?:наименование работ|выполненные работы|описание работ)\s*:?\s*$/i.test(
      line,
    ),
  );

  if (headingIndex !== -1) {
    for (const line of lines.slice(headingIndex + 1, headingIndex + 8)) {
      if (
        /^(?:№|кол-?|количество|норма|цена|надбавка|скидка|итого)\b/i.test(
          line,
        )
      ) {
        continue;
      }

      if (
        /^(?:компоненты и технические жидкости|стоимость без ндс)\b/i.test(
          line,
        )
      ) {
        break;
      }

      if (
        /замена|ремонт|диагностик|обслуживан|масло|тормоз|фильтр|replacement|repair|maintenance|oil change/i.test(
          line,
        )
      ) {
        return line.slice(0, 250);
      }
    }
  }

  const joinedLine = lines.find((line) =>
    /наименование работ\s+.+/i.test(line),
  );

  if (joinedLine) {
    const description = joinedLine
      .replace(/^.*?наименование работ\s*/i, '')
      .trim();

    if (description) {
      return description.slice(0, 250);
    }
  }

  const candidate = lines.find(
    (line) =>
      /замена|ремонт|диагностик|обслуживан|масло|тормоз|фильтр|replacement|repair|maintenance|oil change/i.test(
        line,
      ) &&
      line.length <= 180 &&
      !/итого|к оплате|всего/i.test(line),
  );

  return candidate ?? '';
}

function parseWorkshop(text: string): string {
  const lines = text.split(/\r?\n/).map((line) => line.trim());

  // Examples: ООО "СТО Тандем", СТО «ТАНДЕМ».
  const line = lines.find((item) =>
    /(?:ООО\s*["«].*СТО|СТО\s*[«"“].+[»"”])/i.test(item),
  );

  if (line) {
    const stoMatch = line.match(/СТО\s*[«"“]?([^»"”]+)[»"”]?/i);

    if (stoMatch) {
      return `СТО «${stoMatch[1].trim()}»`;
    }

    return line.slice(0, 120);
  }

  const namedService = lines.find((item) =>
    /автосервис|service center|auto service|garage/i.test(item),
  );

  return namedService?.slice(0, 120) ?? '';
}

export function parseServiceText(text: string): ParsedServiceData {
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
