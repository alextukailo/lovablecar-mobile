
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';

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
  process.env.EXPO_PUBLIC_OCR_SPACE_ENDPOINT;

const OCR_SPACE_API_KEY =
  process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY;

const OCR_BUSY_MESSAGE =
  'The OCR service is temporarily busy. ' +
  'Please wait a few minutes and try again.';

const MAX_IMAGE_WIDTH = 1600;
const JPEG_COMPRESSION = 0.75;

// ------------------------------------
// HELPERS
// ------------------------------------

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
    normalized.includes('overloaded') ||
    normalized.includes('throttled') ||
    normalized.includes('too many requests')
  );
}

// ------------------------------------
// WEB IMAGE CONVERSION
// ------------------------------------

async function webImageToBase64(
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
          new Error('Invalid Base64 image data.'),
        );
        return;
      }

      resolve(result.slice(separatorIndex + 1));
    };

    reader.onerror = () => {
      reject(
        new Error('Could not read the image.'),
      );
    };

    reader.readAsDataURL(blob);
  });
}

// ------------------------------------
// NATIVE IMAGE PREPARATION
// ------------------------------------

async function prepareNativeImage(
  uri: string,
): Promise<string> {
  try {
    // Convert HEIC/PNG/etc. into a standard JPEG.
    // Resize large photos to reduce OCR upload size.
    const image = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: MAX_IMAGE_WIDTH,
          },
        },
      ],
      {
        compress: JPEG_COMPRESSION,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );

    return image.uri;
  } catch (error) {
    console.error(
      '[OCR] Image preparation failed:',
      error,
    );

    throw new Error(
      'Could not prepare the document image. ' +
      'Please take another photo and try again.',
    );
  }
}

async function nativeImageToBase64(
  uri: string,
): Promise<string> {
  try {
    return await FileSystem.readAsStringAsync(
      uri,
      {
        encoding: FileSystem.EncodingType.Base64,
      },
    );
  } catch (error) {
    console.error(
      '[OCR] Base64 conversion failed:',
      error,
    );

    throw new Error(
      'Could not read the document image.',
    );
  }
}

// ------------------------------------
// PREPARE OCR IMAGE
// ------------------------------------

async function prepareOcrImage(
  imageUri: string,
): Promise<string> {
  if (Platform.OS === 'web') {
    const base64 = await webImageToBase64(
      imageUri,
    );

    const lowerUri = imageUri
      .split('?')[0]
      .toLowerCase();

    const mimeType = lowerUri.endsWith('.png')
      ? 'image/png'
      : lowerUri.endsWith('.webp')
        ? 'image/webp'
        : 'image/jpeg';

    return `data:${mimeType};base64,${base64}`;
  }

  const preparedUri =
    await prepareNativeImage(imageUri);

  const base64 =
    await nativeImageToBase64(preparedUri);

  return `data:image/jpeg;base64,${base64}`;
}

// ------------------------------------
// OCR REQUEST
// ------------------------------------

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

  const base64Image =
    await prepareOcrImage(imageUri);

  const formData = new URLSearchParams({
    language: 'eng',
    OCREngine: '2',
    isOverlayRequired: 'false',
    base64Image,
  });

  let response: Response;

  try {
    response = await fetch(
      OCR_SPACE_ENDPOINT,
      {
        method: 'POST',
        headers: {
          apikey: OCR_SPACE_API_KEY,
          'Content-Type':
            'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      },
    );
  } catch (error) {
    console.error(
      '[OCR] Network error:',
      error,
    );

    throw new Error(
      'Could not connect to the OCR service. ' +
      'Check your internet connection.',
    );
  }

  // ------------------------------------
  // PARSE RESPONSE
  // ------------------------------------

  let responseText = '';

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
    // OCR.Space may return plain text or HTML.
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

  // ------------------------------------
  // HANDLE ERRORS
  // ------------------------------------

  if (
    isOcrServiceBusy(
      response.status,
      errorText,
    )
  ) {
    throw new Error(OCR_BUSY_MESSAGE);
  }

  if (!response.ok) {
    console.error(
      '[OCR] HTTP error:',
      response.status,
      errorText.slice(0, 1000),
    );

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      throw new Error(
        'OCR authentication failed. ' +
        'Check your API key.',
      );
    }

    throw new Error(
      providerMessage
        ? `OCR error: ${providerMessage}`
        : `OCR service returned HTTP ${response.status}.`,
    );
  }

  if (!result) {
    throw new Error(
      'The OCR service returned an invalid response.',
    );
  }

  if (result.IsErroredOnProcessing) {
    throw new Error(
      providerMessage ||
      'The OCR service could not read this image.',
    );
  }

  // ------------------------------------
  // EXTRACT TEXT
  // ------------------------------------

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
