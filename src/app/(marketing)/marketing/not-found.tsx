import Link from 'next/link'

export default function MarketingNotFound() {
  return (
    <main>
      <h1>We can’t find that page.</h1>
      <p>
        It may have moved. <Link href="/">Go to the home page</Link>.
      </p>
    </main>
  )
}
