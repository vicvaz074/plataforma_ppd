import { getOnPremUserByEmail } from "@/lib/onprem/user-directory"

export type ResolvedShareTarget = {
  email: string
  name: string
}

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase()
}

export async function resolveShareTargets(values: unknown, actorEmail: string) {
  const normalizedActorEmail = normalizeEmail(actorEmail)
  const candidateEmails = Array.isArray(values)
    ? values
        .map((value) => normalizeEmail(value))
        .filter((value, index, array) => value.length > 0 && array.indexOf(value) === index)
    : []

  const resolved: ResolvedShareTarget[] = []
  const missing: string[] = []
  const selfTargets: string[] = []

  for (const targetEmail of candidateEmails) {
    if (targetEmail === normalizedActorEmail) {
      selfTargets.push(targetEmail)
      continue
    }

    const user = await getOnPremUserByEmail(targetEmail)
    if (!user || !user.approved) {
      missing.push(targetEmail)
      continue
    }

    resolved.push({
      email: user.email,
      name: user.name,
    })
  }

  return {
    resolved,
    missing,
    selfTargets,
  }
}
