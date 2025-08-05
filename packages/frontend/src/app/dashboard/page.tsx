
'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ResultsTable from '@/components/results-table';

interface Job {
  id: string;
  name: string;
  progress: number;
  returnvalue: string;
  failedReason: string;
}

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data } = await axios.get('http://localhost:3001/jobs');
        setJobs(data);
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    const interval = setInterval(fetchJobs, 5000); // Poll every 5 seconds
    fetchJobs();

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Job Dashboard</h1>
      <Accordion type="multiple" className="grid gap-4">
        {jobs.map((job) => (
          <AccordionItem value={job.id} key={job.id}>
            <Card>
              <AccordionTrigger className="p-4">
                <CardHeader>
                  <CardTitle>Job {job.id}</CardTitle>
                </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent>
                  <p>Status: {job.failedReason ? 'Failed' : (job.progress === 100 ? 'Completed' : 'In Progress')}</p>
                  <Progress value={job.progress} className="w-full mt-2 transition-all duration-500 ease-in-out" />
                  {job.failedReason && <p className="text-red-500 mt-2">Error: {job.failedReason}</p>}
                  {job.returnvalue && (
                    <div className="mt-4">
                      <ResultsTable jsonData={job.returnvalue} />
                    </div>
                  )}
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
