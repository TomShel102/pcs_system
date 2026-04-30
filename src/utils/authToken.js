import { createHmac, timingSafeEqual } from 'node:crypto';

const encodeBase64Url = (value) => Buffer.from(value, 'utf8').toString('base64url');
const decodeBase64Url = (value) => Buffer.from(value, 'base64url').toString('utf8');

const createSignature = (payloadBase64, secret) => {
  return createHmac('sha256', secret).update(payloadBase64).digest('base64url');
};

export const signAuthToken = (payload, secret) => {
  const payloadBase64 = encodeBase64Url(JSON.stringify(payload));
  const signature = createSignature(payloadBase64, secret);
  return `${payloadBase64}.${signature}`;
};

export const verifyAuthToken = (token, secret) => {
  if (!token || !token.includes('.')) {
    throw new Error('Token không hợp lệ');
  }

  const [payloadBase64, signature] = token.split('.');
  const expectedSignature = createSignature(payloadBase64, secret);

  const signatureBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  if (
    signatureBuffer.length !== expectedBuffer.length
    || !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw new Error('Chữ ký token không hợp lệ');
  }

  const payload = JSON.parse(decodeBase64Url(payloadBase64));
  if (!payload?.exp || Date.now() > Number(payload.exp)) {
    throw new Error('Token đã hết hạn');
  }

  return payload;
};
