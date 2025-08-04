# STUDY-PROJECT Design Document

## 1. Overview

The goal of STUDY-PROJECT is to build a tool that helps users quickly generate study aids, specifically diagrams and Anki flashcards, from their course materials (like PPTs, DOCXs, and PDFs) using an AI/LLM.

This document outlines the design and implementation plan for a Minimum Viable Product (MVP) that proves the core functionality.

## 2. Core Goals & Scope (MVP)

### Goals:

-   A user can upload a single PDF file through a web interface.
-   The backend will process the PDF, extract its text content.
-   The extracted text will be sent to an external AI/LLM API.
-   The AI will generate two types of content based on the text:
    1.  A set of Anki-style flashcards (question/answer pairs).
    2.  A simple diagram representing the key concepts (e.g., in Mermaid.js format).
-   The generated cards and diagram will be displayed back to the user on the web page.

### Non-Goals (For now):

-   User accounts and authentication.
-   Saving, editing, or managing generated content.
-   Support for file types other than PDF (PPTX, DOCX will come later).
-   Direct integration with the Anki desktop app. The MVP will provide content that can be copied or downloaded.
-   Advanced diagramming features or editing.

## 3. Architecture

The project is a classic client-server application with a separate frontend and backend, which is a good separation of concerns.

-   **Frontend**: A **Next.js** application responsible for all user interaction. It will provide the file upload interface and render the results.
-   **Backend**: A **Node.js/TypeScript** server responsible for the heavy lifting. Its only job is to expose a single API endpoint that accepts a file, communicates with the AI service, and returns the processed data.
-   **AI Service**: An external, third-party LLM API. The backend will be the only part of the system that communicates with this service, keeping the API key secure.

### Data Flow (User Journey)

1.  **Upload**: The user visits the Next.js web application and is presented with a file upload form.
2.  **Request**: The user selects a PDF file. The frontend sends this file to the backend via a `multipart/form-data` REST API call.
3.  **Processing**: The Node.js backend receives the file.
    -   It uses a library (e.g., `pdf-parse`) to extract raw text from the PDF.
    -   It constructs a prompt containing the extracted text and instructions for the AI (e.g., "Create 5 Anki cards and a Mermaid flowchart from this text...").
    -   It sends this prompt to the external AI/LLM API.
4.  **Response**: The AI returns structured data (JSON) containing the generated cards and diagram.
5.  **Display**: The backend forwards this JSON response to the frontend. The Next.js app then dynamically renders the flashcards and the diagram for the user.

## 4. API Definition

A single endpoint on the backend will suffice for the MVP.

-   **Endpoint**: `POST /api/v1/process-document`
-   **Request Body**: `multipart/form-data` with a single field `file` containing the PDF.
-   **Successful Response (200 OK)**:
    ```json
    {
      "ankiCards": [
        { "front": "What is the powerhouse of the cell?", "back": "The Mitochondria" },
        { "front": "What is photosynthesis?", "back": "The process by which plants use sunlight, water, and carbon dioxide to create their own food." }
      ],
      "diagram": "graph TD;\n    A[Start] --> B{Is it sunny?};\n    B -- Yes --> C[Photosynthesize];\n    B -- No --> D[Wait];"
    }
    ```
-   **Error Responses**:
    -   `400 Bad Request`: If no file is provided or the file is not a PDF.
    -   `500 Internal Server Error`: For issues with PDF parsing or the external AI service.

## 5. Implementation Steps

### Step 1: Backend (Node.js)

Directory: `backend/`

1.  **Setup Server**: Use a simple framework like **Express.js** to create the web server in `src/main.ts`.
2.  **Create Endpoint**: Implement the `POST /api/v1/process-document` endpoint.
3.  **Handle File Uploads**: Add the `multer` library to handle `multipart/form-data` uploads. Configure it to accept a single PDF file.
4.  **Parse PDFs**: Integrate the `pdf-parse` library to read the uploaded PDF file in memory and extract its text content.
5.  **Integrate AI**:
    -   Choose an AI/LLM provider (e.g., OpenAI, Google Gemini).
    -   Use their official Node.js client library to connect to the API.
    -   Create a function that takes the extracted text, builds a prompt, and returns the structured JSON from the AI.
    -   Store the API key securely using environment variables (`.env` file).
6.  **Connect Logic**: Tie everything together in the endpoint: receive file -> parse text -> call AI -> return JSON.
7.  **CORS**: Enable CORS (Cross-Origin Resource Sharing) so the frontend (running on a different port) can call the backend API.

### Step 2: Frontend (Next.js)

Directory: `frontend/`

1.  **Create UI Component**: In `src/app/page.tsx`, build the main UI. This should include:
    -   A title and description.
    -   A styled file input (`<input type="file">`) that only accepts `.pdf` files.
    -   A "Generate" button.
    -   A loading indicator to show while the backend is working.
    -   An area to display errors.
2.  **State Management**: Use React's `useState` hook to manage the application's state:
    -   `const [file, setFile] = useState<File | null>(null);`
    -   `const [loading, setLoading] = useState<boolean>(false);`
    -   `const [error, setError] = useState<string | null>(null);`
    -   `const [results, setResults] = useState<{ ankiCards: any[], diagram: string } | null>(null);`
3.  **API Call Logic**:
    -   Create a function that is triggered when the "Generate" button is clicked.
    -   This function will use the `fetch` API to `POST` the selected file in a `FormData` object to the backend's `/api/v1/process-document` endpoint.
    -   Handle the response, updating the `loading`, `error`, and `results` state accordingly.
4.  **Render Results**:
    -   **Anki Cards**: When `results.ankiCards` is populated, map over the array and render each card in a simple styled `div` (e.g., one `div` for the front, one for the back).
    -   **Diagram**:
        -   Add the `mermaid` library to the project.
        -   Create a new React component that takes the `results.diagram` string as a prop.
        -   Use a `useEffect` hook within this component to call `mermaid.render()` to render the diagram string into an SVG. This will display the visual flowchart.

## 6. Technology Stack Summary

-   **Frontend**: Next.js, React, TypeScript, Tailwind CSS
-   **Backend**: Node.js, TypeScript, Express.js
-   **API Style**: REST
-   **File Handling**: `multer` (upload), `pdf-parse` (extraction)
-   **Diagrams**: Mermaid.js
-   **AI Integration**: Provider-specific Node.js SDK (e.g., `openai` or `google-auth-library`).

