import { PublicShell } from '@/components/layout/public-shell'
import { T } from '@/components/ui/localized-text'

export const metadata = {
  title: 'About',
  description: 'About Kingdom Family Platform.',
}

export default function AboutPage() {
  return (
    <PublicShell>
      <div className="container max-w-2xl px-4 py-16 space-y-6">
        <h1 className="text-3xl font-bold"><T k="about.title" /></h1>
        <p className="text-muted-foreground leading-relaxed">
          <T k="about.description1" />
        </p>
        <p className="text-muted-foreground leading-relaxed">
          <T k="about.description2" />
        </p>
      </div>
    </PublicShell>
  )
}
