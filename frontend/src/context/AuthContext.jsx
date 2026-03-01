import { createContext, useState, useContext } from "react"

export const AuthContext = createContext()

function decodeToken(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]))
    } catch {
        return null
    }
}

export function AuthProvider({ children }) {

    const [token, setToken] = useState(
        localStorage.getItem("token")
    )

    const [userData, setUserData] = useState(() => {
        try {
            const stored = localStorage.getItem("user")
            return stored ? JSON.parse(stored) : null
        } catch {
            return null
        }
    })

    const decoded = token ? decodeToken(token) : null
    console.log('[AUTH] decoded:', decoded)
    const user = userData || decoded
    const isAdmin = decoded?.role === "admin" || decoded?.isAdmin === true
    console.log('[AUTH] isAdmin:', isAdmin)

    function login(newToken, userInfo) {
        localStorage.setItem("token", newToken)
        setToken(newToken)

        if (userInfo) {
            localStorage.setItem("user", JSON.stringify(userInfo))
            setUserData(userInfo)
        }
    }

    function logout() {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        setToken(null)
        setUserData(null)
    }

    return (
        <AuthContext.Provider value={{ token, user, isAdmin, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
