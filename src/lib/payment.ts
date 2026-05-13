/**
 * Calculate installment values using simplified linear interest formula.
 *
 * Formula: installmentValue = totalAmount / installments * (1 + monthlyRate/100 * (installments - 1) / installments)
 *
 * When monthlyRate is 0, returns equal installments with no interest.
 */
export interface InstallmentInfo {
  installmentNumber: number;
  value: number;
  total: number;
}

export function calculateInstallments(
  amount: number,
  installments: number,
  monthlyRate: number,
): InstallmentInfo[] {
  if (installments <= 1 || monthlyRate === 0) {
    const value = amount / installments;
    return Array.from({ length: installments }, (_, i) => ({
      installmentNumber: i + 1,
      value: Math.round(value * 100) / 100,
      total: amount,
    }));
  }

  const rateDecimal = monthlyRate / 100;
  const baseValue = amount / installments;

  return Array.from({ length: installments }, (_, i) => {
    const factor = 1 + rateDecimal * i;
    const value = Math.round(baseValue * factor * 100) / 100;
    return {
      installmentNumber: i + 1,
      value,
      total: Math.round(baseValue * factor * installments * 100) / 100,
    };
  });
}

/**
 * Format installment label like "2x de R$ 76,50 (2% a.m.)"
 */
export function formatInstallmentLabel(
  installmentNumber: number,
  value: number,
  monthlyRate: number,
  currency = "USD",
): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  });
  const rateText = monthlyRate > 0 ? ` (${monthlyRate}% a.m.)` : "";
  return `${installmentNumber}x de ${formatter.format(value)}${rateText}`;
}

/**
 * Get the effective interest rate for a service.
 * Falls back from service.interestRate → orgSetting.defaultInterestRate → 0.
 */
export function getEffectiveInterestRate(
  serviceRate?: number | null,
  orgDefaultRate?: number | null,
): number {
  if (serviceRate != null) return serviceRate;
  if (orgDefaultRate != null) return orgDefaultRate;
  return 0;
}
