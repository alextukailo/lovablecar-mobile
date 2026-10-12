
export interface OcrResult {
  text: string;
}

interface OcrSpaceResponse {
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string | string[];
  ErrorDetails?: string;
  OCRExitCode?: number;
  ParsedResults?: Array<{
    ParsedText?: string;
    ErrorMessage?: string;
  }>;
}

const OCR_SPACE_ENDPOINT =
  process.env.EXPO_PUBLIC_OCR_SPACE_ENDPOINT as string;

const OCR_SPACE_API_KEY =
  process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY as string;

const OCR_BUSY_MESSAGE =
  'The OCR service is temporarily busy. ' +
  'Please wait a few minutes and try again. ' +
  'Your document has not been saved or changed.';

function getMimeType(uri: string): string {
  const cleanUri = uri.split('?')[0].toLowerCase();

  if (cleanUri.endsWith('.png')) return 'image/png';
  if (cleanUri.endsWith('.webp')) return 'image/webp';
  if (cleanUri.endsWith('.heic')) return 'image/heic';

  return 'image/jpeg';
}

function getErrorMessage(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  return value ?? '';
}

function isOcrServiceBusy(
  status: number,
  message: string,
): boolean {
  const normalized = message.toLowerCase();

  return (
    status === 429 ||
    status === 503 ||
    normalized.includes('e571') ||
    normalized.includes('free ocr api overloaded') ||
    normalized.includes('throttled') ||
    normalized.includes('too many requests')
  );
}

async function imageUriToBase64(
  uri: string,
): Promise<string> {
  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error(
      'Could not read the selected image.',
    );
  }

  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      const result = reader.result;

      if (typeof result !== 'string') {
        reject(
          new Error('Could not encode the image.'),
        );
        return;
      }

      const separatorIndex = result.indexOf(',');

      if (separatorIndex === -1) {
        reject(
          new Error(
            'The image could not be encoded as Base64.',
          ),
        );
        return;
      }

      resolve(result.slice(separatorIndex + 1));
    };

    reader.onerror = () =>
      reject(
        new Error('Could not read the image.'),
      );

    reader.readAsDataURL(blob);
  });
}

export async function recognizeDocumentText(
  imageUri: string,
): Promise<OcrResult> {
  if (!imageUri) {
    throw new Error(
      'No document image was provided.',
    );
  }

  if (!OCR_SPACE_ENDPOINT) {
    throw new Error(
      'OCR endpoint is not configured.',
    );
  }

  if (!OCR_SPACE_API_KEY) {
    throw new Error(
      'OCR API key is not configured.',
    );
  }

  const base64 = await imageUriToBase64(imageUri);
  const mimeType = getMimeType(imageUri);

  const formData = new URLSearchParams({
    language: 'eng',
    OCREngine: '2',
    isOverlayRequired: 'false',
    base64Image: `data:${mimeType};base64,${base64}`,
  });

  let response: Response;

  try {
    response = await fetch(OCR_SPACE_ENDPOINT, {
      method: 'POST',
      headers: {
        apikey: OCR_SPACE_API_KEY,
        'Content-Type':
          'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
  } catch {
    throw new Error(
      'Could not connect to the OCR service. ' +
      'Check your internet connection and try again.',
    );
  }

  // OCR.Space may return either JSON or plain text,
  // including for HTTP 503 and rate-limit errors.
  let responseText: string;

  try {
    responseText = await response.text();
  } catch {
    if (isOcrServiceBusy(response.status, '')) {
      throw new Error(OCR_BUSY_MESSAGE);
    }

    throw new Error(
      'Could not read the OCR service response.',
    );
  }

  let result: OcrSpaceResponse | null = null;

  try {
    result = JSON.parse(
      responseText,
    ) as OcrSpaceResponse;
  } catch {
    // Some OCR.Space failures return plain text
    // or an HTML error page instead of JSON.
  }

  const providerMessage = [
    getErrorMessage(result?.ErrorMessage),
    result?.ErrorDetails ?? '',
    ...(result?.ParsedResults ?? []).map(
      (item) => item.ErrorMessage ?? '',
    ),
  ]
    .filter(Boolean)
    .join(' ');

  const errorText =
    providerMessage || responseText;

  // Recognize provider overload before reporting
  // a generic HTTP error.
  if (
    isOcrServiceBusy(
      response.status,
      errorText,
    )
  ) {
    throw new Error(OCR_BUSY_MESSAGE);
  }

  if (!response.ok) {
    const statusMessage =
      response.status === 401 ||
      response.status === 403
        ? 'OCR authentication failed. Check your API key.'
        : `OCR service returned HTTP ${response.status}.`;

    throw new Error(statusMessage);
  }

  if (!result) {
    throw new Error(
      'The OCR service returned an invalid response. ' +
      'Please try again later.',
    );
  }

  if (result.IsErroredOnProcessing) {
    throw new Error(
      providerMessage ||
      'The OCR service could not read this image.',
    );
  }

  const text = (result.ParsedResults ?? [])
    .map(
      (item) =>
        item.ParsedText?.trim() ?? '',
    )
    .filter(Boolean)
    .join('\n');

  if (!text) {
    throw new Error(
      'No text was detected. ' +
      'Try a clearer photo with better lighting.',
    );
  }

  return { text };
}
