
"use client";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import axios from "axios";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FileUpload() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (!files) return;

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      await axios.post(
        "http://localhost:3001/upload",
        formData,
        {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setProgress(percentCompleted);
            }
          },
        }
      );
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      // Handle error gracefully in UI
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>File Upload</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Input
            id="picture"
            type="file"
            multiple
            onChange={handleFileChange}
          />
          <Button onClick={handleUpload} disabled={!files || uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
        {uploading && <Progress value={progress} className="w-full mt-4" />}
      </CardContent>
    </Card>
  );
}

