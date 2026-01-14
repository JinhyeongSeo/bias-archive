import { AuthForm } from '@/components/AuthForm'

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem-4rem)] flex items-center justify-center py-12">
      <AuthForm mode="login" />
    </div>
  )
}
