/** amountRefunded already includes successful refunds; reserve only in-flight requests. */
export function remainingRefundableAmount(captured: number, refunded: number, pending: number): number {
  return Math.max(captured - refunded - pending, 0);
}
