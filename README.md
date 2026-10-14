# DayEase

**A personal college organizer for your classes, assignments, and study tasks.**

DayEase brings a student's day-to-day academic planning into one interface. It includes a dashboard, task inbox, weekly timetable, assignment tracker, routine import, preferences, and an AI assistant. The application can keep data in the browser and can synchronize signed-in users' organizer records with Firebase.

## Features

- **Today dashboard** for a focused view of daily classes and tasks.
- **Task inbox** with categories, deadlines, completion status, search, and filters for today, upcoming, overdue, unscheduled, and completed work.
- **College timetable** with day and week views, editable classes, times, and class details.
- **Assignment tracking** with due dates, submission status, search, and an option to create a task from an assignment.
- **Routine import** that sends a PDF or supported image to the server for Gemini timetable extraction, then lets the user review and import the proposed classes.
- **DayEase AI assistant** for college planning conversations and proposed timetable entries, assignments, and tasks. Proposed items are reviewed before import.
- **Study preferences and data controls**, including profile and study/break preferences, theme, JSON export/import, and data reset actions.
- **Google sign-in and Firestore sync** for user-scoped organizer records, with browser storage used by the organizer context as well.
- **Responsive navigation** with a desktop sidebar and mobile navigation.

## Screenshots

No screenshot assets are included in the repository archive. Add project screenshots here when they are available.

## Technology

- React 19 and TypeScript
- Vite 8 and the Vite React plugin
- Tailwind CSS 4
- Express 4 with `tsx` for the development server
- Firebase Authentication and Cloud Firestore
- Google Gemini via `@google/genai`
- Bun lockfile (`bun.lock`)

## Requirements

- Node.js compatible with the project's Vite 8 and TypeScript dependencies
- npm, or Bun if you want to use the included Bun lockfile
- A Firebase project configured for Google Authentication and Cloud Firestore
- A Gemini API key for the AI assistant and timetable extraction

## Getting started

1. Clone the repository and enter its directory.

   ```sh
   git clone https://github.com/CHROMAFADEZ/DevEase.git
   cd DevEase
   ```

2. Install dependencies.

   ```sh
   npm install
   ```

   With Bun, use `bun install` instead.

3. Configure Firebase using the project's `firebase-applet-config.json` (see [Firebase setup](#firebase-setup-and-data-security)).

4. Configure the server environment (see [Environment variables](#environment-variables)).

5. Start the development server.

   ```sh
   npm run dev
   ```

   The Express/Vite development server defaults to `http://localhost:3000`.

## Environment variables

The repository includes `.env.example`. Copy it to `.env` for local server configuration and replace the example values with your own. Do not commit `.env` or real credentials.

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | For AI features | Server-side key used by the Gemini API routes. |
| `GEMINI_MODEL` | No | Optional preferred Gemini model; the server has a default and fallback list. |
| `PORT` | No | Express server port. Defaults to `3000`. |
| `APP_URL` | Hosting-dependent | Listed in `.env.example` for the hosted app URL and integration callbacks. |

`GEMINI_API_KEY` is read by `server.ts`; it is not a Vite client variable. The checked-in example describes AI Studio Secrets as the hosted configuration method. Firebase client configuration is read from `firebase-applet-config.json`, not from these environment variables.

## Development commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Express server with Vite middleware for development. |
| `npm run build` | Build the client with Vite into `dist`. |
| `npm run preview` | Preview the Vite production build. |
| `npm run start` | Run `server.ts` with Node. |
| `npm run lint` | Run TypeScript with `tsc --noEmit`. |
| `npm run clean` | Remove `dist` and `server.js` (the script uses the Unix `rm` command). |

There is no test script or test suite in the repository archive. The `lint` script is a TypeScript check, not a test run.

## Project structure

```text
.
├── server.ts                    # Express API and Vite middleware
├── firebase-applet-config.json  # Firebase client configuration
├── firestore.rules              # Firestore access rules
├── security_spec.md             # Security invariants and threat cases
├── vite.config.ts               # Vite, React, Tailwind, aliases, HMR
└── src/
    ├── App.tsx                  # Providers and main view routing
    ├── components/
    │   ├── ai/                  # Gemini assistant UI and review flow
    │   ├── assignments/         # Assignment tracking
    │   ├── auth/                # Google sign-in screen
    │   ├── daily-reset/         # Daily reset view
    │   ├── home/                # Today dashboard and organizer modal
    │   ├── layout/              # Header and responsive navigation
    │   ├── routine/             # Routine upload and extraction review
    │   ├── settings/            # Preferences and data controls
    │   ├── tasks/               # Task inbox and task forms
    │   └── timetable/           # Class schedule
    ├── context/                 # Authentication and organizer state
    ├── data/                    # Initial/sample data
    ├── lib/firebase.ts          # Firebase initialization and helpers
    ├── types/                   # Shared TypeScript models
    └── utils/                   # Date and time helpers
```

## Firebase setup and data security

`src/lib/firebase.ts` initializes Firebase from the root `firebase-applet-config.json`, including the configured Firestore database ID. Set this file to the configuration for your own Firebase project before running the app. Enable Google as an Authentication provider and configure the authorized domains for the app's origin.

The organizer context writes user data under `/users/{uid}` subcollections: `tasks`, `classes`, `assignments`, and `dailyResets`. Review and deploy `firestore.rules` to the matching Firestore database. The supplied rules deny access by default and scope mapped records to the signed-in owner; the repository also includes `security_spec.md` describing intended invariants. Validate any rules changes against your Firebase project before deployment.

Firebase web configuration is intended to be present in the client bundle; it is not a substitute for Firestore rules or Authentication controls. Keep server credentials such as `GEMINI_API_KEY` private and configure them only in the server environment or the hosting platform's secret manager.

## AI and document processing

The server exposes `POST /api/ai-assistant` for assistant requests and `POST /api/extract-timetable` for timetable image/PDF extraction. Both require `GEMINI_API_KEY`. The extraction endpoint accepts file data and a MIME type, uses Gemini to return structured class information, and is configured with a 30 MB JSON body limit. The routine UI accepts PDF, JPEG, PNG, and WebP uploads and presents extracted classes for review before import.

Uploaded documents are sent to the configured Gemini API through the application server. Do not upload documents containing information you do not want processed by that external service. AI output can be incomplete or incorrect; review extracted and generated entries before importing them.

## Troubleshooting

- **AI features report a missing API key:** Set `GEMINI_API_KEY` in the server environment and restart the server.
- **Google sign-in fails:** Check that Google Authentication is enabled in Firebase and the app's origin is an authorized domain.
- **Firestore reports permission errors:** Confirm the Firebase config points to the expected project/database and deploy rules appropriate for that project.
- **Imported timetable is inaccurate:** Use a clear, readable PDF or image and check every proposed class in the review step before importing.
- **The app starts on a different port:** Set `PORT` in the server environment; the default is `3000`.

## Contributing

Contributions are welcome. Before opening a pull request, describe the user-facing change, keep Firebase rules and data handling aligned with the per-user security model, and run the relevant checks available in the repository. The current repository provides `npm run lint` and `npm run build`; it does not include automated tests.

## License

No license file or license declaration was present in the repository archive. All rights are reserved by default unless the project owner adds a license. Contact the maintainer before redistributing or reusing this project.

## Acknowledgements

DayEase integrates Firebase services and the Google Gemini API. See `package.json` for the complete dependency list and their respective licenses.
