import { LinkForm } from '@/components/LinkForm'

export default function Home() {
  return (
    <div className="flex flex-col items-center pt-12 px-4 sm:px-8">
      <div className="w-full max-w-2xl">
        <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200 mb-6 text-center">
          링크 추가
        </h2>
        <LinkForm />
      </div>
    </div>
  );
}
