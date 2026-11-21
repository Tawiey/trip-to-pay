import type { MileagePay, Policy } from "./types";
import { SARS_KM_RATE } from "./policy";

/** GPS km × company rate. Up to the SARS rate is tax-free (3703); any excess is taxable (3702). */
export function mileagePay(policy: Policy, km: number): MileagePay {
  const total = Math.round(km * policy.companyKmRate);
  const nonTaxable = Math.round(km * Math.min(policy.companyKmRate, SARS_KM_RATE));
  return { nonTaxable, taxable: total - nonTaxable, total };
}
