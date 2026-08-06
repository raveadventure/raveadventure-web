import crypto from 'crypto'

// Wspólny algorytm podpisu Paybylink dla wszystkich endpointów (generate, notify, cancel):
// sha256hex(klucz_prywatny|pole1|pole2|...), pola w kolejności ustalonej dokumentacją, tylko
// niepuste. Wołający jest odpowiedzialny za przekazanie właściwych pól we właściwej kolejności.
export function paybylinkSignature(secretKey: string, values: (string | number)[]): string {
  return crypto.createHash('sha256').update([secretKey, ...values].join('|'), 'utf-8').digest('hex')
}
