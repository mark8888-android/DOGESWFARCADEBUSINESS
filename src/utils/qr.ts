import QRCode from 'qrcode';

export async function generateDogeQRCode(address: string, amount: number = 25): Promise<string> {
  const dogeUri = `dogecoin:${address}?amount=${amount}&label=DogeArcade%20Play`;
  try {
    const dataUrl = await QRCode.toDataURL(dogeUri, {
      width: 320,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate Dogecoin QR code', err);
    return '';
  }
}
