import { google } from 'googleapis';

export function getAuthClient(
  serviceAccountEmail: string,
  privateKey: string
) {
  const auth = new google.auth.JWT({
    email: serviceAccountEmail,
    key: privateKey.replace(/\\n/g, '\n'),
    scopes: [
      'https://www.googleapis.com/auth/presentations',
      'https://www.googleapis.com/auth/drive',
    ],
  });

  return auth;
}

export function getSlidesClient(auth: ReturnType<typeof getAuthClient>) {
  return google.slides({ version: 'v1', auth });
}

export function getDriveClient(auth: ReturnType<typeof getAuthClient>) {
  return google.drive({ version: 'v3', auth });
}
