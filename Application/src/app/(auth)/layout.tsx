// Login page owns its own full-page layout — no wrapper needed
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
