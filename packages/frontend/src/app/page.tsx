import FileUpload from '@/components/file-upload';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <span className="font-bold">STUDY-PROJECT</span>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              File Upload
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Upload your files and get the extracted metadata.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-2xl">
            <FileUpload />
          </div>
        </div>
      </main>

      <footer className="border-t">
        <div className="container mx-auto flex h-14 items-center justify-center px-4 text-sm text-muted-foreground md:px-6">
          <p>
            &copy; {new Date().getFullYear()} STUDY-PROJECT. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}