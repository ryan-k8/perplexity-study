
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface ResultData {
  text: string;
  image: string;
}

interface ResultsTableProps {
  jsonData: string;
}

export default function ResultsTable({ jsonData }: ResultsTableProps) {
  const data = JSON.parse(jsonData);
  const results: ResultData[] = data.data;

  return (
    <div className="w-full">
      <h3 className="font-bold text-lg mb-2">Extracted Data</h3>
      <div className="border rounded-lg">
        <div className="grid grid-cols-2 font-semibold border-b">
          <div className="p-2">Image</div>
          <div className="p-2">Text</div>
        </div>
        {results.map((result, index) => (
          <div key={index} className="grid grid-cols-2 border-b last:border-b-0">
            <div className="p-2">
              {result.image ? (
                <a href={`http://localhost:3001/${result.image}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  {result.image}
                </a>
              ) : (
                'No image'
              )}
            </div>
            <div className="p-2">
              <Accordion type="single" collapsible>
                <AccordionItem value={`item-${index}`}>
                  <AccordionTrigger>View Text</AccordionTrigger>
                  <AccordionContent>
                    <pre className="bg-gray-100 p-2 rounded mt-2 whitespace-pre-wrap break-all">
                      {result.text}
                    </pre>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
