import bcrypt from "bcryptjs"
import { serialize } from "cookie"

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
    role: "user",
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
  if (email === "admin@example.com" && password === "password") {
    return { authenticated: true, user: { name: "Administrador", role: "admin" } }
  }

  const users = getStoredUsers()
  const user = users.find((u: StoredUser) => u.email === email && u.approved)

  if (user && (await verifyPassword(password, user.password))) {
    return { authenticated: true, user }
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
