"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UploadCloud, File as FileIcon, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFiles((prevFiles) => [...prevFiles, ...newFiles].slice(0, 5)); // Limit to 5 files
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (files.length === 0) return;

    setIsLoading(true);
    setProgress(0);

    // Mock upload progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  useEffect(() => {
    if (progress === 100) {
      setTimeout(() => {
        setIsLoading(false);
        setFiles([]);
        setPrompt("");
      }, 1000);
    }
  }, [progress]);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <UploadCloud className="h-6 w-6" />
            <span className="font-bold">STUDY-PROJECT</span>
          </div>
          <Button variant="ghost" size="icon">
            {/* Add a user icon or other actions here */}
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              AI-Powered Study Aid Generator
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Easily create diagrams and flashcards from your course materials.
              Just upload your files, add a prompt, and let our AI do the work.
            </p>
          </div>

          <Card className="mx-auto mt-10 max-w-2xl">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Upload Your Materials</CardTitle>
                <CardDescription>
                  Upload up to 5 files (PDF, DOCX, PPT). Max 5MB each.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <p>Generating your study aids... please wait.</p>
                    <Progress value={progress} className="w-full" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label
                        htmlFor="file-upload"
                        className="block text-sm font-medium text-foreground"
                      >
                        Files
                      </label>
                      <label
                        htmlFor="file-upload"
                        className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-input bg-background hover:bg-accent"
                      >
                        <UploadCloud className="h-8 w-8 text-muted-foreground" />
                        <span className="mt-2 text-sm text-muted-foreground">
                          Drag & drop or click to upload
                        </span>
                        <Input
                          id="file-upload"
                          type="file"
                          multiple
                          className="sr-only"
                          onChange={handleFileChange}
                          accept=".pdf,.docx,.pptx"
                          disabled={isLoading}
                        />
                      </label>
                      {files.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {files.map((file, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-md border bg-muted p-2"
                            >
                              <div className="flex items-center gap-2">
                                <FileIcon className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  {file.name}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFile(i)}
                                disabled={isLoading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="prompt"
                        className="block text-sm font-medium text-foreground"
                      >
                        Additional Prompts (Optional)
                      </label>
                      <Textarea
                        id="prompt"
                        placeholder="e.g., 'Focus on the key concepts from chapter 3' or 'Create a diagram explaining the water cycle'"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="min-h-[100px]"
                        disabled={isLoading}
                      />
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isLoading || files.length === 0}
                >
                  {isLoading ? "Generating..." : "Generate Study Aids"}
                </Button>
              </CardFooter>
            </form>
          </Card>
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

