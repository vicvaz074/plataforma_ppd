import bcrypt from "bcryptjs"
import { serialize } from "cookie"
import {
  getUsers,
  initializeDefaultUsers,
  ensureDemoUser,
  getUserPermissions,
  ROLE_PRESETS,
  type PlatformUser,
} from "./user-permissions"

type StoredUser = {
  name: string
  email: string
  password: string
  approved: boolean
  role?: string
}

const DEFAULT_USERS: StoredUser[] = [
  {
    name: "Alexis Cervantes Padilla",
    email: "acervantes@davara.com.mx",
    password: "$2b$10$rDECJL8/Ju685.4TyU764OQSS.N8x0BoTE5rupTK7FC/tMrhAy5Je",
    approved: true,
    role: "user",
  },
  {
    name: "Gregorio Barco Vega",
    email: "gbarco@davara.com.mx",
    password: "$2b$10$rDECJL8/Ju685.4TyU764OQSS.N8x0BoTE5rupTK7FC/tMrhAy5Je",
    approved: true,
    role: "admin",
  },
  {
    name: "David Casero",
    email: "info@haikulabs.es",
    password: "$2b$10$PU3.DVZmgrzor0NMQ88A5eM9mki2BNUSxPc.90nbagw2L6nPzX09y",
    approved: true,
    role: "user",
  },
  {
    name: "Veronica García",
    email: "veronica.garciao@oxxo.com",
    password: "$2b$10$hte6S2D7LhTxUqya7tWKdukfETPcDkK4NY/vBqEJxAO45l5jG5QFe",
    approved: true,
    role: "user",
  },
  {
    name: "Manola Izquierdo",
    email: "izquierdo.manola@gmail.com",
    password: "$2b$10$UyYUnv33oKfOxMmA60ppbej6c/GebDgVW2Qu3OhebZ9BJ9SEKuSpm",
    approved: true,
    role: "user",
  },
  {
    name: "María Elena Velazquez",
    email: "mariaelena.velazquez@bbva.com",
    password: "$2b$10$tWU29YMDlIkg..bNyoJvp.A2KHUscJ5.Pdv21WMV7hRMFC0oMk5b.",
    approved: true,
    role: "user",
  },
]

function getStoredUsers(): StoredUser[] {
  const storedUsers: StoredUser[] = JSON.parse(localStorage.getItem("users") || "[]")
  const knownEmails = new Set(storedUsers.map((user) => user.email))
  let updated = false

  DEFAULT_USERS.forEach((defaultUser) => {
    if (!knownEmails.has(defaultUser.email)) {
      storedUsers.push(defaultUser)
      knownEmails.add(defaultUser.email)
      updated = true
    }
  })

  if (updated) {
    localStorage.setItem("users", JSON.stringify(storedUsers))
  }

  return storedUsers
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

export function saveUser(user: { name: string; email: string; password: string }) {
  const users = getStoredUsers()

  if (users.some((existingUser) => existingUser.email === user.email)) {
    return
  }

  users.push({ ...user, approved: false })
  localStorage.setItem("users", JSON.stringify(users))
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<{ authenticated: boolean; user?: any }> {
  // Initialize permissions system
  initializeDefaultUsers()
  ensureDemoUser()

  // Admin hardcoded
  if (email === "admin@example.com" && password === "password") {
    return {
      authenticated: true,
      user: {
        name: "Administrador",
        email: "admin@example.com",
        role: "admin",
        modulePermissions: ROLE_PRESETS.admin,
      },
    }
  }

  // Check new platform_users store first (demo user lives here)
  const platformUsers = getUsers()
  const platformUser = platformUsers.find((u) => u.email === email && u.approved)
  if (platformUser) {
    // Demo user — password "demo123"
    if (email === "demo@example.com" && password === "demo123") {
      return {
        authenticated: true,
        user: {
          name: platformUser.name,
          email: platformUser.email,
          role: platformUser.role,
          modulePermissions: getUserPermissions(email),
        },
      }
    }
    // Other platform users with bcrypt passwords
    try {
      if (await verifyPassword(password, platformUser.password)) {
        return {
          authenticated: true,
          user: {
            name: platformUser.name,
            email: platformUser.email,
            role: platformUser.role,
            modulePermissions: getUserPermissions(email),
          },
        }
      }
    } catch { /* hash mismatch or invalid, fall through */ }
  }

  // Legacy users store
  const users = getStoredUsers()
  const user = users.find((u: StoredUser) => u.email === email && u.approved)

  if (user && (await verifyPassword(password, user.password))) {
    const perms = getUserPermissions(email)
    return {
      authenticated: true,
      user: {
        ...user,
        email: user.email,
        modulePermissions: Object.keys(perms).length > 0 ? perms : ROLE_PRESETS.editor,
      },
    }
  }

  return { authenticated: false }
}

export function setAuthCookie(res: any, token: string) {
  const cookie = serialize("auth", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
    maxAge: 3600,
    path: "/",
  })
  res.setHeader("Set-Cookie", cookie)
}
